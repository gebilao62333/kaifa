#!/usr/bin/env node
/**
 * eu搭子 数据库备份脚本
 * --------------------------------------------------------------------------
 * 备份 MySQL / MongoDB / Redis 三库到带时间戳的目录，并自动清理过期备份。
 *
 * 两种运行模式：
 *   1) docker（默认推荐，用于容器化部署）
 *      - 通过 `docker compose exec` 在对应容器内执行 dump
 *      - 凭证直接取自【容器内环境】，无需在宿主机配置密码，避免多 .env 不一致
 *   2) local（宿主机已安装 mysqldump / mongodump / redis-cli）
 *      - 直接调用本机二进制，凭证取自 .env（DB_、MONGO_URI、REDIS_ 等环境变量）
 *
 * 用法：
 *   node scripts/backup.js                       # 自动探测（有 docker 用 docker，否则 local）
 *   node scripts/backup.js --mode=docker         # 强制 docker 模式
 *   node scripts/backup.js --mode=local          # 强制 local 模式
 *   node scripts/backup.js --target=mysql        # 仅备份 MySQL（可填 mysql|mongo|redis|all）
 *   node scripts/backup.js --retention=7         # 保留天数（默认 7）
 *
 * 环境变量覆盖：BACKUP_MODE / BACKUP_TARGET / BACKUP_DIR / BACKUP_RETENTION_DAYS
 *
 * 调度（生产建议每日一次）：
 *   - Linux : crontab -e  ->  0 4 * * * cd /path/backend && /usr/bin/node scripts/backup.js >> backups/cron.log 2>&1
 *   - Docker: 另起一个 offline cron 容器，挂载宿主 backups 目录与 docker.sock
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const COMPOSE_FILE = path.resolve(__dirname, '../../docker-compose.yml');
const ROOT_ENV = path.resolve(__dirname, '../../.env');
const BACKUP_DIR = process.env.BACKUP_DIR || path.resolve(__dirname, '../backups');
const MODE = (process.env.BACKUP_MODE || getArg('mode') || '').toLowerCase();
const TARGET = (process.env.BACKUP_TARGET || getArg('target') || 'all').toLowerCase();
const RETENTION = parseInt(process.env.BACKUP_RETENTION_DAYS || getArg('retention') || '7', 10);

function getArg(name) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(`--${name}=`.length) : '';
}

function parseMongoUri(uri) {
  try {
    const u = new URL(uri);
    const authSrc = new URLSearchParams(u.search).get('authSource') || 'admin';
    return {
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      host: u.hostname,
      port: u.port || '27017',
      db: (u.pathname.replace(/^\//, '').split('?')[0]) || '',
      authSource: authSrc
    };
  } catch (e) {
    return { host: 'localhost', port: '27017', authSource: 'admin' };
  }
}

/** 解析 docker compose 命令前缀（优先 docker compose，回退 docker-compose） */
function resolveDockerCompose() {
  try {
    if (spawnSync('docker', ['compose', 'version'], { stdio: 'ignore' }).status === 0) {
      return ['docker', 'compose'];
    }
  } catch (e) { /* ignore */ }
  try {
    if (spawnSync('docker-compose', ['version'], { stdio: 'ignore' }).status === 0) {
      return ['docker-compose'];
    }
  } catch (e) { /* ignore */ }
  return null;
}

/**
 * 将命令的标准输出写入文件，返回是否成功。
 * @param {string[]} argv 命令与参数（数组，避免 shell 转义问题）
 * @param {string} outFile 输出文件
 * @param {string} label 日志标签
 */
