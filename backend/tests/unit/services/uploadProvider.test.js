const os = require('os');
const fs = require('fs');
const path = require('path');

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'upload-provider-'));

// 可变配置：provider 链解析与降级行为都依赖它（logs 也必须给，logger 启动时要建目录）
const mockConfig = {
  storage: { provider: 'local', cos: {}, qiniu: {}, oss: {} },
  paths: {
    public: tmpRoot,
    uploads: path.join(tmpRoot, 'uploads'),
    logs: path.join(tmpRoot, 'logs')
  }
};
jest.mock('../../../src/config', () => mockConfig);

fs.mkdirSync(mockConfig.paths.uploads, { recursive: true });
const uploadService = require('../../../src/services/uploadService');

const makeFile = (name) => {
  const p = path.join(tmpRoot, 'incoming-' + Math.random().toString(36).slice(2) + path.extname(name));
  fs.writeFileSync(p, 'x');
  return { originalname: name, filename: path.basename(p), path: p, size: 12 };
};

describe('Service - 多存储 provider 链', () => {
  beforeEach(() => {
    mockConfig.storage.provider = 'local';
    mockConfig.storage.cos = {};
    mockConfig.storage.qiniu = {};
    mockConfig.storage.oss = {};
  });

  it('默认 local：链里只有本地存储', () => {
    expect(uploadService.getStorageProviderChain()).toEqual(['local']);
  });

  it('COS 未配置完整时被跳过，自动回落到 local', () => {
    mockConfig.storage.provider = 'cos';
    mockConfig.storage.cos = { secretId: 'id' };
    expect(uploadService.getStorageProviderChain()).toEqual(['local']);
  });

  it('「多家组合」按顺序解析，未配置的被跳过', () => {
    mockConfig.storage.provider = 'cos,qiniu,oss,local';
    mockConfig.storage.qiniu = { accessKey: 'a', secretKey: 'b', bucket: 'c' };
    expect(uploadService.getStorageProviderChain()).toEqual(['qiniu', 'local']);
  });

  it('COS 四项齐全时被排在链首', () => {
    mockConfig.storage.provider = 'cos,local';
    mockConfig.storage.cos = { secretId: 'id', secretKey: 'key', bucket: 'b', region: 'r' };
    expect(uploadService.getStorageProviderChain()).toEqual(['cos', 'local']);
  });

  it('未知 provider 名被忽略且不影响兜底', () => {
    mockConfig.storage.provider = 's3,local';
    expect(uploadService.getStorageProviderChain()).toEqual(['local']);
  });

  it('开启降级（默认）时，链首 provider 失败会落到本地', async () => {
    mockConfig.storage.provider = 'cos,qiniu,local';
    mockConfig.storage.fallback = true;
    const result = await uploadService.uploadImage(makeFile('a.png'));
    expect(result.storage).toBe('local');
  });

  it('链首不可用时上传真正降级到本地且文件可用', async () => {
    mockConfig.storage.provider = 'cos,qiniu,local';
    const result = await uploadService.uploadImage(makeFile('a.png'));
    expect(result.storage).toBe('local');
    expect(result.url.startsWith('/uploads/images/')).toBe(true);
    expect(fs.existsSync(path.join(tmpRoot, result.url.replace(/^\//, '')))).toBe(true);
  });
});
