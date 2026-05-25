const config = require('../config');

const SUPPORTED_VERSIONS = ['v1', 'v2'];
const DEFAULT_VERSION = 'v1';

const versionMiddleware = (req, res, next) => {
  let version = req.headers['api-version'] || req.query.api_version || DEFAULT_VERSION;
  
  version = version.toLowerCase();
  
  if (!SUPPORTED_VERSIONS.includes(version)) {
    return res.status(400).json({
      code: 400,
      message: '不支持的 API 版本',
      supported_versions: SUPPORTED_VERSIONS,
      default_version: DEFAULT_VERSION
    });
  }
  
  req.apiVersion = version;
  
  res.setHeader('X-API-Version', version);
  res.setHeader('X-Supported-Versions', SUPPORTED_VERSIONS.join(','));
  
  next();
};

const versionRouter = (app) => {
  SUPPORTED_VERSIONS.forEach(version => {
    const router = require(`../routes/${version}/index`);
    app.use(`/api/${version}`, router);
  });
};

module.exports = {
  versionMiddleware,
  versionRouter,
  SUPPORTED_VERSIONS,
  DEFAULT_VERSION
};
