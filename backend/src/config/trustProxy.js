/**
 * 审计 H-8：反向代理信任层级的唯一解析入口。
 *
 * Express 的 `trust proxy` 决定服务端是否采信 `X-Forwarded-For`，而这个请求头是客户端可以
 * 随便填的。原实现写死 `app.set('trust proxy', 1)`（信任一跳），意味着只要 origin 本身可达
 * （容器端口暴露、内网横向、nginx 之外的第二个入口），任何人加一跳伪造地址就能把 `req.ip`
 * 换成任意值，于是所有「按 IP 计」的限流（全局/登录/短信/卡密/上传）形同虚设，
 * 访问日志与 `xn_admin.last_login_ip` 也可被随意涂抹。
 *
 * 现在改成必须由运维显式声明，默认只信任回环地址：仓库自带的 nginx 与后端同机
 * （`nginx/conf.d/default.conf` 的 upstream 走 127.0.0.1），因此默认值就能正确取到真实
 * 客户端 IP，而外部直连者送上的 `X-Forwarded-For` 一律被忽略。
 * docker-compose 部署里 nginx 是另一个容器，来源是 bridge 地址，故 compose 显式写入
 * `TRUST_PROXY=loopback,172.16.0.0/12`；跨机部署同理，必须按实际拓扑声明反代网段。
 *
 * 取值除跳数外还做规范化校验：/0 与 true 一样是全网信任，一律拒绝；
 * 带前缀的 IPv4 必须写成网络地址（`123.45.67.89/24` 这类主机位非零的写法会被
 * proxy-addr 静默掩码成整段信任，等于悄悄放大信任面，因此直接拒绝并提示规范写法）。
 */

const NAMED_VALUES = ['loopback', 'linklocal', 'unixsocket'];
const OFF_VALUES = ['false', '0', 'off', 'none', 'no'];
const ALL_VALUES = ['true', '*', 'all'];
// IPv4 / IPv6 字面量（proxy-addr 接受字面量与 CIDR 网段两种形式）
const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;
const IPV6 = /^[0-9a-fA-F:]+$/;
const MAX_HOPS = 10;

/**
 * 判断单个取值是否为合法的 IP 字面量或 CIDR 网段。
 * 前缀长度按协议族分别限界（IPv4 ≤32、IPv6 ≤128），否则 `10.0.0.0/99` 这类
 * 打错一个数字的配置会静默变成一个几乎不收口的信任范围。
 */
function isIpOrCidr(item) {
  const [host, prefix, ...rest] = item.split('/');
  if (rest.length) return false;
  // IPv4 逐段限界，避免 999.1.1.1 这类笔误被当成合法网段
  if (!host.includes(':')) {
    if (!IPV4.test(host)) return false;
    if (host.split('.').some((octet) => Number(octet) > 255)) return false;
  } else if (!IPV6.test(host)) {
    return false;
  }
  if (prefix === undefined) return true;
  if (!/^\d{1,3}$/.test(prefix)) return false;
  // /0 匹配全网，等同于被禁止的 true，必须一并拦下
  const bits = Number(prefix);
  if (bits === 0) return false;
  return bits <= (host.includes(':') ? 128 : 32);
}

/**
 * IPv4 网段是否「主机位非零」（如 123.45.67.89/24）。
 * proxy-addr 会直接把主机位掩掉，于是这行配置实际信任的是整段网络地址——
 * 写的人往往以为只信任一台机器，信任面却凭空放大了一整段，故显式拒绝并要求写成规范形式。
 */
function hasIpv4HostBits(item) {
  const [host, prefix] = item.split('/');
  if (host.includes(':')) return false;
  const bits = prefix === undefined ? 32 : Number(prefix);
  if (bits >= 32) return false;
  const octets = host.split('.').map(Number);
  const asLong = ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (asLong & ~mask) !== 0;
}

