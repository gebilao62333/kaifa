const response = require('../utils/response');
const logger = require('../utils/logger');
const blockService = require('../services/blockService');

// U-22：发消息前检查双向黑名单，命中则 403，不进入聊天写库
module.exports = async (req, res, next) => {
  try {
    const targetUserId = parseInt(req.body.targetUserId || req.query.targetUserId, 10);
    if (!targetUserId) return next();
    const blocked = await blockService.isBlockedEither(req.userId, targetUserId);
    if (blocked) return response.forbidden(res, '对方已将你拉黑，或你已拉黑对方');
    return next();
  } catch (error) {
    // 黑名单查询异常不影响正常聊天（fail-open）
    logger.error('[黑名单] 中间件异常，放行:', error.message);
    return next();
  }
};
