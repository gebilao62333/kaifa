const response = require('./response');

// levelService.requireLevel 抛出的等级不足错误统一转成 422，
// 各控制层只需在 catch 里 return handleLevelGate(res, error)。
const isLevelGateError = (error) => !!error && error.code === 'LEVEL_NOT_ENOUGH';

const handleLevelGate = (res, error) =>
  response.unprocessableEntity(res, error.message, { level: [`需要 Lv.${error.needLevel} 才能使用该权益`] });

module.exports = { isLevelGateError, handleLevelGate };