function runToOutFile(argv, outFile, label) {
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const fd = fs.openSync(outFile, 'w');
  try {
    const r = spawnSync(argv[0], argv.slice(1), { stdio: ['ignore', fd, 'inherit'] });
    if (r.status !== 0) throw new Error(`exit code ${r.status}`);
    const size = fs.statSync(outFile).size;
    if (size === 0) throw new Error('输出文件为空，可能未连接数据库或无权限');
    console.log(`✅ ${label} 备份完成 -> ${outFile} (${formatSize(size)})`);
    return true;
  } catch (e) {
    console.error(`❌ ${label} 备份失败:`, e.message);
    return false;
  } finally {
    fs.closeSync(fd);
  }
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/** 校验备份产物文件是否已生成且非空 */
function checkBackupFile(outFile, label) {
  if (!fs.existsSync(outFile)) {
    console.error(`❌ ${label} 备份失败: 未生成文件`);
    return false;
  }
  const size = fs.statSync(outFile).size;
  if (size === 0) {
    console.error(`❌ ${label} 备份失败: 文件为空`);
    return false;
  }
  console.log(`✅ ${label} 备份完成 -> ${outFile} (${formatSize(size)})`);
  return true;
}

function backupMysql(mode, dc, dir) {
  const out = path.join(dir, 'mysql.sql');
  if (mode === 'docker') {
    const sh = 'mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines --events --all-databases';
    return runToOutFile([...dc, '-f', COMPOSE_FILE, 'exec', '-T', 'mysql', 'sh', '-c', sh], out, 'MySQL');
  }
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT || '3306';
  const user = process.env.DB_USER || 'root';
  const pass = process.env.DB_PASSWORD || '';
  return runToOutFile(
    ['mysqldump', '-h', host, '-P', String(port), '-u', user, `-p${pass}`,
      '--single-transaction', '--routines', '--events', '--all-databases'],
    out, 'MySQL'
  );
}

function backupMongo(mode, dc, dir) {
  const out = path.join(dir, 'mongo.archive');
  if (mode === 'docker') {
    const sh = 'mongodump --host localhost --port 27017 ' +
      '--username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" ' +
      '--authenticationDatabase admin --db "${MONGO_DATABASE:-eudazi}" --archive';
    return runToOutFile([...dc, '-f', COMPOSE_FILE, 'exec', '-T', 'mongo', 'sh', '-c', sh], out, 'MongoDB');
  }
  const m = parseMongoUri(process.env.MONGO_URI || '');
  return runToOutFile(
    ['mongodump', '--host', m.host, '--port', m.port,
      '--username', m.user, '--password', m.password,
      '--authenticationDatabase', m.authSource,
      ...(m.db ? ['--db', m.db] : []), '--archive'],
    out, 'MongoDB'
  );
}

function backupRedis(mode, dc, dir) {
  const out = path.join(dir, 'redis.rdb');
  fs.mkdirSync(dir, { recursive: true });

  if (mode === 'docker') {
    // redis 容器未把 REDIS_PASSWORD 暴露为环境变量（仅通过 --requirepass 启动参数设置），
    // 故直接用宿主机从 root .env 读取的密码（argv 传参，无需 shell 转义）。
    // 注意：redis-cli --rdb 无法向管道(/dev/stdout) ftruncate/fsync，必须写真实文件再拷出。
    const pass = process.env.REDIS_PASSWORD || 'redis123';
    const tmp = `/data/backup_rdb_${Date.now()}.rdb`;
    const base = [...dc, '-f', COMPOSE_FILE];
    const w = spawnSync(base[0], [...base.slice(1), 'exec', '-T', 'redis', 'redis-cli', '-a', pass, '--rdb', tmp]);
    if (w.status !== 0) {
      console.error('❌ Redis 备份失败: 容器内生成 RDB 失败');
      return false;
    }
    const cp = spawnSync(base[0], [...base.slice(1), 'cp', `redis:${tmp}`, out]);
    spawnSync(base[0], [...base.slice(1), 'exec', '-T', 'redis', 'rm', '-f', tmp], { stdio: 'ignore' });
    if (cp.status !== 0) {
      console.error('❌ Redis 备份失败: 从容器拷贝 RDB 失败');
      return false;
    }
    return checkBackupFile(out, 'Redis');
  }

  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = process.env.REDIS_PORT || '6379';
  const pass = process.env.REDIS_PASSWORD || '';
  const r = spawnSync('redis-cli', ['-h', host, '-p', String(port), '-a', pass, '--rdb', out],
    { stdio: ['ignore', 'inherit', 'inherit'] });
  if (r.status !== 0) {
    console.error('❌ Redis 备份失败:', r.error ? r.error.message : `exit code ${r.status}`);
    return false;
  }
  return checkBackupFile(out, 'Redis');
}

/** 清理超过保留期的历史备份目录 */
function pruneOldBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return;
  const now = Date.now();
  for (const name of fs.readdirSync(BACKUP_DIR)) {
    const dir = path.join(BACKUP_DIR, name);
    if (!fs.statSync(dir).isDirectory()) continue;
    if (!/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/.test(name)) continue;
    const ts = new Date(name.replace('_', ' ').replace(/(\d{2})-(\d{2})-(\d{2})$/, '$1:$2:$3')).getTime();
    if (isNaN(ts)) continue;
    const ageDays = (now - ts) / (24 * 3600 * 1000);
    if (ageDays > RETENTION) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`🧹 已清理过期备份: ${name} (${ageDays.toFixed(1)} 天)`);
      } catch (e) {
        console.error(`⚠️  清理失败: ${name}`, e.message);
      }
    }
  }
}

