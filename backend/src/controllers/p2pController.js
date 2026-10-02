const response = require('../utils/response');
const logger = require('../utils/logger');
const { isUserOnline } = require('../socket');

// 查询对方是否在线（P2P取回流可达性探测）
const peerOnline = async (req, res) => {
  try {
    const peerId = parseInt(req.query.peerId);
    if (!peerId) {
      return response.badRequest(res, '缺少peerId');
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
