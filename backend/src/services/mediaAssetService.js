const { MediaAsset } = require('../models');
const uploadService = require('./uploadService');
const { getTimestamp } = require('../utils/helper');

// 登记一次上传（直传COS或本地兜底都登记），返回资产记录
const register = async ({ userId, url, fileType = 'file', bizType = 'misc', bizId = null, storage = 'cos' }) => {
  const record = await MediaAsset.create({
    user_id: userId,
    biz_type: bizType,
    biz_id: bizId,
    url,
    storage,
    file_type: fileType,
    create_time: getTimestamp ? getTimestamp() : Math.floor(Date.now() / 1000),
    status: 1
  });
  return record;
};

// 批量登记（一次发布多图/多视频）
const registerBatch = async (items) => {
  const records = await MediaAsset.bulkCreate(
    items.map(it => ({
      user_id: it.userId,
      biz_type: it.bizType || 'misc',
      biz_id: it.bizId || null,
      url: it.url,
      storage: it.storage || 'cos',
      file_type: it.fileType || 'file',
      create_time: getTimestamp ? getTimestamp() : Math.floor(Date.now() / 1000),
      status: 1
    }))
  );
  return records;
};

// 按业务查询资产（用于级联删除/审计）
const findByBiz = async (bizType, bizId) => {
  return MediaAsset.findAll({ where: { biz_type: bizType, biz_id: bizId, status: 1 } });
};

// 删除单个资产：同时删除文件本体（COS或本地）与登记表
const removeOne = async (asset) => {
  if (!asset) return false;
  await uploadService.deleteByUrl(asset.url);
  asset.status = 0;
  await asset.save();
  return true;
};

// 按业务删除所有资产（如删除动态时一并清理媒体文件）
const removeByBiz = async (bizType, bizId) => {
  const assets = await findByBiz(bizType, bizId);
  await Promise.all(assets.map(removeOne));
  return assets.length;
};

module.exports = {
  register,
  registerBatch,
  findByBiz,
  removeOne,
  removeByBiz
};
