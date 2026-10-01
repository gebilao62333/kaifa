// 控制器层（Controller）：薄层，负责解析请求、调用 Service、组装响应。
const response = require('../utils/response');
const service = require('../services/downloadService');

const getList = (req, res) => {
  try {
    const { platform, status, keyword, page, pageSize } = req.query;
    return response.success(res, service.list({ platform, status, keyword, page, pageSize }));
  } catch (e) {
    return response.error(res, '获取下载列表失败: ' + e.message);
  }
};

const getDetail = (req, res) => {
  try {
    const item = service.detail(req.params.id);
    if (!item) return response.notFound(res, '下载项不存在');
    return response.success(res, item);
  } catch (e) {
    return response.error(res, '获取下载详情失败: ' + e.message);
  }
};

const create = (req, res) => {
  try {
    const item = service.create(req.body);
    return response.created(res, item, '创建成功');
  } catch (e) {
    return e.code ? response.badRequest(res, e.message) : response.error(res, '创建下载项失败: ' + e.message);
  }
};

const update = (req, res) => {
  try {
    const item = service.update(req.params.id, req.body);
    if (!item) return response.notFound(res, '下载项不存在');
    return response.success(res, item, '更新成功');
  } catch (e) {
    return e.code ? response.badRequest(res, e.message) : response.error(res, '更新下载项失败: ' + e.message);
  }
};

const updateStatus = (req, res) => {
  try {
    const { status } = req.body;
    if (status === undefined) return response.badRequest(res, '状态不能为空');
    const item = service.setStatus(req.params.id, status);
    if (!item) return response.notFound(res, '下载项不存在');
    return response.success(res, item, '状态更新成功');
  } catch (e) {
    return response.error(res, '更新状态失败: ' + e.message);
  }
};

const remove = (req, res) => {
  try {
    const ok = service.remove(req.params.id);
    if (!ok) return response.notFound(res, '下载项不存在');
    return response.success(res, null, '删除成功');
  } catch (e) {
    return response.error(res, '删除下载项失败: ' + e.message);
  }
};

// ===== 公开接口 =====
const getPublicPlatforms = (req, res) => {
  try {
    return response.success(res, service.publicPlatforms());
  } catch (e) {
    return response.error(res, '获取下载信息失败: ' + e.message);
  }
};

const redirectDownload = (req, res) => {
  try {
    const url = service.getRedirectUrl(req.params.platform);
    if (!url) return response.notFound(res, '暂无可用的下载地址');
    return res.redirect(url);
  } catch (e) {
    return response.error(res, '下载失败: ' + e.message);
  }
};

module.exports = {
  getList,
  getDetail,
  create,
  update,
  updateStatus,
  remove,
  getPublicPlatforms,
  redirectDownload,
};
