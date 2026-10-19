/**
 * 聊天生命周期清理器（时间自动撤回 + 已读自动销毁）
 *
 * 背景：两类到期时间都写在 xn_chat_log 上（服务端事实）：
 *   - expire_at：时间自动撤回（发消息时按发送方偏好写入）
 *   - destroy_at：已读自动销毁（读取方 markAsRead 时按发送方偏好写入）
 * 读接口会按这两列在读取侧兜底，所以即使清理器没跑，也不会把到期消息原文下发；
 * 本定时器负责把到期消息真正落库（撤回 is_revoked=1 / 销毁 is_del=1）并回收媒体。
 *
 * 策略：每 60 秒扫描一批到期消息，失败只记日志，不影响主服务。
 */
const logger = require('../utils/logger');

const TICK_INTERVAL = 60 * 1000; // 每 60 秒扫描一次

let timer = null;

/**
 * 执行一次清理，返回被标记的消息数。可在脚本 / 测试中单独调用。
 */
const runChatAutoRecallCleanupOnce = async () => {
  try {
    const { chatService } = require('./index');
    const revoked = await chatService.sweepExpiredMessages();
    const destroyed = await chatService.sweepDestroyedMessages();
    return { revoked, destroyed };
  } catch (e) {
    logger.error('聊天生命周期清理失败:', e.message);
    return { revoked: 0, destroyed: 0 };
  }
};

const startChatAutoRecallCleanup = () => {
  if (timer) return timer;
  timer = setInterval(() => {
    runChatAutoRecallCleanupOnce().catch(() => {});
  }, TICK_INTERVAL);
  if (timer.unref) timer.unref();
  logger.info('聊天生命周期清理器已启动（每 60 秒扫描到期撤回/销毁消息）');
  return timer;
};

const stopChatAutoRecallCleanup = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

module.exports = {
  runChatAutoRecallCleanupOnce,
  startChatAutoRecallCleanup,
  stopChatAutoRecallCleanup,
  TICK_INTERVAL
};
