const { UserPref } = require('../models');
const logger = require('../utils/logger');
const { getTimestamp } = require('../utils/helper');

// P2-7：编辑资料的扩展字段在 `xn_user` 表没有对应列，统一存到
// `xn_user_pref.data.profileExtra`（复用既有偏好 JSON，不新增迁移）。
//
// 可见性分级：
//   - 公开字段（任何查看者可见）：birthday / height / profession / hobbies / games / bgImage / tags
//   - 私密字段（仅本人可见）：wechat / email
// getUserInfo 下发时按查看者身份裁剪，避免把联系方式返回给他人。
const PROFILE_EXTRA_KEY = 'profileExtra';
// price 为自报的陪玩单价（主页/卡片本就公开展示），与其余非联系方式字段同属公开
const PROFILE_EXTRA_PUBLIC_FIELDS = ['birthday', 'height', 'profession', 'hobbies', 'games', 'price', 'bgImage', 'tags'];
const PROFILE_EXTRA_PRIVATE_FIELDS = ['wechat', 'email'];
const PROFILE_EXTRA_FIELDS = [...PROFILE_EXTRA_PUBLIC_FIELDS, ...PROFILE_EXTRA_PRIVATE_FIELDS];

// 边界统一在服务端夹取：客户端传来的任何超长/越界值都不会原样落库
const LIMITS = {
  profession: 50,
  wechat: 64,
  email: 120,
  bgImage: 512,
  arrayMax: 20,
  arrayItemMax: 30,
  heightMax: 300,
  priceMax: 1000000,
  tagIdMax: 99999999
};

const toTrimmedString = (value, maxLength) => {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
};

const toIntegerOrNull = (value, max) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  const int = Math.floor(num);
  return int > 0 && int <= max ? int : null;
};

const toPriceOrNull = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0 || num > LIMITS.priceMax) return null;
  return Math.round(num * 100) / 100;
};

const toBirthday = (value) => {
  if (typeof value !== 'string') return '';
  const text = value.trim();
  // 只接受 YYYY-MM-DD（H5 date input / App uni picker 都是该格式）
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return '';
  const date = new Date(text + 'T00:00:00Z');
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getUTCFullYear();
  return year >= 1900 && year <= 2100 ? text : '';
};

const toStringArray = (value) => {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const result = [];
  for (const item of value) {
    if (typeof item !== 'string') continue;
    const text = item.trim().slice(0, LIMITS.arrayItemMax);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    result.push(text);
    if (result.length >= LIMITS.arrayMax) break;
  }
  return result;
};

const toTagIds = (value) => {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const result = [];
  for (const item of value) {
    const id = Number(item);
    if (!Number.isInteger(id) || id < 1 || id > LIMITS.tagIdMax || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
    if (result.length >= LIMITS.arrayMax) break;
  }
  return result;
};

const FIELD_NORMALIZERS = {
  birthday: toBirthday,
  height: (value) => toIntegerOrNull(value, LIMITS.heightMax),
  profession: (value) => toTrimmedString(value, LIMITS.profession),
  hobbies: toStringArray,
  games: toStringArray,
  price: toPriceOrNull,
  wechat: (value) => toTrimmedString(value, LIMITS.wechat),
  email: (value) => toTrimmedString(value, LIMITS.email),
  bgImage: (value) => toTrimmedString(value, LIMITS.bgImage),
  tags: toTagIds
};

// 读路径使用：始终返回全部 10 个字段（缺失字段为 '' / null / []），页面无需判空
const normalizeProfileExtra = (raw) => {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const extra = {};
  for (const field of PROFILE_EXTRA_FIELDS) {
    extra[field] = FIELD_NORMALIZERS[field](source[field]);
  }
  return extra;
};

// 写路径使用：只归一化「调用方显式提交」的字段，未提交的字段保持原值，
// 避免部分更新（例如只改生日）把其他字段清空。
const pickProfileExtra = (raw) => {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const picked = {};
  for (const field of PROFILE_EXTRA_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(source, field)) {
      picked[field] = FIELD_NORMALIZERS[field](source[field]);
    }
  }
  return picked;
};

// 按查看者身份裁剪：他人只能拿到公开字段；本人拿到完整 profileExtra
const profileExtraForViewer = (extra, isSelf) => {
  const normalized = normalizeProfileExtra(extra);
  if (isSelf) return normalized;
  const publicExtra = {};
  for (const field of PROFILE_EXTRA_PUBLIC_FIELDS) {
    publicExtra[field] = normalized[field];
  }
  return publicExtra;
};

const parsePrefData = (row) => {
  if (!row || !row.data) return {};
  try {
    const parsed = JSON.parse(row.data);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    return {};
  }
};

// 偏好读取失败不应让主流程失败：按空偏好降级（与 privacyPrefs 的容错口径一致）
const readPrefData = async (userId) => {
  if (!userId) return {};
  try {
    const row = await UserPref.findOne({ where: { user_id: userId }, attributes: ['data'] });
    return parsePrefData(row);
  } catch (error) {
    logger.warn('[资料扩展] 读取用户偏好失败，按空值处理:', error.message);
    return {};
  }
};

// 读-改-写整体放进事务，避免与装扮/隐私等偏好写入互相覆盖
const savePrefData = async (userId, patch) => {
  const sequelize = require('../config/mysql');
  const transaction = await sequelize.transaction();
  try {
    const row = await UserPref.findOne({ where: { user_id: userId }, transaction });
    const merged = { ...parsePrefData(row), ...patch };
    const payload = JSON.stringify(merged);
    const now = getTimestamp();
    if (row) {
      await row.update({ data: payload, update_time: now }, { transaction });
    } else {
      await UserPref.create({ user_id: userId, data: payload, update_time: now }, { transaction });
    }
    await transaction.commit();
    return merged;
  } catch (error) {
    if (transaction.finished !== 'commit') {
      try { await transaction.rollback(); } catch (rollbackError) { /* 已回滚 */ }
    }
    throw error;
  }
};

const getProfileExtra = async (userId) => {
  const data = await readPrefData(userId);
  return normalizeProfileExtra(data[PROFILE_EXTRA_KEY]);
};

const saveProfileExtra = async (userId, raw) => {
  const existing = await getProfileExtra(userId);
  const merged = { ...existing, ...pickProfileExtra(raw) };
  await savePrefData(userId, { [PROFILE_EXTRA_KEY]: merged });
  return merged;
};

module.exports = {
  PROFILE_EXTRA_KEY,
  PROFILE_EXTRA_FIELDS,
  PROFILE_EXTRA_PUBLIC_FIELDS,
  PROFILE_EXTRA_PRIVATE_FIELDS,
  LIMITS,
  normalizeProfileExtra,
  pickProfileExtra,
  profileExtraForViewer,
  parsePrefData,
  readPrefData,
  savePrefData,
  getProfileExtra,
  saveProfileExtra
};
