jest.mock('../../../src/config', () => ({
  baseUrl: 'https://api.eudazi.com',
  storage: {
    cos: { bucket: 'eudazi-1300000000', region: 'ap-guangzhou' },
    qiniu: { domain: 'https://cdn.qiniu.example.com' },
    oss: { domain: 'oss-cn-hangzhou.aliyuncs.com' }
  }
}));

const p2pRelay = require('../../../src/utils/p2pRelay');

// 安全审计 M-10：P2P 信令转发字段的校验纯函数单测（URL 白名单 / 目标 / 请求 ID / 体积）
describe('Utils - P2P 信令转发校验（审计 M-10）', () => {
  const COS = 'https://eudazi-1300000000.cos.ap-guangzhou.myqcloud.com/avatar/a.png?sign=xyz';

  describe('collectAllowlist', () => {
    it('收敛出平台自有主机与端口', () => {
      const { hosts, ports } = p2pRelay.collectAllowlist();
      expect(hosts.has('api.eudazi.com')).toBe(true);
      expect(hosts.has('eudazi-1300000000.cos.ap-guangzhou.myqcloud.com')).toBe(true);
      expect(hosts.has('cdn.qiniu.example.com')).toBe(true);
      expect(hosts.has('oss-cn-hangzhou.aliyuncs.com')).toBe(true);
      expect(ports.has('443')).toBe(true);
    });
  });

  describe('isSafeMediaUrl', () => {
    it('放行平台自身域名与自有存储的 http(s) 地址', () => {
      expect(p2pRelay.isSafeMediaUrl('https://api.eudazi.com/uploads/a.png')).toBe(true);
      expect(p2pRelay.isSafeMediaUrl(COS)).toBe(true);
      expect(p2pRelay.isSafeMediaUrl('https://cdn.qiniu.example.com/a.png')).toBe(true);
      expect(p2pRelay.isSafeMediaUrl('https://oss-cn-hangzhou.aliyuncs.com/a.png')).toBe(true);
    });

    it('相对路径按平台域名补全后放行', () => {
      expect(p2pRelay.isSafeMediaUrl('/uploads/2026/a.png')).toBe(true);
    });

    it('拒绝内网 / 回环 / 云元数据地址', () => {
      expect(p2pRelay.isSafeMediaUrl('http://169.254.169.254/latest/meta-data/')).toBe(false);
      expect(p2pRelay.isSafeMediaUrl('http://127.0.0.1:3000/api/health')).toBe(false);
      expect(p2pRelay.isSafeMediaUrl('http://localhost/uploads/a.png')).toBe(false);
      expect(p2pRelay.isSafeMediaUrl('http://10.0.0.5/a.png')).toBe(false);
      expect(p2pRelay.isSafeMediaUrl('http://[::1]:3000/a.png')).toBe(false);
    });

    it('拒绝非 http(s) 协议', () => {
      expect(p2pRelay.isSafeMediaUrl('javascript:alert(1)')).toBe(false);
      expect(p2pRelay.isSafeMediaUrl('data:image/png;base64,AAAA')).toBe(false);
      expect(p2pRelay.isSafeMediaUrl('file:///etc/passwd')).toBe(false);
      expect(p2pRelay.isSafeMediaUrl('blob:https://api.eudazi.com/uuid')).toBe(false);
    });

    it('拒绝带 userinfo 的混淆写法与协议相对写法', () => {
      expect(p2pRelay.isSafeMediaUrl('http://user:pass@api.eudazi.com/x.png')).toBe(false);
      expect(p2pRelay.isSafeMediaUrl('//evil.com/x.png')).toBe(false);
    });

    it('拒绝白名单之外的外域与后缀伪装', () => {
      expect(p2pRelay.isSafeMediaUrl('https://evil.com/a.png')).toBe(false);
      expect(p2pRelay.isSafeMediaUrl('https://api.eudazi.com.evil.com/a.png')).toBe(false);
    });

    it('拒绝白名单主机上的非标准端口', () => {
      expect(p2pRelay.isSafeMediaUrl('https://api.eudazi.com:6379/x')).toBe(false);
    });

    it('拒绝空值 / 非字符串 / 超长', () => {
      expect(p2pRelay.isSafeMediaUrl('')).toBe(false);
      expect(p2pRelay.isSafeMediaUrl('   ')).toBe(false);
      expect(p2pRelay.isSafeMediaUrl(null)).toBe(false);
      expect(p2pRelay.isSafeMediaUrl([COS])).toBe(false);
      expect(p2pRelay.isSafeMediaUrl({ url: COS })).toBe(false);
      expect(p2pRelay.isSafeMediaUrl('https://api.eudazi.com/' + 'a'.repeat(p2pRelay.MAX_URL_LEN))).toBe(false);
    });
  });

  describe('normalizeRelayTarget', () => {
    it('接受正整数（数字或数字串），拒绝自身', () => {
      expect(p2pRelay.normalizeRelayTarget(12, 1)).toBe(12);
      expect(p2pRelay.normalizeRelayTarget('12', 1)).toBe(12);
      expect(p2pRelay.normalizeRelayTarget(1, 1)).toBeNull();
    });

    it('拒绝 0 / 负数 / 小数 / 非数字 / 布尔 / 超长', () => {
      expect(p2pRelay.normalizeRelayTarget(0)).toBeNull();
      expect(p2pRelay.normalizeRelayTarget(-3)).toBeNull();
      expect(p2pRelay.normalizeRelayTarget(1.5)).toBeNull();
      expect(p2pRelay.normalizeRelayTarget('12abc')).toBeNull();
      expect(p2pRelay.normalizeRelayTarget('')).toBeNull();
      expect(p2pRelay.normalizeRelayTarget(true)).toBeNull();
      expect(p2pRelay.normalizeRelayTarget('9'.repeat(16))).toBeNull();
    });
  });

  describe('normalizeRequestId', () => {
    it('放行客户端可打印请求 ID', () => {
      expect(p2pRelay.normalizeRequestId('p2p-1736000000-ab12cd')).toBe('p2p-1736000000-ab12cd');
    });

    it('拒绝空 / 超长 / 非法字符 / 非字符串', () => {
      expect(p2pRelay.normalizeRequestId('')).toBeNull();
      expect(p2pRelay.normalizeRequestId('a b')).toBeNull();
      expect(p2pRelay.normalizeRequestId('a'.repeat(p2pRelay.MAX_REQUEST_ID_LEN + 1))).toBeNull();
      expect(p2pRelay.normalizeRequestId(123)).toBeNull();
    });
  });

  describe('normalizeType', () => {
    it('仅透传白名单类型，其余回落 undefined', () => {
      expect(p2pRelay.normalizeType('image')).toBe('image');
      expect(p2pRelay.normalizeType('video')).toBe('video');
      expect(p2pRelay.normalizeType('exe')).toBeUndefined();
      expect(p2pRelay.normalizeType('a'.repeat(32))).toBeUndefined();
      expect(p2pRelay.normalizeType(1)).toBeUndefined();
    });
  });

  describe('isBoundedSignal', () => {
    it('缺省视为合法，小对象放行', () => {
      expect(p2pRelay.isBoundedSignal(undefined)).toBe(true);
      expect(p2pRelay.isBoundedSignal(null)).toBe(true);
      expect(p2pRelay.isBoundedSignal({ type: 'offer', sdp: 'v=0' })).toBe(true);
    });

    it('拒绝非对象与超限对象', () => {
      expect(p2pRelay.isBoundedSignal('raw-string')).toBe(false);
      expect(p2pRelay.isBoundedSignal({ sdp: 'x'.repeat(p2pRelay.MAX_SIGNAL_FIELD_LEN + 1) })).toBe(false);
    });
  });
});