/** 把 a.b.c.d/nn 归一成规范网络地址，仅用于错误提示 */
function ipv4Network(item) {
  const [host, prefix] = item.split('/');
  const bits = prefix === undefined ? 32 : Number(prefix);
  const o = host.split('.').map(Number);
  const asLong = ((o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  const n = (asLong & mask) >>> 0;
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.') + '/' + bits;
}

/**
 * @param {string|undefined} raw 环境变量 TRUST_PROXY 的原始值
 * @returns {{value: (boolean|number|string|string[]), source: 'env'|'default'}}
 * @throws 取值为全量信任（true、星号、all）或无法识别时抛错——配置层拒绝启动比运行期限流失效可查得多
 */
function resolveTrustProxy(raw) {
  const value = String(raw === undefined || raw === null ? '' : raw).trim();

  if (value === '') {
    return { value: 'loopback', source: 'default' };
  }

  const lower = value.toLowerCase();

  if (OFF_VALUES.includes(lower)) {
    return { value: false, source: 'env' };
  }

  if (ALL_VALUES.includes(lower)) {
    throw new Error(
      'TRUST_PROXY=' + value + ' 表示无条件信任 X-Forwarded-For，' +
      '任何直连客户端都能伪造 req.ip 并绕过全部按 IP 计的限流。' +
      '请填具体层级：1（单跳反代）、loopback（同机反代，即默认值）、反代网段（如 10.0.0.0/8），' +
      '确需完全忽略 XFF 则填 false。'
    );
  }

  const parts = value.split(',').map((item) => item.trim()).filter(Boolean);
  if (!parts.length) {
    throw new Error('TRUST_PROXY 取值无法识别："' + value + '"');
  }

  const isNumber = (item) => /^\d+$/.test(item);

  if (parts.every(isNumber)) {
    if (parts.length !== 1) {
      throw new Error('TRUST_PROXY 的跳数只能是单个整数，收到："' + value + '"');
    }
    const hops = Number(parts[0]);
    if (hops === 0) {
      return { value: false, source: 'env' };
    }
    if (hops > MAX_HOPS) {
      throw new Error('TRUST_PROXY 跳数需在 1~' + MAX_HOPS + ' 之间，当前为 ' + hops);
    }
    return { value: hops, source: 'env' };
  }

  const normalized = parts.map((item) => item.toLowerCase());

  for (const item of normalized) {
    if (NAMED_VALUES.includes(item)) continue;
    // 布尔值不能与其他层级并列，也不能写成 "true/10.0.0.0/8" 这种嵌套形式
    const hostPart = item.split('/')[0];
    if (hostPart === 'true' || hostPart === 'false') {
      throw new Error(
        'TRUST_PROXY="' + value + '" 不合法：布尔值只能单独填写，' +
        'true 表示信任所有上游代理（任何客户端都能伪造 IP），false 表示完全忽略 X-Forwarded-For，' +
        '两者都不能与 IP 或跳数并列。'
      );
    }
    if (isNumber(item)) {
      throw new Error(
        'TRUST_PROXY 不能把跳数 "' + item + '" 与 IP/网段混写："' + value + '"'
      );
    }
    if (!isIpOrCidr(item)) {
      throw new Error(
        'TRUST_PROXY 取值无法识别："' + item + '"。' +
        '可用 loopback/linklocal/unixsocket、单个跳数（1~' + MAX_HOPS + '）、IP 或 CIDR 网段，多个用逗号分隔。'
      );
    }
    if (hasIpv4HostBits(item)) {
      throw new Error(
        'TRUST_PROXY="' + item + '" 的 IPv4 主机位非零：它实际表示整段 ' + ipv4Network(item) +
        '，而不是这一台机器。要信任单台主机请写 /32（或直接写 IP），要信任整段请把地址写成网络地址。'
      );
    }
  }

  return { value: normalized.length === 1 ? normalized[0] : normalized, source: 'env' };
}

module.exports = {
  resolveTrustProxy,
  TRUST_PROXY_DEFAULT: 'loopback',
  TRUST_PROXY_NAMED: NAMED_VALUES
};
