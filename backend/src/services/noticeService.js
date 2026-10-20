const { Notice } = require('../models');
const { Op } = require('sequelize');
const { parseQuery, getTimestamp } = require('../utils/helper');

// 平台公告（《未完成事项清单》B-3）
//
// 改造前 GET /api/notice/list 是硬编码示例数据，xn_notice 未落库、后台无 CRUD。
// 现在公告为正常内容表：
//   - C 端只读 status=1 且处于 [start_time, end_time] 有效期的公告（0 表示不限）；
//   - 后台可增删改查、置顶、上下线；
//   - B-4 的全服实时推送由 admin 控制器在写操作成功后自行调用 socket 广播（service 不依赖 socket）。

const NOTICE_TYPES = ['notice', 'activity', 'system'];

const NOTICE_NOT_FOUND = 'NOTICE_NOT_FOUND';

const notFoundError = () => {
  const error = new Error('公告不存在');
  error.code = NOTICE_NOT_FOUND;
  return error;
};

const toItem = (row) => ({
  id: row.id,
  title: row.title,
  content: row.content,
  type: row.type || 'notice',
  status: Number(row.status) || 0,
  pinned: Number(row.pinned) || 0,
  startTime: Number(row.start_time) || 0,
  endTime: Number(row.end_time) || 0,
  createTime: Number(row.create_time) || 0,
  updateTime: Number(row.update_time) || 0
});

const buildPagination = (page, pageSize, total) => ({
  page,
  pageSize,
  total,
  totalPages: Math.ceil(total / pageSize) || 0
});

// C 端：只返回「已发布 + 当前生效」的公告；置顶优先，其次按发布时间倒序
const listActive = async ({ page = 1, pageSize = 20 } = {}) => {
  const { page: safePage, pageSize: safePageSize, offset } = parseQuery({ page, pageSize });
  const now = getTimestamp();

  const where = {
    status: 1,
    [Op.and]: [
      { [Op.or]: [{ start_time: 0 }, { start_time: { [Op.lte]: now } }] },
      { [Op.or]: [{ end_time: 0 }, { end_time: { [Op.gte]: now } }] }
    ]
  };

  const { count, rows } = await Notice.findAndCountAll({
    where,
    order: [['pinned', 'DESC'], ['create_time', 'DESC']],
    limit: safePageSize,
    offset
  });

  return {
    list: (rows || []).map(toItem),
    pagination: buildPagination(safePage, safePageSize, Number(count) || 0)
  };
};

// 后台：可按状态/关键词筛选（关键词匹配标题）
const listForAdmin = async ({ status, keyword, page = 1, pageSize = 20 } = {}) => {
  const { page: safePage, pageSize: safePageSize, offset } = parseQuery({ page, pageSize });
  const where = {};

  if (status !== undefined && status !== null && status !== '') {
    const n = Number(status);
    if (![0, 1].includes(n)) {
      const error = new Error('公告状态取值不合法');
      error.code = 'INVALID_STATUS';
      throw error;
    }
    where.status = n;
  }

  const kw = keyword === undefined || keyword === null ? '' : String(keyword).trim();
  if (kw) {
    where.title = { [Op.like]: '%' + kw + '%' };
  }

  const { count, rows } = await Notice.findAndCountAll({
    where,
    order: [['pinned', 'DESC'], ['create_time', 'DESC']],
    limit: safePageSize,
    offset
  });

  return {
    list: (rows || []).map(toItem),
    pagination: buildPagination(safePage, safePageSize, Number(count) || 0)
  };
};

const getNotice = async (id) => {
  const row = await Notice.findByPk(id);
  if (!row) throw notFoundError();
  return toItem(row);
};

const sanitizePayload = (payload = {}) => {
  const title = String(payload.title === undefined || payload.title === null ? '' : payload.title).trim();
  const content = String(payload.content === undefined || payload.content === null ? '' : payload.content).trim();
  if (!title) {
    const error = new Error('公告标题不能为空');
    error.code = 'INVALID_PAYLOAD';
    throw error;
  }
  if (!content) {
    const error = new Error('公告内容不能为空');
    error.code = 'INVALID_PAYLOAD';
    throw error;
  }
  if (title.length > 120) {
    const error = new Error('公告标题不能超过120个字符');
    error.code = 'INVALID_PAYLOAD';
    throw error;
  }
  if (content.length > 5000) {
    const error = new Error('公告内容不能超过5000个字符');
    error.code = 'INVALID_PAYLOAD';
    throw error;
  }

  const type = NOTICE_TYPES.includes(payload.type) ? payload.type : 'notice';
  const status = payload.status === undefined || payload.status === null ? 1 : Number(payload.status);
  if (![0, 1].includes(status)) {
    const error = new Error('公告状态取值不合法');
    error.code = 'INVALID_PAYLOAD';
    throw error;
  }

  const toTimestamp = (value) => {
    if (value === undefined || value === null || value === '') return 0;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) {
      const error = new Error('时间参数不合法');
      error.code = 'INVALID_PAYLOAD';
      throw error;
    }
    return Math.floor(n);
  };

  return {
    title,
    content,
    type,
    status,
    pinned: payload.pinned ? 1 : 0,
    start_time: toTimestamp(payload.startTime),
    end_time: toTimestamp(payload.endTime)
  };
};

const createNotice = async (payload = {}, creatorId = 0) => {
  const data = sanitizePayload(payload);
  if (data.end_time > 0 && data.start_time > 0 && data.end_time < data.start_time) {
    const error = new Error('失效时间不能早于生效时间');
    error.code = 'INVALID_PAYLOAD';
    throw error;
  }
  const now = getTimestamp();
  const row = await Notice.create({
    ...data,
    creator_id: Number(creatorId) || 0,
    create_time: now,
    update_time: now
  });
  return toItem(row);
};

const updateNotice = async (id, payload = {}) => {
  const row = await Notice.findByPk(id);
  if (!row) throw notFoundError();

  // 部分更新：未传的字段保持原值，避免把「只改状态」写成清空正文
  const merged = {
    title: payload.title === undefined ? row.title : payload.title,
    content: payload.content === undefined ? row.content : payload.content,
    type: payload.type === undefined ? row.type : payload.type,
    status: payload.status === undefined ? row.status : payload.status,
    pinned: payload.pinned === undefined ? row.pinned : payload.pinned,
    startTime: payload.startTime === undefined ? row.start_time : payload.startTime,
    endTime: payload.endTime === undefined ? row.end_time : payload.endTime
  };
  const data = sanitizePayload(merged);
  if (data.end_time > 0 && data.start_time > 0 && data.end_time < data.start_time) {
    const error = new Error('失效时间不能早于生效时间');
    error.code = 'INVALID_PAYLOAD';
    throw error;
  }

  await row.update({ ...data, update_time: getTimestamp() });
  return toItem(row);
};

const deleteNotice = async (id) => {
  const row = await Notice.findByPk(id);
  if (!row) throw notFoundError();
  await row.destroy();
  return { id: Number(id), deleted: true };
};

module.exports = {
  NOTICE_TYPES,
  NOTICE_NOT_FOUND,
  listActive,
  listForAdmin,
  getNotice,
  createNotice,
  updateNotice,
  deleteNotice
};
