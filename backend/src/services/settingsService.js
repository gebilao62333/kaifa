const { SystemSettings } = require('../models');

/**
 * 读取系统设置中的分账比例（0~1）。
 * 约定：value 存的是「服务者分成比例」，如 0.7 表示陪玩师得 70%、平台留 30%。
 * 缺失 / 非法 / 设置表不可用时回退 fallback。
 *
 * 现有键：
 *  - order_commission_rate  陪玩订单分成（默认 0.7）
 *  - reserve_commission_rate 预约完成结算分成（默认 1，即全额给陪玩师）
 */
const getCommissionRate = async (key, fallback) => {
  try {
    const row = await SystemSettings.findOne({ where: { key } });
    const rate = row ? Number(row.value) : NaN;
    if (Number.isFinite(rate) && rate >= 0 && rate <= 1) {
      return rate;
    }
  } catch (e) {
    // 设置表不可用时使用默认比例
  }
  return fallback;
};

module.exports = { getCommissionRate };
