const path = require('path');
const fs = require('fs');
const config = require('../config');
const logger = require('../utils/logger');

let cosClient = null;

const initCosClient = () => {
  if (cosClient) return cosClient;
  
  if (!config.storage.cos.secretId || !config.storage.cos.secretKey) {
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

const isCosAvailable = () => {
  return !!(config.storage.cos.secretId && config.storage.cos.secretKey);
};

const uploadImage = async (file) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(ext)) {
    throw new Error('不支持的图片格式');
  }
  
  if (config.storage.provider === 'cos' && isCosAvailable()) {
    return await uploadToCos(file, 'images');
  }
  
  return await uploadLocal(file, 'images');
};

const uploadAudio = async (file) => {
  const allowedExtensions = ['.mp3', '.wav', '.amr'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(ext)) {
    throw new Error('不支持的音频格式');
  }
  
  if (config.storage.provider === 'cos' && isCosAvailable()) {
    return await uploadToCos(file, 'audios');
  }
  
  return await uploadLocal(file, 'audios');
};

const uploadVideo = async (file) => {
  const allowedExtensions = ['.mp4'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(ext)) {
    throw new Error('不支持的视频格式');
  }
  
  if (config.storage.provider === 'cos' && isCosAvailable()) {
    return await uploadToCos(file, 'videos');
  }
  
  return await uploadLocal(file, 'videos');
};

const uploadFile = async (file) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (config.storage.provider === 'cos' && isCosAvailable()) {
    return await uploadToCos(file, 'files');
  }
  
  return await uploadLocal(file, 'files');
};

const deleteFile = async (filePath) => {
  if (config.storage.provider === 'cos' && isCosAvailable()) {
    return await deleteFromCos(filePath);
  }
  
  const absolutePath = path.join(config.paths.root, 'public', filePath);
  
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

  const absolutePath = path.join(config.paths.root, 'public', url);
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
  getDirectUploadToken
};