#!/usr/bin/env node
/**
 * 零依赖 HTTP 压测脚本（Node 18+ 原生 fetch）
 * 通过环境变量配置，可重复运行多档压测，结果追加写入 bench_results.jsonl
 *
 * 用法示例：
 *   node bench.js \
 *     TARGET_URL=http://localhost/api/health \
 *     CONCURRENCY=100 DURATION=30
 *
 *   node bench.js \
 *     TARGET_URL=http://localhost/api/admin/finance/stats \
 *     METHOD=GET CONCURRENCY=50 DURATION=30 \
 *     AUTH_LOGIN_URL=http://localhost/api/admin/login \
 *     AUTH_USER=admin AUTH_PASS=admin123
 */
'use strict';

const fs = require('fs');
const path = require('path');

const cfg = {
  url: process.env.TARGET_URL || 'http://localhost/api/health',
  method: (process.env.METHOD || 'GET').toUpperCase(),
  concurrency: parseInt(process.env.CONCURRENCY || '20', 10),
  duration: parseInt(process.env.DURATION || '30', 10),
  body: process.env.BODY ? JSON.parse(process.env.BODY) : undefined,
  auth: process.env.AUTH_LOGIN_URL || null,
  authUser: process.env.AUTH_USER || 'admin',
  authPass: process.env.AUTH_PASS || 'admin123',
  authHeader: process.env.AUTH_HEADER_NAME || 'Authorization',
  authTokenField: process.env.AUTH_TOKEN_FIELD || 'data.token',
  authPrefix: process.env.AUTH_HEADER_PREFIX || 'Bearer ',
  label: process.env.LABEL || process.env.TARGET_URL || 'target',
  ignoreTls: process.env.IGNORE_TLS === '1',
};

if (cfg.ignoreTls) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const latencies = [];
const statusCounts = {};
let success = 0;
let errors = 0;

function getField(obj, fieldPath) {
  return fieldPath.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

async function getToken() {
  if (!cfg.auth) return {};
  const res = await fetch(cfg.auth, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: cfg.authUser, password: cfg.authPass }),
  });
  const json = await res.json();
  const token = getField(json, cfg.authTokenField);
  if (!token) throw new Error('未获取到 token，登录响应: ' + JSON.stringify(json).slice(0, 200));
  return { [cfg.authHeader]: cfg.authPrefix + token };
}

async function worker(deadline, headers) {
  const opts = { method: cfg.method, headers };
  if (cfg.body && (cfg.method === 'POST' || cfg.method === 'PUT' || cfg.method === 'PATCH')) {
    opts.body = JSON.stringify(cfg.body);
  }
  while (Date.now() < deadline) {
    const start = performance.now();
    try {
      const res = await fetch(cfg.url, opts);
      const end = performance.now();
      const ms = end - start;
      latencies.push(ms);
      statusCounts[res.status] = (statusCounts[res.status] || 0) + 1;
      if (res.status < 400) success++;
      else errors++;
      // 消费响应体，确保连接回收
      await res.text();
    } catch (e) {
      const end = performance.now();
      latencies.push(end - start);
      errors++;
      statusCounts['ERR'] = (statusCounts['ERR'] || 0) + 1;
    }
  }
}

(async () => {
  const headers = cfg.body ? { 'Content-Type': 'application/json' } : {};
  if (cfg.auth) Object.assign(headers, await getToken());

  const deadline = Date.now() + cfg.duration * 1000;
  const t0 = Date.now();

  const workers = [];
  for (let i = 0; i < cfg.concurrency; i++) {
    workers.push(worker(deadline, { ...headers }));
  }
  await Promise.all(workers);

  const elapsed = (Date.now() - t0) / 1000;
  latencies.sort((a, b) => a - b);
  const pct = (p) => (latencies.length ? latencies[Math.min(latencies.length - 1, Math.floor((p / 100) * latencies.length))] : 0);
  const total = latencies.length;
  const rps = total / elapsed;
  const avg = total ? latencies.reduce((a, b) => a + b, 0) / total : 0;

  const report = {
    label: cfg.label,
    url: cfg.url,
    method: cfg.method,
    concurrency: cfg.concurrency,
    durationSec: cfg.duration,
    elapsedSec: +elapsed.toFixed(2),
    totalRequests: total,
    success,
    errors,
    errorRatePct: total ? +((errors / total) * 100).toFixed(2) : 0,
    throughputRps: +rps.toFixed(1),
    latencyMs: {
      min: total ? +latencies[0].toFixed(2) : 0,
      avg: +avg.toFixed(2),
      p50: +pct(50).toFixed(2),
      p95: +pct(95).toFixed(2),
      p99: +pct(99).toFixed(2),
      max: total ? +latencies[latencies.length - 1].toFixed(2) : 0,
    },
    statusCounts,
  };

  const outLine = JSON.stringify(report);
  console.log(outLine);
  const outFile = path.join(__dirname, 'bench_results.jsonl');
  fs.appendFileSync(outFile, outLine + '\n');
})().catch((e) => {
  console.error('压测失败:', e.message);
  process.exit(1);
});
