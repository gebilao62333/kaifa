// SQL 片段安全工具
// 背景（审计 H9）：多处使用 sequelize.literal(`money - ${value}`) 直接拼接数字。
// 虽然上游多数已做 Number() 转换，但"拼接"模式一旦有人改成拼接用户字符串就是注入。
// 统一走这里：先校验为有限数字，再用 sequelize.escape 生成字面量。
const sequelize = require('../config/mysql');

const assertFiniteNumber = (value, label = '数值') => {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new Error(label + '必须为有限数字');
  }
  return n;
};

// 生成 "column - n" 的安全字面量，用于原子更新余额。
// 经过 Number.isFinite 校验后，String(n) 一定是合法数字字面量（形如 -1.5 / 1e-7），
// 不可能带出引号、分号等注入字符，因此不依赖 sequelize.escape（也便于单测 mock）。
const moneyMinus = (column, amount) => {
  const n = assertFiniteNumber(amount, '金额');
  return sequelize.literal(column + ' - ' + String(n));
};

const moneyPlus = (column, amount) => {
  const n = assertFiniteNumber(amount, '金额');
  return sequelize.literal(column + ' + ' + String(n));
};

// 归一化「受影响行数」。
// 背景：Sequelize 6.x 在 MySQL 下，Model.decrement/keyword 的返回值比 Model.update 多一层嵌套：
//   Model.update(...)    -> [1]          / [0]
//   Model.decrement(...) -> [[null, 1]]  / [[null, 0]]
// 历史上调用方直接解构 res[0] 后判定，导致两类事故：
//   1) Number([null, 1]) === NaN，永远 !== 1  → 礼物提现即使余额充足也一律被判「余额不足」；
//   2) Boolean([null, 0]) === true，永不为假 → 余额不足时条件扣减的失败分支不会被触发。
// 这里统一抹平差异，返回纯数字（同时兼容单测里 mock 成 [1] / [0] 的写法）。
const affectedCount = (result) => {
  const first = Array.isArray(result) ? result[0] : result;
  if (Array.isArray(first)) {
    const nums = first.filter((x) => x !== null && x !== undefined && Number.isFinite(Number(x)));
    return nums.length ? Number(nums[nums.length - 1]) : 0;
  }
  return Number(first);
};

module.exports = { assertFiniteNumber, moneyMinus, moneyPlus, affectedCount };
