// 统一入参校验中间件。
//
// 审计 M-6：本文件此前仅被 middlewares/index.js re-export，全项目零挂载，
// 所有写接口只靠 controller 里零散的 `if (!x)` + parseFloat/parseInt，
// 负数、超大数、以及「类型绕过」（如 body 里 amount:[100] 经 parseFloat 变成 100）无统一防护。
//
// 加固点：
//   1. 数字/整数字段拒绝非标量值（数组 / 对象 / 布尔 / null）：parseFloat([100]) === 100、
//      Number([5]) === 5 是典型绕过，必须在边界拦下，而不是指望下游 Number() 的宽容语义；
//   2. 数字/整数字段接受严格的数字字符串（如表单/脚本传来的 "100"）并「回写」为数字，
//      消除下游 `parseInt/parseFloat` 的类型歧义；'1e5'、'0x10'、'Infinity'、'1,000' 一律拒绝；
//   3. min/max 作用于归一化后的数值，负数与超大数在此拦下；
//   4. 新增 enum 白名单（如提现渠道 1/2/3、红包类型 0/1）；
//   5. 校验通过后把归一化后的值回写 req.body / req.query，controller 拿到的一定是已校验的值。

// 严格十进制：可选负号 + 整数部分 + 可选小数部分。拒绝科学计数法/十六进制/千分位/前后杂字符。
const NUMERIC_STRING = /^-?\d+(?:\.\d+)?$/;

// 金额与 ID 通用上限，供各路由 schema 复用，避免「超大数」进入业务层。
//   MONEY_MAX：1 亿，远超任何正常充值/提现/红包金额；
//   ID_MAX：有符号 INT 上界，防 BIGINT 溢出的 ID 注入。
const LIMITS = {
  MONEY_MAX: 100000000,
  ID_MAX: 2147483647
};

const isBlank = (value) => value === undefined || value === null || value === '';

// 归一化数字：返回 { ok: true, value } 或 { ok: false }。
// 只接受 number 与严格的数字字符串；数组/对象/布尔/NaN/Infinity 一律判为非法。
const toFiniteNumber = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? { ok: true, value } : { ok: false };
  }
  if (typeof value === 'string') {
    const text = value.trim();
    if (!NUMERIC_STRING.test(text)) return { ok: false };
    const n = Number(text);
    return Number.isFinite(n) ? { ok: true, value: n } : { ok: false };
  }
  return { ok: false };
};

// 对单个字段套用规则；归一化后的数字会回写到 target[field]。
// 类型不符时立即返回，避免级联出一串无意义的错误。
const applyFieldRules = (field, rules, raw, target, errors) => {
  let value = raw;
  const numeric = rules.type === 'number' || rules.type === 'integer';

  if (numeric) {
    const coerced = toFiniteNumber(raw);
    if (!coerced.ok) {
      errors.push(`${field}必须是${rules.type === 'integer' ? '整数' : '数字'}`);
      return;
    }
    if (rules.type === 'integer' && !Number.isInteger(coerced.value)) {
      errors.push(`${field}必须是整数`);
      return;
    }
    value = coerced.value;
    target[field] = value;
  } else if (rules.type === 'string') {
    if (typeof raw !== 'string') {
      errors.push(`${field}必须是字符串`);
      return;
    }
  } else if (rules.type === 'boolean') {
    if (typeof raw !== 'boolean') {
      errors.push(`${field}必须是布尔值`);
      return;
    }
  }

  if (rules.minLength !== undefined && typeof value === 'string' && value.length < rules.minLength) {
    errors.push(`${field}长度不能少于${rules.minLength}个字符`);
  }

  if (rules.maxLength !== undefined && typeof value === 'string' && value.length > rules.maxLength) {
    errors.push(`${field}长度不能超过${rules.maxLength}个字符`);
  }

  if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
    errors.push(`${field}不能小于${rules.min}`);
  }

  if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
    errors.push(`${field}不能大于${rules.max}`);
  }

  if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
    errors.push(`${field}格式不正确`);
  }

  if (Array.isArray(rules.enum) && !rules.enum.includes(value)) {
    errors.push(`${field}取值不合法`);
  }
};

const sendErrors = (res, errors) => res.status(400).json({
  code: 400,
  message: errors.join('；')
});

const validate = (schema) => {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      req.body = {};
    }
    const body = req.body;
    const errors = [];

    for (const field of schema.required || []) {
      if (isBlank(body[field])) {
        errors.push(`${field}是必填字段`);
      }
    }

    for (const [field, rules] of Object.entries(schema.fields || {})) {
      const raw = body[field];
      if (isBlank(raw)) continue; // 可选字段缺失/空串直接跳过
      applyFieldRules(field, rules, raw, body, errors);
    }

    if (errors.length > 0) {
      return sendErrors(res, errors);
    }

    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const query = req.query || {};
    const errors = [];

    for (const [field, rules] of Object.entries(schema.fields || {})) {
      const raw = query[field];
      if (raw === undefined || raw === null) continue;

      if (rules.type === 'number' || rules.type === 'integer') {
        const coerced = toFiniteNumber(raw);
        if (!coerced.ok) {
          errors.push(`${field}必须是有效的数字`);
          continue;
        }
        if (rules.type === 'integer' && !Number.isInteger(coerced.value)) {
          errors.push(`${field}必须是整数`);
          continue;
        }
        query[field] = coerced.value;
        if (rules.min !== undefined && coerced.value < rules.min) {
          errors.push(`${field}不能小于${rules.min}`);
        }
        if (rules.max !== undefined && coerced.value > rules.max) {
          errors.push(`${field}不能大于${rules.max}`);
        }
      } else if (rules.type === 'string') {
        if (typeof raw !== 'string') {
          errors.push(`${field}必须是字符串`);
          continue;
        }
        if (rules.maxLength !== undefined && raw.length > rules.maxLength) {
          errors.push(`${field}长度不能超过${rules.maxLength}个字符`);
        }
        if (Array.isArray(rules.enum) && !rules.enum.includes(raw)) {
          errors.push(`${field}取值不合法`);
        }
      }
    }

    if (errors.length > 0) {
      return sendErrors(res, errors);
    }

    next();
  };
};

module.exports = {
  validate,
  validateQuery,
  LIMITS
};
