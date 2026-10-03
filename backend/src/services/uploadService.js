const path = require('path');
const fs = require('fs');
const config = require('../config');
const logger = require('../utils/logger');

let cosClient = null;

// COS 必须四项齐全（SecretId / SecretKey / Bucket / Region）才算可用。
// 历史实现只校验前两项：若只配了密钥而漏配 Bucket/Region，会被误判为"已配置"，
// 于是上传被路由到 COS 并抛出难以定位的 SDK 错误，而不是回退本地存储。
const isCosConfigured = () => {
  const cos = config.storage.cos || {};
  return !!(cos.secretId && cos.secretKey && cos.bucket && cos.region);
};

const initCosClient = () => {
  if (cosClient) return cosClient;
  
  if (!isCosConfigured()) {
    return null;
  }
  
  const COS = require('cos-nodejs-sdk-v5');
  cosClient = new COS({
    SecretId: config.storage.cos.secretId,
    SecretKey: config.storage.cos.secretKey
  });
  
  return cosClient;
};

const uploadToCos = async (file, folder) => {
  const cos = initCosClient();
  
  if (!cos) {
    throw new Error('COS配置未完成');
  }
  
  const ext = path.extname(file.originalname).toLowerCase();
  const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;
  const key = `${folder}/${filename}`;
  
  return new Promise((resolve, reject) => {
    cos.putObject({
      Bucket: config.storage.cos.bucket,
      Region: config.storage.cos.region,
      Key: key,
      Body: fs.createReadStream(file.path),
      ContentType: getContentType(ext)
    }, (err, data) => {
      fs.unlinkSync(file.path);
      
      if (err) {
        reject(new Error(`COS上传失败: ${err.message}`));
      } else {
        resolve({
          url: `https://${config.storage.cos.bucket}.cos.${config.storage.cos.region}.myqcloud.com/${key}`,
          filename,
          key
        });
      }
    });
  });
};

const uploadLocal = async (file, folder) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;
  const relativePath = `/uploads/${folder}/${filename}`;
  const absolutePath = path.join(config.paths.uploads, folder, filename);
  
  const dir = path.dirname(absolutePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.renameSync(file.path, absolutePath);
  
  return {
    url: relativePath,
    filename,
    key: relativePath
  };
};

const isCosAvailable = () => isCosConfigured();

// ==================== 多存储 provider 注册表 ====================
// STORAGE_PROVIDER 支持逗号分隔的优先级链（如 cos,qiniu,oss,local）：
// 逐项检查配置是否完整，未配置或上传失败的自动跳到下一家，最终至少回落到本地存储。
const isQiniuConfigured = () => {
  const q = config.storage.qiniu || {};
  return !!(q.accessKey && q.secretKey && q.bucket);
};

const isOssConfigured = () => {
  const o = config.storage.oss || {};
  return !!(o.accessKeyId && o.accessKeySecret && o.bucket);
};

const loadStorageSdk = (label, pkg) => {
  try {
    return require(pkg);
  } catch (e) {
    throw new Error('未安装' + label + ' SDK，请先执行：cd backend && npm i ' + pkg);
  }
};

const uploadToQiniu = async (file, folder) => {
  const qiniu = loadStorageSdk('七牛', 'qiniu');
  const q = config.storage.qiniu;
  const key = folder + '/' + (file.filename || path.basename(file.path));
  const mac = new qiniu.auth.digest.Mac(q.accessKey, q.secretKey);
  const putPolicy = new qiniu.rs.PutPolicy({ scope: q.bucket + ':' + key });
  const uploadToken = putPolicy.uploadToken(mac);
  const formUploader = new qiniu.form_up.FormUploader(new qiniu.conf.Config());
  await new Promise((resolve, reject) => {
    formUploader.putFile(uploadToken, key, file.path, new qiniu.form_up.PutExtra(), (err, body, info) => {
      if (err) return reject(err);
      if (info && info.statusCode === 200) return resolve(body);
      reject(new Error('七牛上传失败，状态码 ' + (info && info.statusCode)));
    });
  });
  try { fs.unlinkSync(file.path); } catch (e) { /* 临时文件清理失败忽略 */ }
  const base = (q.domain || '').replace(/\/$/, '');
  return { url: base ? base + '/' + key : key, filename: file.filename, key };
};

