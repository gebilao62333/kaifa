const { UserPref } = require('../models');
const { Op } = require('sequelize');
const logger = require('./logger');

// 《未完成事项清单》C-9：4 个隐私开关的服务端消费点。
//
// 状态存于 xn_user_pref.data.privacy（与 autoRecall/autoDestroy 同一对象），由 C 端
// POST /api/user/pref 写入。此前只有 auto* 两项被服务端消费，下面四个开关只存在于
// localStorage，服务端完全不感知；本模块提供统一读取（含默认值与批量读取），供：
//   - showLocation ：GET /api/user/get 对非本人隐藏城市
//   - allowVisit   ：POST /api/user/visit 不再写入访问记录
//   - showOnline   ：GET /api/p2p/peer-online 对他人返回「不在线」
//   - allowSearch  ：/api/games/search 结果中隐藏该用户
const PRIVACY_DEFAULTS = {
  showOnline: true,
  showLocation: true,
  allowVisit: true,
  allowSearch: true
};

const toBool = (value, fallback) => {
  if (value === undefined || value === null) return fallback;
  return Boolean(value);
};

const normalizePrivacy = (raw) => {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    showOnline: toBool(source.showOnline, PRIVACY_DEFAULTS.showOnline),
    showLocation: toBool(source.showLocation, PRIVACY_DEFAULTS.showLocation),
    allowVisit: toBool(source.allowVisit, PRIVACY_DEFAULTS.allowVisit),
    allowSearch: toBool(source.allowSearch, PRIVACY_DEFAULTS.allowSearch)
  };
};

const parsePrefData = (row) => {
  if (!row || !row.data) return {};
  try {
    return JSON.parse(row.data) || {};
  } catch (error) {
    return {};
  }
};

const getPrivacyPrefs = async (userId) => {
  if (!userId) return { ...PRIVACY_DEFAULTS };
  try {
    const row = await UserPref.findOne({ where: { user_id: userId }, attributes: ['data'] });
    return normalizePrivacy(parsePrefData(row).privacy);
  } catch (error) {
    // 偏好读取失败不应让主流程失败：按默认（全部公开）降级，与历史行为一致
    logger.warn('[隐私] 读取用户偏好失败，按默认值处理:', error.message);
    return { ...PRIVACY_DEFAULTS };
  }
};

// 批量读取（搜索/列表场景）：返回 { [userId]: prefs }，缺失行用默认值补齐
const getPrivacyPrefsForUsers = async (userIds = []) => {
  const ids = [...new Set((Array.isArray(userIds) ? userIds : []).map(Number).filter((id) => Number.isSafeInteger(id) && id > 0))];
  const result = {};
  ids.forEach((id) => { result[id] = { ...PRIVACY_DEFAULTS }; });
  if (ids.length === 0) return result;
  try {
    const rows = await UserPref.findAll({
      where: { user_id: { [Op.in]: ids } },
      attributes: ['user_id', 'data']
    });
    for (const row of rows || []) {
      result[row.user_id] = normalizePrivacy(parsePrefData(row).privacy);
    }
  } catch (error) {
    logger.warn('[隐私] 批量读取用户偏好失败，按默认值处理:', error.message);
  }
  return result;
};

// VIP 隐身访问设置（StealthVisit 页写入 xn_user_pref.data.stealthSettings）
//   stealth/hideOnline：对他人隐藏在线状态
//   stealthBrowse：浏览他人主页不写访问记录
//   muteNotify：预留（站内暂无推送通道）
const STEALTH_DEFAULTS = {
  stealth: false,
  hideOnline: false,
  stealthBrowse: false,
  muteNotify: false
};

const normalizeStealth = (raw) => {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    stealth: toBool(source.stealth, STEALTH_DEFAULTS.stealth),
    hideOnline: toBool(source.hideOnline, STEALTH_DEFAULTS.hideOnline),
    stealthBrowse: toBool(source.stealthBrowse, STEALTH_DEFAULTS.stealthBrowse),
    muteNotify: toBool(source.muteNotify, STEALTH_DEFAULTS.muteNotify)
  };
};

const getStealthSettings = async (userId) => {
  if (!userId) return { ...STEALTH_DEFAULTS };
  try {
    const row = await UserPref.findOne({ where: { user_id: userId }, attributes: ['data'] });
    return normalizeStealth(parsePrefData(row).stealthSettings);
  } catch (error) {
    logger.warn('[隐身] 读取用户隐身设置失败，按默认值处理:', error.message);
    return { ...STEALTH_DEFAULTS };
  }
};

// U-20：优先匹配开关（PriorityMatching 页写入 priorityMatchingSettings.priorityPush）。
// 返回开启优先匹配的用户 id 集合，供列表/搜索在当页内把 VIP 优先展示。
const getPriorityUserIds = async (userIds = []) => {
  const ids = [...new Set((Array.isArray(userIds) ? userIds : []).map(Number).filter((id) => Number.isSafeInteger(id) && id > 0))];
  if (ids.length === 0) return new Set();
  try {
    const rows = await UserPref.findAll({
      where: { user_id: { [Op.in]: ids } },
      attributes: ['user_id', 'data']
    });
    const result = new Set();
    for (const row of rows || []) {
      const data = parsePrefData(row);
      if (data.priorityMatchingSettings && data.priorityMatchingSettings.priorityPush) {
        result.add(Number(row.user_id));
      }
    }
    return result;
  } catch (error) {
    logger.warn('[优先匹配] 读取用户偏好失败:', error.message);
    return new Set();
  }
};

module.exports = {
  PRIVACY_DEFAULTS,
  STEALTH_DEFAULTS,
  getPriorityUserIds,
  normalizePrivacy,
  normalizeStealth,
  getPrivacyPrefs,
  getPrivacyPrefsForUsers,
  getStealthSettings
};
