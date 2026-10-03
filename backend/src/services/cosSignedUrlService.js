const config = require('../config');
const logger = require('../utils/logger');

let cosClient = null;

// 惰性加载 COS SDK：未安装依赖或未配置密钥时降级为原样返回，避免拖垮整个 services 模块
const initCosClient = () => {
  if (cosClient) return cosClient;

  // 四项齐全才算可用：仅配密钥而漏配 Bucket/Region 时不签发 URL，避免返回坏链
  const cos = config.storage.cos || {};
  if (!cos.secretId || !cos.secretKey || !cos.bucket || !cos.region) {
    return null;
  }

  try {
    const COS = require('cos-nodejs-sdk-v5');
    cosClient = new COS({
      SecretId: config.storage.cos.secretId,
      SecretKey: config.storage.cos.secretKey
    });
  } catch (err) {
    logger.warn('[COS] SDK 未安装，签名URL功能降级:', err.message);
    return null;
  }

  return cosClient;
};

const isCosUrl = (url) => {
  if (!url) return false;
  return url.includes('.cos.') && url.includes('.myqcloud.com');
};

// 生成带时效的 COS 访问签名 URL（GET），避免公开永久直链被刷带宽
const getSignedAccessUrl = (url, expires = 600) => {
  if (!isCosUrl(url)) {
    return url; // 本地文件或非COS链接原样返回
  }

  const cos = initCosClient();
  if (!cos) {
    return url;
  }

  const prefix = `https://${config.storage.cos.bucket}.cos.${config.storage.cos.region}.myqcloud.com/`;
  const key = url.startsWith(prefix) ? url.substring(prefix.length) : url;

  return new Promise((resolve) => {
    cos.getPresignedUrl({
      Method: 'GET',
      Bucket: config.storage.cos.bucket,
      Region: config.storage.cos.region,
      Key: key,
      Expires: expires
    }, (err, data) => {
      if (err) {
        logger.error('[COS] 生成访问签名失败:', err);
        resolve(url);
      } else {
        resolve(data.Url);
      }
    });
  });
};

// 批量解析：把一组url中的COS链接替换为带签名临时链接（异步）
const resolveUrls = async (urls, expires = 600) => {
  if (!Array.isArray(urls)) return urls;
  return Promise.all(urls.map(u => getSignedAccessUrl(u, expires)));
};

module.exports = {
  isCosUrl,
  getSignedAccessUrl,
  resolveUrls,
  initCosClient
};