function main() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
  const runDir = path.join(BACKUP_DIR, stamp);

  console.log('========================================');
  console.log('📦 eu搭子 数据库备份');
  console.log(`🕒 时间: ${d.toLocaleString()}`);
  console.log(`📁 目标目录: ${runDir}`);

  // 决定模式
  let mode = MODE;
  let dc = null;
  if (!mode || mode === 'docker') {
    dc = resolveDockerCompose();
    if (dc && fs.existsSync(COMPOSE_FILE)) {
      mode = 'docker';
    } else if (mode === 'docker') {
      console.error('❌ 强制 docker 模式但未找到 docker compose，退出');
      process.exit(1);
    } else {
      mode = 'local';
    }
  }
  console.log(`🔧 运行模式: ${mode}${mode === 'docker' ? ` (${dc.join(' ')})` : ''}`);
  console.log(`🎯 备份目标: ${TARGET}`);
  console.log('========================================\n');

  // docker 模式：docker compose 实际从仓库根 .env 取值（如 REDIS_PASSWORD），
  // 故加载它作为覆盖，确保备份时使用的凭证与容器一致。
  if (mode === 'docker' && fs.existsSync(ROOT_ENV)) {
    require('dotenv').config({ path: ROOT_ENV, override: true });
  }

  fs.mkdirSync(runDir, { recursive: true });

  const results = {};
  const doAll = TARGET === 'all';
  if (doAll || TARGET === 'mysql') results.mysql = backupMysql(mode, dc, runDir);
  if (doAll || TARGET === 'mongo') results.mongo = backupMongo(mode, dc, runDir);
  if (doAll || TARGET === 'redis') results.redis = backupRedis(mode, dc, runDir);

  const manifest = [
    'eu搭子 数据库备份清单',
    `生成时间: ${d.toISOString()}`,
    `模式: ${mode}`,
    `目标: ${TARGET}`,
    '',
    ...Object.entries(results).map(([k, v]) => `${k}: ${v ? 'OK' : 'FAILED'}`)
  ].join('\n');
  fs.writeFileSync(path.join(runDir, 'MANIFEST.txt'), manifest);

  pruneOldBackups();

  const ok = Object.values(results).every(Boolean);
  console.log('\n========================================');
  console.log(ok ? '🎉 备份完成' : '⚠️  部分备份失败，请检查上方日志');
  console.log('========================================');
  process.exit(ok ? 0 : 1);
}

main();
