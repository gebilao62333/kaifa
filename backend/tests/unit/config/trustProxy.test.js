const {
  resolveTrustProxy,
  TRUST_PROXY_DEFAULT,
  TRUST_PROXY_NAMED
} = require('../../../src/config/trustProxy');

// 审计 H-8：req.ip 决定所有「按 IP 计」的限流分桶，解析错一个字符就等于限流失效，
// 因此这里的取值空间要逐类覆盖：默认、关闭、跳数、命名网段、IP/CIDR、以及必须拒绝的取值。
describe('Config - trustProxy 解析', () => {
  it('未设置时回落到只信任回环，并标记来源为 default', () => {
    expect(resolveTrustProxy(undefined)).toEqual({ value: TRUST_PROXY_DEFAULT, source: 'default' });
    expect(resolveTrustProxy('')).toEqual({ value: 'loopback', source: 'default' });
    expect(resolveTrustProxy('   ')).toEqual({ value: 'loopback', source: 'default' });
    expect(TRUST_PROXY_DEFAULT).toBe('loopback');
  });

  it('显式关闭信任时返回 false，且来源为 env（不能再被当成默认值）', () => {
    for (const raw of ['false', '0', 'off', 'none', 'no', 'FALSE']) {
      expect(resolveTrustProxy(raw)).toEqual({ value: false, source: 'env' });
    }
  });

  it('跳数保留为数字，0 等价于 false', () => {
    expect(resolveTrustProxy('1')).toEqual({ value: 1, source: 'env' });
    expect(resolveTrustProxy('10')).toEqual({ value: 10, source: 'env' });
    expect(resolveTrustProxy('0')).toEqual({ value: false, source: 'env' });
  });

  it('命名网段按小写规范化，多值返回数组', () => {
    expect(TRUST_PROXY_NAMED).toEqual(['loopback', 'linklocal', 'unixsocket']);
    expect(resolveTrustProxy('LOOPBACK')).toEqual({ value: 'loopback', source: 'env' });
    expect(resolveTrustProxy('loopback,linklocal')).toEqual({
      value: ['loopback', 'linklocal'],
      source: 'env'
    });
    // 容器编排里 nginx 与后端不同机：回环 + bridge 网段同时信任
    expect(resolveTrustProxy('loopback, 172.16.0.0/12 ')).toEqual({
      value: ['loopback', '172.16.0.0/12'],
      source: 'env'
    });
  });

  it('接受 IP 与 CIDR 字面量', () => {
    expect(resolveTrustProxy('127.0.0.1')).toEqual({ value: '127.0.0.1', source: 'env' });
    expect(resolveTrustProxy('10.0.0.0/8')).toEqual({ value: '10.0.0.0/8', source: 'env' });
    expect(resolveTrustProxy('::1')).toEqual({ value: '::1', source: 'env' });
    // /32 表示只信任这一台主机，与裸 IP 等价但更明确
    expect(resolveTrustProxy('123.45.67.89/32')).toEqual({ value: '123.45.67.89/32', source: 'env' });
  });

  // 这一条是本次复核新增的收口点：proxy-addr 会掩掉主机位，
  // 若放行则 123.45.67.89/24 实际信任的是整段 123.45.67.0/24，远超运维写下的那一台
  it('拒绝主机位非零的 IPv4 网段（proxy-addr 会静默掩码，等于悄悄放大信任面）', () => {
    expect(() => resolveTrustProxy('123.45.67.89/24')).toThrow(/主机位/);
    expect(() => resolveTrustProxy('10.0.0.5/8')).toThrow(/主机位/);
    expect(() => resolveTrustProxy('10.0.0.5/8')).toThrow(/10\.0\.0\.0\/8/);
  });

  // 全量信任等于把 req.ip 交给请求方随意填写；配置层拒绝启动比运行期限流失效好排查
  it.each(['true', 'TRUE', '*', 'all', 'ALL'])('拒绝全量信任取值：%s', (raw) => {
    expect(() => resolveTrustProxy(raw)).toThrow(/X-Forwarded-For/);
  });

  it('拒绝超出范围的跳数与多个跳数', () => {
    expect(() => resolveTrustProxy('11')).toThrow(/1~10/);
    expect(() => resolveTrustProxy('99')).toThrow(/1~10/);
    expect(() => resolveTrustProxy('1,2')).toThrow(/单个整数/);
  });

  it('拒绝把跳数与 IP/网段混写', () => {
    expect(() => resolveTrustProxy('1,10.0.0.0/8')).toThrow(/混写/);
  });

  it('拒绝无法识别的取值（含越界前缀、非法八位组与任意字符串）', () => {
    expect(() => resolveTrustProxy('yes')).toThrow(/无法识别/);
    expect(() => resolveTrustProxy(',,,')).toThrow(/无法识别/);
    expect(() => resolveTrustProxy('10.0.0.0/33')).toThrow(/无法识别/);
    expect(() => resolveTrustProxy('10.0.0.0/x')).toThrow(/无法识别/);
    expect(() => resolveTrustProxy('999.1.1.1')).toThrow(/无法识别/);
    expect(() => resolveTrustProxy('10.0.0.0/8/8')).toThrow(/无法识别/);
    expect(() => resolveTrustProxy('loopback;rm')).toThrow(/无法识别/);
    // /0 覆盖全网，与 true 同样危险，只是写法更隐蔽
    expect(() => resolveTrustProxy('0.0.0.0/0')).toThrow(/无法识别/);
  });

  it('拒绝把布尔值与 IP 并列（会被误读成「信任这台 IP」）', () => {
    expect(() => resolveTrustProxy('true/127.0.0.1')).toThrow(/布尔值/);
    expect(() => resolveTrustProxy('false,10.0.0.0/8')).toThrow(/布尔值/);
  });
});

// 接线检查：解析出来不给 server.js 用等于没改（旧实现是写死的 app.set('trust proxy', 1)）
describe('Config - trustProxy 装配', () => {
  const config = require('../../../src/config');

  it('src/config 导出 trustProxy 与来源标记', () => {
    expect('trustProxy' in config).toBe(true);
    expect(['env', 'default']).toContain(config.trustProxySource);
    // 测试进程未设置 TRUST_PROXY，因此取默认值 loopback
    if (process.env.TRUST_PROXY === undefined) {
      expect(config.trustProxy).toBe('loopback');
      expect(config.trustProxySource).toBe('default');
    }
    // 任何情况下都不允许出现「信任全部上游」的布尔真值
    expect(config.trustProxy).not.toBe(true);
  });

  it('rateLimit 段暴露显式开关与验证码阈值，供中间件读取', () => {
    expect(typeof config.rateLimit.disabled).toBe('boolean');
    expect(config.rateLimit.disabled).toBe(process.env.RATE_LIMIT_DISABLED === 'true');
    expect(Number.isInteger(config.rateLimit.smsMax)).toBe(true);
    expect(config.rateLimit.smsMax).toBeGreaterThan(0);
  });

  it('nodeEnvExplicit 反映 NODE_ENV 是否被显式设置（限流不再依赖它）', () => {
    expect(typeof config.nodeEnvExplicit).toBe('boolean');
  });
});
