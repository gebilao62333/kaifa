// 安全审计 M-13：ALLOW_INSECURE_CONFIG 原为「一个开关跳过全部生产强制校验」，
// 一次误配（或误设环境变量）即可同时关闭 JWT/DB/管理端令牌/PII 密钥/跨域/Mock 库/限流
// 共 8 道 fail-closed 防线。现改为「按项豁免」——必须显式列出要豁免的检查项名（逗号分隔）。

// 可通过 ALLOW_INSECURE_CONFIG 显式豁免的检查（属「排障期间临时放行密钥强度」一类）
const WAIVABLE_CHECKS = [
  'JWT_SECRET',
  'DB_PASSWORD',
  'ADMIN_TOKEN',
  'ADMIN_JWT_SECRET',
  'PII_ENCRYPTION_KEY'
];

// 永不可豁免：这些在生产环境没有任何合法用途，只能改配置、不能放行
const NON_WAIVABLE_CHECKS = [
  'CORS_ORIGIN',
  'USE_MOCK_DB',
  'RATE_LIMIT_DISABLED'
];

// 整体跳过语义（true/1/all/* 等）已废弃：命中只记 blanket 标记，不产生任何豁免
const BLANKET_VALUES = new Set(['true', '1', 'yes', 'y', 'on', 'all', '*']);

// 显式关闭值：等价于未配置，静默忽略（避免把默认的 false 误报为「无法识别的项」）
const DISABLED_VALUES = new Set(['false', '0', 'no', 'off', 'none']);

/**
 * 解析 ALLOW_INSECURE_CONFIG 的按项豁免清单。
 * @returns {{ blanket: boolean, waivers: Set<string>, notWaivable: string[], unknown: string[] }}
 *  - blanket：命中整体跳过值（true/1/all/* …）时为 true，调用方应拒绝并提示改用按项写法
 *  - waivers：可豁免项集合（大写、已去重）
 *  - notWaivable：请求豁免但属于不可豁免项的清单
 *  - unknown：无法识别的项
 */
const parseInsecureConfigWaivers = (raw) => {
  const tokens = String(raw == null ? '' : raw)
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const waivers = new Set();
  const notWaivable = [];
  const unknown = [];
  let blanket = false;

  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (BLANKET_VALUES.has(lower)) {
      blanket = true;
      continue;
    }
    if (DISABLED_VALUES.has(lower)) continue;

    const key = token.toUpperCase();
    if (WAIVABLE_CHECKS.includes(key)) waivers.add(key);
    else if (NON_WAIVABLE_CHECKS.includes(key)) notWaivable.push(key);
    else unknown.push(token);
  }

  return { blanket, waivers, notWaivable, unknown };
};

module.exports = {
  WAIVABLE_CHECKS,
  NON_WAIVABLE_CHECKS,
  BLANKET_VALUES,
  DISABLED_VALUES,
  parseInsecureConfigWaivers
};