const deleteFromQiniu = async (key) => {
  const qiniu = loadStorageSdk('七牛', 'qiniu');
  const q = config.storage.qiniu;
  const mac = new qiniu.auth.digest.Mac(q.accessKey, q.secretKey);
  const bucketManager = new qiniu.rs.BucketManager(mac, new qiniu.conf.Config());
  return await new Promise((resolve) => {
    bucketManager.delete(q.bucket, String(key || '').replace(/^[/\\]+/, ''), (err) => resolve(!err));
  });
};

const uploadToOss = async (file, folder) => {
  const OSS = loadStorageSdk('阿里云 OSS', 'ali-oss');
  const o = config.storage.oss;
  const client = new OSS({ region: o.region, accessKeyId: o.accessKeyId, accessKeySecret: o.accessKeySecret, bucket: o.bucket, endpoint: o.endpoint || undefined });
  const key = folder + '/' + (file.filename || path.basename(file.path));
  await client.put(key, file.path);
  try { fs.unlinkSync(file.path); } catch (e) { /* 临时文件清理失败忽略 */ }
  const base = (o.domain || (o.endpoint ? 'https://' + o.bucket + '.' + String(o.endpoint).replace(/^https?:\/\//, '') : '')).replace(/\/$/, '');
  return { url: base ? base + '/' + key : key, filename: file.filename, key };
};

const deleteFromOss = async (key) => {
  const OSS = loadStorageSdk('阿里云 OSS', 'ali-oss');
  const o = config.storage.oss;
  const client = new OSS({ region: o.region, accessKeyId: o.accessKeyId, accessKeySecret: o.accessKeySecret, bucket: o.bucket, endpoint: o.endpoint || undefined });
  try { await client.delete(String(key || '').replace(/^[/\\]+/, '')); return true; } catch (e) { return false; }
};

// 本地 provider 的删除实现（含路径遍历防护），供链式删除复用
const removeLocal = (key) => {
  const publicRoot = config.paths.public || path.resolve(config.paths.uploads, '..');
  const relative = String(key || '').replace(/^[/\\]+/, '');
  const absolutePath = path.resolve(publicRoot, relative);
  if (absolutePath !== publicRoot && !absolutePath.startsWith(publicRoot + path.sep)) {
    logger.warn('[upload] 拒绝越界的文件删除请求:', key);
    return false;
  }
  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
    return true;
  }
  return false;
};

const STORAGE_PROVIDERS = {
  local: { isConfigured: () => true, upload: (file, folder) => uploadLocal(file, folder), remove: (key) => removeLocal(key) },
  cos: { isConfigured: isCosConfigured, upload: (file, folder) => uploadToCos(file, folder), remove: (key) => deleteFromCos(key) },
  qiniu: { isConfigured: isQiniuConfigured, upload: uploadToQiniu, remove: deleteFromQiniu },
  oss: { isConfigured: isOssConfigured, upload: uploadToOss, remove: deleteFromOss }
};

/** 解析出「已配置可用」的 provider 优先级链，至少含 local */
const resolveProviderChain = () => {
  const wanted = String(config.storage.provider || 'local').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  const chain = [];
  for (const name of wanted) {
    const provider = STORAGE_PROVIDERS[name];
    if (!provider) { logger.warn('[upload] 未知的存储 provider，已忽略: ' + name); continue; }
    if (name !== 'local' && !provider.isConfigured()) { logger.warn('[upload] provider ' + name + ' 未配置完整，已跳过'); continue; }
    chain.push(Object.assign({ name }, provider));
  }
  if (!chain.some((p) => p.name === 'local')) chain.push(Object.assign({ name: 'local' }, STORAGE_PROVIDERS.local));
  return chain;
};

/** 按链上传：任一成功即返回；全部失败则抛出最后一个错误 */
const uploadWithFallback = async (file, folder) => {
  const chain = resolveProviderChain();
  const allowFallback = config.storage.fallback !== false;
  let lastError = null;
  for (const provider of chain) {
    try {
      const result = await provider.upload(file, folder);
      if (chain[0].name !== provider.name) logger.info('[upload] 已降级到 ' + provider.name + ' 存储');
      return Object.assign({ storage: provider.name }, result);
    } catch (e) {
      lastError = e;
      if (!allowFallback) throw e;
      logger.warn('[upload] provider ' + provider.name + ' 上传失败，尝试下一家: ' + e.message);
    }
  }
  throw lastError || new Error('没有可用的存储 provider');
};

/** 按链删除：远端 provider 逐个尝试，最后回落到本地 */
const removeWithFallback = async (key) => {
  for (const provider of resolveProviderChain()) {
    if (provider.name === 'local') continue;
    try { if (await provider.remove(key)) return true; } catch (e) { logger.warn('[upload] ' + provider.name + ' 删除失败: ' + e.message); }
  }
  return removeLocal(key);
};

// 审计 I-25：按类型限制体积，与前端 uploadService.validateFile 保持一致
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_AUDIO_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
const MAX_GENERIC_FILE_SIZE = 20 * 1024 * 1024;

const assertFileSize = (file, maxBytes, label) => {
  const size = Number(file && file.size) || 0;
  if (size > maxBytes) {
    throw new Error(label + '大小超过限制（最大 ' + Math.round(maxBytes / 1024 / 1024) + 'MB）');
  }
};

const uploadImage = async (file) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(ext)) {
    throw new Error('不支持的图片格式');
  }
  assertFileSize(file, MAX_IMAGE_SIZE, '图片');
  
    return await uploadWithFallback(file, 'images');
};

