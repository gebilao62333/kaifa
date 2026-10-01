// 业务逻辑层（Service）：承载下载管理的核心规则与数据编排。
// 只依赖 Repository 与工具函数，不触碰 HTTP（req/res），便于独立做单元测试。
const DownloadRepository = require('../repositories/downloadRepository');
const { decodeEntities } = require('../utils/decode');

const repo = new DownloadRepository();
const PLATFORMS = DownloadRepository.PLATFORMS;

const validatePlatform = (platform) => !!platform && !!PLATFORMS[platform];

const list = ({ platform, status, keyword, page = 1, pageSize = 20 } = {}) => {
  const all = repo.list({ platform, status, keyword });
  const total = all.length;
  const start = (Number(page) - 1) * Number(pageSize);
  const rows = all.slice(start, start + Number(pageSize));
  return {
    list: rows.map((d) => ({ ...d, url: decodeEntities(d.url) })),
    total,
    page: Number(page),
    pageSize: Number(pageSize),
  };
};

const detail = (id) => {
  const item = repo.findById(id);
  if (!item) return null;
  return { ...item, url: decodeEntities(item.url) };
};

const create = ({ platform, version, url, size, sort, status }) => {
  if (!validatePlatform(platform)) {
    throw Object.assign(new Error('平台不合法，仅支持 ios/android/harmony'), { code: 400 });
  }
  if (!url) {
    throw Object.assign(new Error('下载地址不能为空'), { code: 400 });
  }
  const item = repo.create({ platform, version, url, size, sort, status });
  return { ...item, url: decodeEntities(item.url) };
};

const update = (id, patch) => {
  if (patch.platform !== undefined && !validatePlatform(patch.platform)) {
    throw Object.assign(new Error('平台不合法，仅支持 ios/android/harmony'), { code: 400 });
  }
  const item = repo.update(id, patch);
  if (!item) return null;
  return { ...item, url: decodeEntities(item.url) };
};

const setStatus = (id, status) => {
  const item = repo.update(id, { status: Number(status) });
  if (!item) return null;
  return item;
};

const remove = (id) => repo.remove(id);

// 对外的公开下载信息（落地页使用）：仅返回已启用且已配置地址的项
const publicPlatforms = () =>
  repo
    .list({ status: 1 })
    .filter((d) => d.url)
    .map((d) => ({
      platform: d.platform,
      name: PLATFORMS[d.platform],
      version: d.version,
      url: decodeEntities(d.url),
      size: d.size,
    }));

// 按平台获取跳转地址（解码后），无可用项返回 null
const getRedirectUrl = (platform) => {
  const item = repo.findByPlatform(platform);
  if (!item || item.status !== 1 || !item.url) return null;
  return decodeEntities(item.url);
};

module.exports = {
  PLATFORMS,
  list,
  detail,
  create,
  update,
  setStatus,
  remove,
  publicPlatforms,
  getRedirectUrl,
};
