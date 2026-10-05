const { Op } = require('sequelize');
const { ChatLog, ChatSession } = require('../models');

// 安全审计 M-11「社交关系隐私」：一组读接口用 `?userId=` / `?peerId=` 接收目标用户 ID，
// 却只做登录校验、不做归属校验——任意登录用户带上别人的 ID 即可拉取对方的**社交关系图**
// （粉丝/关注列表）或**在线状态**。这类数据是「谁和谁有关系」，属隐私，不应对外开放。
//
// 前端这两条社交关系接口（Fans.vue / Follows.vue 经 authService.getFans/getFollows）
// 从不传 userId，只按分页查自己；因此把「跨用户读取」一律拒绝，功能面零影响。
// 在线状态（P2P 可达性探测）保留功能，但收敛到「双方已有会话/聊天记录」时才允许探测，
// 以阻断按 ID 遍历的批量在线枚举。

const PRIVATE_SCOPE = 'PRIVATE_SCOPE';
const INVALID_ID = 'INVALID_ID';

// 十进制正整数 ID（拒绝 1e5 / 0x10 / 负数 / 小数 / 空白 / 超长）
const parseId = (raw) => {
  const value = String(raw).trim();
  if (!/^\d{1,15}$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

// 社交关系读接口的目标用户解析：
//   缺省（未传）= 本人；显式指向他人 = 拒绝；格式非法 = 拒绝。
const resolveSelfScope = (rawUserId, selfId) => {
  if (rawUserId === undefined || rawUserId === null || String(rawUserId).trim() === '') {
    return { ok: true, userId: Number(selfId) };
  }
  const target = parseId(rawUserId);
  if (target === null) return { ok: false, reason: INVALID_ID };
  if (target !== Number(selfId)) return { ok: false, reason: PRIVATE_SCOPE };
  return { ok: true, userId: target };
};

// 在线状态探测的可见范围：仅限与本人已存在会话（xn_chat_room）或聊天记录（xn_chat_log）的对端。
const hasChatRelationship = async (selfId, peerId) => {
  const [session, log] = await Promise.all([
    ChatSession.findOne({
      where: {
        [Op.or]: [
          { user_id: selfId, virtual_user_id: peerId },
          { user_id: peerId, virtual_user_id: selfId }
        ]
      },
      attributes: ['id']
    }),
    ChatLog.findOne({
      where: {
        [Op.or]: [
          { fromid: selfId, toid: peerId },
          { fromid: peerId, toid: selfId }
        ]
      },
      attributes: ['id']
    })
  ]);
  return Boolean(session || log);
};

module.exports = {
  PRIVATE_SCOPE,
  INVALID_ID,
  parseId,
  resolveSelfScope,
  hasChatRelationship
};
