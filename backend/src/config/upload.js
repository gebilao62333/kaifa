const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const config = require('./index');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = config.paths.uploads;
    // 首次部署 / 挂载卷为空时目录可能不存在，multer 自身不会创建，这里兜底
    try {
      fs.mkdirSync(uploadPath, { recursive: true });
    } catch (e) {
      // 创建失败交给 multer 报错，保留原始 errno 信息
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'audio/mpeg', 'audio/wav', 'audio/amr', 'video/mp4'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'), false);
  }
};

// 审计 I-25：全局上限放宽到与业务一致（视频 100MB）；具体类型限额在 services/uploadService.js
// 按类型二次校验（图片/音频 10MB、通用文件 20MB、视频 100MB）。
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024
  }
});

module.exports = upload;
