/**
 * 未接通通话单清理器
 *
 * 背景：每次打开通话页都会 POST /api/trtc/start 建一条 xn_call_record（呼叫即建单）。
 * 若这通电话最终没人接（对方离线 / 呼叫方直接关页面 / 进程被杀），这条单会永远停在
 * status=0「呼叫中」，在通话记录里表现为一通永不结束的电话。
 *
 * 策略：定时把创建超过 RING_TIMEOUT 秒仍为 status=0 的单标记为 status=5「无应答」
 *      （5 的语义前端 getCallStatusText 已支持），保留记录、不再占用「呼叫中」。
 */
const { Op } = require('sequelize');
const { CallRecord } = require('../models');
const { getTimestamp } = require('../utils/helper');
const logger = require('../utils/logger');

const TICK_INTERVAL = 60 * 1000; // 每 60 秒扫描一次
const RING_TIMEOUT = 120;        // 响铃超过 120 秒仍未接通 → 无应答

let timer = null;
let running = false;

/**
 * 执行一次清理，返回被标记的通话数。
 * 可在脚本 / 测试中单独调用。
 */
const runCallRecordCleanupOnce = async () => {
  if (running) return 0;
  running = true;
  try {
    const now = getTimestamp();
    const [affected] = await CallRecord.update(
      { status: 5, end_time: now, end_reason: 'unanswered_timeout' },
      { where: { status: 0, create_time: { [Op.lt]: now - RING_TIMEOUT } } }
    );
    if (affected > 0) {
      logger.info(`通话单清理：${affected} 通未接来电已标记为「无应答」`);
    }
    return affected || 0;
  } catch (e) {
    logger.error('通话单清理失败:', e.message);
    return 0;
  } finally {
    running = false;
  }
};

const startCallRecordCleanup = () => {
  if (timer) return timer;
  timer = setInterval(() => {
    runCallRecordCleanupOnce().catch(() => {});
  }, TICK_INTERVAL);
  if (timer.unref) timer.unref();
  logger.info('通话单清理器已启动（每 60 秒检查未接通的通话单）');
  return timer;
};

const stopCallRecordCleanup = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

module.exports = {
  runCallRecordCleanupOnce,
  startCallRecordCleanup,
  stopCallRecordCleanup,
  TICK_INTERVAL,
  RING_TIMEOUT
};
