const { User } = require('../models');
const { Op } = require('sequelize');
const pii = require('../utils/pii');
const levelService = require('./levelService');
const { parseQuery, getTimestamp } = require('../utils/helper');
const logger = require('../utils/logger');

// 后台实名审核（《未完成事项清单》B-2）
//
// 改造前：C 端 submitRealName 提交后只把 real_name_status 置 1（审核中），
// 后台没有任何审核入口 —— 状态永远停在 1，既不会被拒也不会通过，
// 而 levelService.backfillExperience 只把 status===2 视为已认证，
// 于是新用户永远拿不到 EXP_SOURCES.real_name_verified（100）经验。
//
// 现在：后台可按用户审核（通过 → status=2 并发放实名经验；拒绝 → status=3），
// 且「通过」用条件更新保证并发只生效一次 —— 经验只在 1/3 → 2 的状态迁移时发放，
// 不存在重复审核重复加经验的路径（C 端已认证账号也不允许再次提交，见 controllers/user.js）。

// xn_user.real_name_status：0 未认证 / 1 审核中 / 2 已认证 / 3 已拒绝
const REAL_NAME_STATUS = {
  NONE: 0,
  PENDING: 1,
  VERIFIED: 2,
  REJECTED: 3
};

const REVIEWABLE_STATUSES = [REAL_NAME_STATUS.PENDING, REAL_NAME_STATUS.REJECTED];

const RESULT_CODES = {
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  INVALID_ACTION: 'INVALID_ACTION',
  ALREADY_VERIFIED: 'ALREADY_VERIFIED',
  NOT_REVIEWABLE: 'NOT_REVIEWABLE'
};

const businessError = (code, message) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

// 列表只回脱敏后的姓名/证件号；正反面照片是审核必需品，按 URL 下发（接口仅管理端可读）。
const maskName = (value) => (value ? String(value).replace(/.(?=.{1})/g, '*') : '');
const maskIdCard = (value) => (value ? String(value).replace(/^(.{3}).*(.{4})$/, '$1***********$2') : '');

const parseStatusFilter = (status) => {
  if (status === undefined || status === null || status === '') {
    return { [Op.in]: REVIEWABLE_STATUSES };
  }
  const n = Number(status);
  if (!Number.isFinite(n) || ![0, 1, 2, 3].includes(n)) {
    throw businessError('INVALID_ACTION', '实名状态取值不合法');
  }
  return n;
};

const toListItem = (user) => ({
  userId: user.id,
  nickname: user.nickname || '',
  avatar: user.avatar || '',
  lv: Number(user.lv) || 1,
  realName: maskName(pii.decryptField(user.real_name)),
  idCard: maskIdCard(pii.decryptField(user.id_card)),
  status: Number(user.real_name_status) || 0,
  submitTime: Number(user.real_name_time) || 0
});

const toDetail = (user) => ({
  ...toListItem(user),
  // 审核需要看清证件正反面，这里返回解密后的 URL（默认返回 ''，避免把空值当链接渲染）
  front: pii.decryptField(user.real_name_front) || '',
  back: pii.decryptField(user.real_name_back) || ''
});

// 列表：默认只列「审核中 + 已拒绝」，管理员可按状态筛选；支持按用户 ID/昵称模糊搜索
const listRealNames = async ({ status, keyword, page, pageSize } = {}) => {
  const { page: safePage, pageSize: safePageSize, offset } = parseQuery({ page, pageSize });
  const where = { real_name_status: parseStatusFilter(status) };

  const kw = keyword === undefined || keyword === null ? '' : String(keyword).trim();
  if (kw) {
    const numericId = /^\d+$/.test(kw) ? Number(kw) : null;
    where[Op.or] = [
      ...(numericId ? [{ id: numericId }] : []),
      { nickname: { [Op.like]: '%' + kw + '%' } }
    ];
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    attributes: ['id', 'nickname', 'avatar', 'lv', 'real_name', 'id_card', 'real_name_status', 'real_name_time'],
    order: [['real_name_time', 'DESC']],
    limit: safePageSize,
    offset
  });

  return {
    list: (rows || []).map(toListItem),
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      total: Number(count) || 0,
      totalPages: Math.ceil((Number(count) || 0) / safePageSize) || 0
    }
  };
};

const getRealNameDetail = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw businessError(RESULT_CODES.USER_NOT_FOUND, '用户不存在');
  }
  return toDetail(user);
};

// 审核：通过 = 状态迁移 + 发放一次实名经验；拒绝 = 状态迁移。
// 状态迁移用条件更新（WHERE real_name_status IN (1,3)），并发重复点击只有一个请求能命中，
// 因此经验不会重复发放；已认证（2）再次审核返回冲突而不是静默加经验。
const reviewRealName = async (userId, action) => {
  if (action !== 'approve' && action !== 'reject') {
    throw businessError(RESULT_CODES.INVALID_ACTION, '审核动作不合法');
  }

  const user = await User.findByPk(userId, {
    attributes: ['id', 'real_name_status']
  });
  if (!user) {
    throw businessError(RESULT_CODES.USER_NOT_FOUND, '用户不存在');
  }

  const current = Number(user.real_name_status) || REAL_NAME_STATUS.NONE;
  if (current === REAL_NAME_STATUS.VERIFIED) {
    throw businessError(RESULT_CODES.ALREADY_VERIFIED, '该用户已完成实名认证，不能重复审核');
  }
  if (!REVIEWABLE_STATUSES.includes(current)) {
    throw businessError(RESULT_CODES.NOT_REVIEWABLE, '该用户没有待审核的实名认证');
  }

  const nextStatus = action === 'approve' ? REAL_NAME_STATUS.VERIFIED : REAL_NAME_STATUS.REJECTED;
  const [affected] = await User.update(
    { real_name_status: nextStatus, real_name_time: getTimestamp() },
    { where: { id: userId, real_name_status: { [Op.in]: REVIEWABLE_STATUSES } } }
  );

  if (!affected) {
    // 条件没命中：要么并发请求已先审过，要么状态在读取后被改
    throw businessError(RESULT_CODES.ALREADY_VERIFIED, '该用户实名状态已变化，请刷新后重试');
  }

  if (nextStatus !== REAL_NAME_STATUS.VERIFIED) {
    return { userId: Number(userId), status: nextStatus, expGranted: false };
  }

  // 经验是审核通过的副作用：失败不回滚审核结果（状态已落库），只记录日志并如实返回
  let exp = null;
  try {
    exp = await levelService.addExp(userId, 'real_name_verified');
  } catch (error) {
    logger.error('[实名审核] 发放实名经验失败:', error.message);
  }

  return {
    userId: Number(userId),
    status: nextStatus,
    expGranted: Boolean(exp),
    exp: exp ? { added: exp.added, lv: exp.lv, exp: exp.exp, leveledUp: exp.leveledUp } : null
  };
};

module.exports = {
  REAL_NAME_STATUS,
  RESULT_CODES,
  listRealNames,
  getRealNameDetail,
  reviewRealName
};