const uploadAudio = async (file) => {
  const allowedExtensions = ['.mp3', '.wav', '.amr'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(ext)) {
    throw new Error('不支持的音频格式');
  }
  assertFileSize(file, MAX_AUDIO_SIZE, '音频');
  
    return await uploadWithFallback(file, 'audios');
};

const uploadVideo = async (file) => {
  const allowedExtensions = ['.mp4'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(ext)) {
    throw new Error('不支持的视频格式');
  }
  assertFileSize(file, MAX_VIDEO_SIZE, '视频');
  
    return await uploadWithFallback(file, 'videos');
};

// 审计 B-23：通用文件上传原先没有扩展名白名单，可上传 .html/.svg/.js 等，
// 在静态托管下可能变成存储型 XSS / 脚本载体。
const GENERIC_FILE_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.csv', '.md', '.json', '.zip', '.rar', '.7z'
];

const uploadFile = async (file) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!GENERIC_FILE_EXTENSIONS.includes(ext)) {
    throw new Error('不支持的文件格式');
  }
  assertFileSize(file, MAX_GENERIC_FILE_SIZE, '文件');
  
    return await uploadWithFallback(file, 'files');
};

const deleteFile = async (filePath) => {
  for (const provider of resolveProviderChain()) {
      if (provider.name === 'local') continue;
      try { if (await provider.remove(filePath)) return true; } catch (e) { logger.warn('[upload] ' + provider.name + ' 删除失败: ' + e.message); }
    }
  
  // 审计 B-05（同类）：deleteFile 与 deleteByUrl 一样存在路径遍历，同样做前缀校验
  // 注意：必须以 uploads 的真实根目录为准（backend/public），否则本地文件永远删不掉
  const publicRoot = config.paths.public || path.resolve(config.paths.uploads, '..');
  const relative = String(filePath || '').replace(/^[/\\]+/, '');
  const absolutePath = path.resolve(publicRoot, relative);

  if (absolutePath !== publicRoot && !absolutePath.startsWith(publicRoot + path.sep)) {
    logger.warn('[upload] 拒绝越界的文件删除请求:', filePath);
    return false;
  }
  
  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
    return true;
  }
  
  return false;
};

