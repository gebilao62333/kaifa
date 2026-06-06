const path = require('path');
const logger = require('../utils/logger');
const fs = require('fs');
const config = require('../config');

// ========== 腾讯云COS ==========
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

// ========== 七牛云Kodo存储 ==========
let qiniuClient = null;
let qiniuMac = null;

const initQiniuClient = () => {
  if (qiniuClient && qiniuMac) return { client: qiniuClient, mac: qiniuMac };
  
  if (!config.storage.qiniu.accessKey || !config.storage.qiniu.secretKey) {
    return null;
  }
  
  try {
    const qiniu = require('qiniu');
    qiniuMac = new qiniu.auth.digest.Mac(
      config.storage.qiniu.accessKey,
      config.storage.qiniu.secretKey
    );
    // 区域配置
    const zoneMap = {
      z0: qiniu.zone.Zone_z0,     // 华东
      z1: qiniu.zone.Zone_z1,     // 华北
      z2: qiniu.zone.Zone_z2,     // 华南
      na0: qiniu.zone.Zone_na0,   // 北美
      as0: qiniu.zone.Zone_as0    // 东南亚
    };
    const zone = zoneMap[config.storage.qiniu.zone] || qiniu.zone.Zone_z0;
    const putPolicy = new qiniu.rs.PutPolicy({
      scope: config.storage.qiniu.bucket
    });
    qiniuClient = {
      formUploader: new qiniu.form_up.FormUploader(
        new qiniu.conf.Config({ zone })
      ),
      bucketManager: new qiniu.rs.BucketManager(qiniuMac, new qiniu.conf.Config({ zone })),
      putPolicy
    };
    return { client: qiniuClient, mac: qiniuMac };
  } catch (e) {
    logger.error('[七牛云] 初始化失败:', e.message);
    return null;
  }
};

const uploadToQiniu = async (file, folder) => {
  const qiniu = initQiniuClient();
  
  if (!qiniu) {
    throw new Error('七牛云配置未完成或SDK未安装');
  }
  
  const ext = path.extname(file.originalname).toLowerCase();
  const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;
  const key = `${folder}/${filename}`;
  
  const uploadToken = qiniu.client.putPolicy.uploadToken(qiniu.mac);
  
  return new Promise((resolve, reject) => {
    qiniu.client.formUploader.putFile(
      uploadToken,
      key,
      file.path,
      new (require('qiniu').form_up.PutExtra)(),
      (err, body, info) => {
        // 清理临时文件
        try { fs.unlinkSync(file.path); } catch (e) {}
        
        if (err) {
          reject(new Error(`七牛上传失败: ${err.message}`));
        } else if (info.statusCode === 200) {
          const domain = config.storage.qiniu.domain || '';
          resolve({
            url: domain ? `${domain.replace(/\/$/, '')}/${body.key}` : `https://${body.key}`,
            filename,
            key: body.key
          });
        } else {
          reject(new Error(`七牛上传失败: HTTP ${info.statusCode}`));
        }
      }
    );
  });
};

const deleteFromQiniu = async (key) => {
  const qiniu = initQiniuClient();
  
  if (!qiniu) return false;
  
  return new Promise((resolve) => {
    qiniu.client.bucketManager.delete(
      config.storage.qiniu.bucket,
      key,
      (err, body, info) => {
        if (err || info.statusCode !== 200) {
          logger.error('[七牛云] 删除文件失败:', err || info.statusCode);
          resolve(false);
        } else {
          resolve(true);
        }
      }
    );
  });
};

// ========== 统一上传 ==========

const getStorageProvider = () => {
  return config.storage.provider || 'local';
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

const uploadImage = async (file) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(ext)) {
    throw new Error('不支持的图片格式');
  }
  
  const provider = getStorageProvider();
  if (provider === 'cos') return await uploadToCos(file, 'images');
  if (provider === 'qiniu') return await uploadToQiniu(file, 'images');
  
  return await uploadLocal(file, 'images');
};

const uploadAudio = async (file) => {
  const allowedExtensions = ['.mp3', '.wav', '.amr'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(ext)) {
    throw new Error('不支持的音频格式');
  }
  
  const provider = getStorageProvider();
  if (provider === 'cos') return await uploadToCos(file, 'audios');
  if (provider === 'qiniu') return await uploadToQiniu(file, 'audios');
  
  return await uploadLocal(file, 'audios');
};

const uploadVideo = async (file) => {
  const allowedExtensions = ['.mp4'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(ext)) {
    throw new Error('不支持的视频格式');
  }
  
  const provider = getStorageProvider();
  if (provider === 'cos') return await uploadToCos(file, 'videos');
  if (provider === 'qiniu') return await uploadToQiniu(file, 'videos');
  
  return await uploadLocal(file, 'videos');
};

const uploadFile = async (file) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  const provider = getStorageProvider();
  if (provider === 'cos') return await uploadToCos(file, 'files');
  if (provider === 'qiniu') return await uploadToQiniu(file, 'files');
  
  return await uploadLocal(file, 'files');
};

const deleteFile = async (filePath) => {
  const provider = getStorageProvider();
  if (provider === 'cos') {
    return await deleteFromCos(filePath);
  }
  if (provider === 'qiniu') {
    return await deleteFromQiniu(filePath);
  }
  
  const absolutePath = path.join(config.paths.root, 'public', filePath);
  
  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
    return true;
  }
  
  return false;
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

const getUploadToken = async () => {
  const provider = getStorageProvider();

  // Qiniu token
  if (provider === 'qiniu') {
    const qiniu = initQiniuClient();
    if (!qiniu) return null;
    const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const key = `uploads/temp/${filename}`;
    const uploadToken = qiniu.client.putPolicy.uploadToken(qiniu.mac);
    return {
      token: uploadToken,
      key,
      provider: 'qiniu',
      bucket: config.storage.qiniu.bucket,
      domain: config.storage.qiniu.domain || ''
    };
  }

  // COS token
  if (provider === 'cos') {
    const cos = initCosClient();
    if (!cos) return null;
    const params = {
      Bucket: config.storage.cos.bucket,
      Region: config.storage.cos.region,
      Key: `uploads/temp/${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      Expires: 3600
    };
    return new Promise((resolve, reject) => {
      cos.getPresignedUrl({
        Method: 'PUT',
        ...params
      }, (err, data) => {
        if (err) reject(err);
        else resolve({
          url: data.Url,
          key: params.Key,
          expires: params.Expires,
          provider: 'cos'
        });
      });
    });
  }

  // Local - no token needed
  return { provider: 'local', expires: 3600 };
};

module.exports = {
  uploadImage,
  uploadAudio,
  uploadVideo,
  uploadFile,
  deleteFile,
  getUploadToken
};