const response = require('../utils/response');
const logger = require('../utils/logger');
const { isUserOnline } = require('../socket');
const { parseId, hasChatRelationship } = require('../utils/socialPrivacy');

// 查询对方是否在线（P2P取回流可达性探测）
const peerOnline = async (req, res) => {
  try {
    const peerId = parseId(req.query.peerId);
    if (!peerId) {
      return response.badRequest(res, '缺少peerId');
    }
    // 审计 M-11：在线状态属社交存在性信息，此前任何登录用户拿任意 peerId 就能逐个试探，
    // 把 xn_user_session 变成「批量在线枚举」接口。收敛为：仅本人或已存在会话/聊天记录的对端可探测。
    if (peerId !== Number(req.userId) && !(await hasChatRelationship(req.userId, peerId))) {
      return response.forbidden(res, '无权探测该用户在线状态');
    }
    const online = await isUserOnline(peerId);
    response.success(res, { online }, online ? '对方在线' : '对方不在线');
  } catch (error) {
    logger.error('P2P探测错误:', error);
    response.badRequest(res, error.message);
  }
};

module.exports = {
  peerOnline
};
