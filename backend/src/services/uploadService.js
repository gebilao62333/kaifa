const path = require('path');
const fs = require('fs');
const config = require('../config');

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

const uploadImage = async (file) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(ext)) {
    throw new Error('不支持的图片格式');
  }
  
  if (config.storage.provider === 'cos') {
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
  
  if (config.storage.provider === 'cos') {
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
  
  if (config.storage.provider === 'cos') {
    return await uploadToCos(file, 'videos');
  }
  
  return await uploadLocal(file, 'videos');
};

const uploadFile = async (file) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (config.storage.provider === 'cos') {
    return await uploadToCos(file, 'files');
  }
  
  return await uploadLocal(file, 'files');
};

const deleteFile = async (filePath) => {
  if (config.storage.provider === 'cos') {
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
        console.error('[COS] 删除文件失败:', err);
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

const getUploadToken = async () => {
  const cos = initCosClient();
  
  if (!cos) {
    return null;
  }
  
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
      if (err) {
        reject(err);
      } else {
        resolve({
          url: data.Url,
          key: params.Key,
          expires: params.Expires
        });
      }
    });
  });
};

module.exports = {
  uploadImage,
  uploadAudio,
  uploadVideo,
  uploadFile,
  deleteFile,
  getUploadToken
};