const deleteFromCos = async (key) => {
  const cos = initCosClient();
  
  if (!cos) {
    return false;
  }
  
  const actualKey = key.startsWith('/') ? key.substring(1) : key;
  
  return new Promise((resolve) => {
    cos.deleteObject({
      Bucket: config.storage.cos.bucket,
      Region: config.storage.cos.region,
      Key: actualKey
    }, (err) => {
      if (err) {
        logger.error('[COS] 删除文件失败:', err);
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
};

const getContentType = (ext) => {
  const contentTypeMap = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.amr': 'audio/amr',
    '.mp4': 'video/mp4'
  };
  
  return contentTypeMap[ext] || 'application/octet-stream';
};

const FOLDER_MAP = {
  image: 'images',
  audio: 'audios',
  video: 'videos',
  file: 'files'
};

// 各类别允许直传的扩展名白名单（与 uploadImage/uploadAudio/uploadVideo 保持一致）
const ALLOWED_EXTENSIONS = {
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  audio: ['.mp3', '.wav', '.amr'],
  video: ['.mp4']
};

// 规范化扩展名并做白名单校验，拒绝任意后缀与路径穿越
const assertAllowedExt = (type, ext) => {
  const safeExt = ext ? (String(ext).trim().toLowerCase().startsWith('.')
    ? String(ext).trim().toLowerCase()
    : `.${String(ext).trim().toLowerCase()}`) : '';

  const allowed = ALLOWED_EXTENSIONS[type];
  // 未提供扩展名时放行（无后缀本身无可利用面），一旦提供即严格校验
  if (safeExt) {
    if (allowed) {
      if (!allowed.includes(safeExt)) {
        throw new Error('不支持的文件格式');
      }
    } else if (!/^\.[a-z0-9]{1,8}$/.test(safeExt)) {
      throw new Error('不支持的文件格式');
    }
  }
  return safeExt;
};

// 生成前端直传 COS 的预签名 PUT URL（绕过后端文件流中转，节省服务器带宽）
const getDirectUploadToken = async (type = 'file', ext = '') => {
  const cos = initCosClient();

  if (!cos) {
    return null;
  }

  const folder = FOLDER_MAP[type] || 'files';
  // 白名单校验：不允许任意后缀直传（image/audio/video 走各自白名单，file 仅允许字母数字后缀）
  const safeExt = assertAllowedExt(type, ext);
  const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${safeExt}`;
  const key = `uploads/${folder}/${filename}`;

  const params = {
    Bucket: config.storage.cos.bucket,
    Region: config.storage.cos.region,
    Key: key,
    Expires: 3600
  };

  return new Promise((resolve, reject) => {
    cos.getPresignedUrl({
      Method: 'PUT',
      ...params
    }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          url: data.Url,
          key,
          filename,
          accessUrl: `https://${config.storage.cos.bucket}.cos.${config.storage.cos.region}.myqcloud.com/${key}`,
          expires: params.Expires
        });
      }
    });
  });
};

// 判断给定 URL 是否为 COS 存储（用于删除时区分后端落地方式）
const isCosUrl = (url) => {
  if (!url) return false;
  return url.includes('.cos.') && url.includes('.myqcloud.com');
};

// 兼容直传场景：根据最终访问 URL 删除文件（COS 或本地）
const deleteByUrl = async (url) => {
  if (!url) return false;

  if (isCosUrl(url)) {
    const cos = initCosClient();
    if (!cos) return false;

    const prefix = `https://${config.storage.cos.bucket}.cos.${config.storage.cos.region}.myqcloud.com/`;
    const actualKey = url.startsWith(prefix) ? url.substring(prefix.length) : url;

    return new Promise((resolve) => {
      cos.deleteObject({
        Bucket: config.storage.cos.bucket,
        Region: config.storage.cos.region,
        Key: actualKey
      }, (err) => {
        if (err) {
          logger.error('[COS] 删除文件失败:', err);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  // 审计 B-05：url 来自客户端，path.join 不会阻止 '../'，原实现可删除服务器任意文件。
  // 解析为绝对路径后强制校验必须落在 public/ 目录内。
  const publicRoot = config.paths.public || path.resolve(config.paths.uploads, '..');
  const relative = String(url || '').replace(/^[/\\]+/, '');
  const absolutePath = path.resolve(publicRoot, relative);

  if (absolutePath !== publicRoot && !absolutePath.startsWith(publicRoot + path.sep)) {
    logger.warn('[upload] 拒绝越界的文件删除请求:', url);
    return false;
  }

  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
    return true;
  }
  return false;
};

module.exports = {
  uploadImage,
  uploadAudio,
  uploadVideo,
  uploadFile,
  deleteFile,
  deleteByUrl,
  isCosUrl,
  getDirectUploadToken,
  resolveProviderChain,
  getStorageProviderChain: () => resolveProviderChain().map((p) => p.name)
};