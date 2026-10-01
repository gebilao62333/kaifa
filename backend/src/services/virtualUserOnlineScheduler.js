/**
 * 虚拟人随机在线调度器
 *
 * 对开启了 random_online 的虚拟人，按配置的在线时段与随机时长自动上下线：
 * - 允许时段外：强制下线
 * - 允许时段内：随机上线；每次在线持续 random(min,max) 分钟；
 *   下线后等待 5~30 分钟再随机尝试上线
 * - 不开启 random_online 的虚拟人完全不受影响（手动管理）
 */
const { VirtualUser } = require('../models');
const { getTimestamp } = require('../utils/helper');
const logger = require('../utils/logger');

const TICK_INTERVAL = 30 * 1000; // 每 30 秒检查一次
const RETRY_MIN = 5; // 下线后等待最短分钟
const RETRY_MAX = 30; // 下线后等待最长分钟

const nextAttemptMap = new Map(); // virtualUserId -> 下次允许尝试上线时间戳（0=可立即尝试）

let timer = null;
let running = false;

const randomInt = (min, max) => {
  const m = Math.min(min, max);
  const M = Math.max(min, max);
  return Math.floor(Math.random() * (M - m + 1)) + m;
};

const toMinutes = (hhmm) => {
  if (!hhmm || typeof hhmm !== 'string') return null;
  const parts = hhmm.split(':');
  if (parts.length !== 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

/**
 * 判断时间戳是否处于允许在线时段内（支持跨天，如 22:00-02:00）
 */
const isInOnlineWindow = (start, end, timestamp) => {
  const cur = toMinutes(start);
  const endMin = toMinutes(end);
  if (cur === null || endMin === null) return false;

  const date = new Date((timestamp || getTimestamp()) * 1000);
  const nowMin = date.getHours() * 60 + date.getMinutes();

  if (cur === endMin) {
    // 起始等于结束视为全天在线
    return true;
  }
  if (cur < endMin) {
    return nowMin >= cur && nowMin < endMin;
  }
  // 跨天，如 22:00-02:00
  return nowMin >= cur || nowMin < endMin;
};

const goOffline = async (user) => {
  await VirtualUser.update(
    { online_status: 0, online_until: 0, update_time: getTimestamp() },
    { where: { id: user.id, online_status: 1 } }
  );
  logger.info(`虚拟人随机调度: ${user.name}(ID:${user.id}) 下线`);
};

const goOnline = async (user) => {
  const min = Number(user.online_duration_min) || 30;
  const max = Number(user.online_duration_max) || 90;
  const durationMin = randomInt(min, max);
  const until = getTimestamp() + durationMin * 60;

  await VirtualUser.update(
    { online_status: 1, online_until: until, update_time: getTimestamp() },
    { where: { id: user.id, online_status: 0 } }
  );
  logger.info(`虚拟人随机调度: ${user.name}(ID:${user.id}) 上线，本次在线 ${durationMin} 分钟`);
};

const runOnlineSchedulerOnce = async () => {
  if (running) return;
  running = true;
  try {
    const users = await VirtualUser.findAll({
      where: { random_online: 1, status: 1 },
      attributes: ['id', 'name', 'online_status', 'online_until', 'online_time_start', 'online_time_end', 'online_duration_min', 'online_duration_max']
    });

    const now = getTimestamp();

    for (const user of users) {
      const inWindow = isInOnlineWindow(user.online_time_start, user.online_time_end, now);

      if (!inWindow) {
        nextAttemptMap.set(user.id, 0);
        if (user.online_status === 1) {
          await goOffline(user);
        }
        continue;
      }

      if (user.online_status === 1) {
        if (user.online_until > 0 && now >= user.online_until) {
          await goOffline(user);
          nextAttemptMap.set(user.id, now + randomInt(RETRY_MIN, RETRY_MAX) * 60);
        }
        continue;
      }

      // 离线且在时段内：尝试随机上线
      const next = nextAttemptMap.get(user.id) || 0;
      if (now >= next && Math.random() < 0.5) {
        await goOnline(user);
        nextAttemptMap.set(user.id, 0);
      }
    }
  } catch (err) {
    logger.error('虚拟人随机调度执行失败:', err.message);
  } finally {
    running = false;
  }
};

const startVirtualUserOnlineScheduler = () => {
  if (timer) return timer;
  timer = setInterval(runOnlineSchedulerOnce, TICK_INTERVAL);
  timer.unref && timer.unref();
  logger.info('虚拟人随机在线调度器已启动，每 30 秒检查一次');
  return timer;
};

const stopVirtualUserOnlineScheduler = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  nextAttemptMap.clear();
};

module.exports = {
  startVirtualUserOnlineScheduler,
  stopVirtualUserOnlineScheduler,
  runOnlineSchedulerOnce,
  isInOnlineWindow,
  randomInt
};
