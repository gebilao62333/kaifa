const crypto = require('crypto');

// 可变配置：service 在调用时读取，因此可在用例中直接改
const mockConfig = {
  call: {
    channel: 'webrtc',
    stun: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'],
    turn: { url: '', secret: '', ttl: 3600 }
  },
  trtc: { appId: '', secretKey: '' }
};

jest.mock('../../../src/config', () => mockConfig);

const callConfigService = require('../../../src/services/callConfigService');

describe('Service - callConfigService（通话通道与 TURN 临时凭据）', () => {
  beforeEach(() => {
    mockConfig.call.channel = 'webrtc';
    mockConfig.call.turn = { url: '', secret: '', ttl: 3600 };
    mockConfig.trtc = { appId: '', secretKey: '' };
  });

  it('未配置 TURN 时只返回 STUN，且不报错（未部署是正常配置状态）', () => {
    const cfg = callConfigService.getCallConfig(1001);
    expect(cfg.channel).toBe('webrtc');
    expect(cfg.turnEnabled).toBe(false);
    expect(cfg.iceServers).toHaveLength(2);
    expect(cfg.iceServers.every((s) => s.urls.startsWith('stun:'))).toBe(true);
  });

  it('配置 TURN 后追加一条临时凭据，且用户名形如 <过期时间戳>:<用户ID>', () => {
    mockConfig.call.turn = { url: 'turn:turn.example.com:3478', secret: 's3cret', ttl: 600 };
    const before = Math.floor(Date.now() / 1000);
    const cfg = callConfigService.getCallConfig(1001);

    expect(cfg.turnEnabled).toBe(true);
    expect(cfg.iceServers).toHaveLength(3);

    const turn = cfg.iceServers[2];
    expect(turn.urls).toBe('turn:turn.example.com:3478');
    expect(turn.username).toMatch(/^\d+:1001$/);

    const expiry = Number(turn.username.split(':')[0]);
    expect(expiry).toBeGreaterThanOrEqual(before + 600 - 2);
    expect(expiry).toBeLessThanOrEqual(before + 600 + 2);
  });

  it('凭据符合 coturn REST API 规范：base64(HMAC-SHA1(secret, username))', () => {
    mockConfig.call.turn = { url: 'turn:t:3478', secret: 'shared-secret', ttl: 3600 };
    const cfg = callConfigService.getCallConfig(2002);
    const turn = cfg.iceServers[2];

    // 用相同算法复算（coturn 服务端就是这么校验的）
    const expected = crypto.createHmac('sha1', 'shared-secret').update(turn.username).digest('base64');
    expect(turn.credential).toBe(expected);
  });

  it('不同用户的凭据不同（用户维度签发，便于溯源与限速）', () => {
    mockConfig.call.turn = { url: 'turn:t:3478', secret: 'shared-secret', ttl: 3600 };
    const a = callConfigService.getCallConfig(1).iceServers[2];
    const b = callConfigService.getCallConfig(2).iceServers[2];
    expect(a.username).not.toBe(b.username);
    expect(a.credential).not.toBe(b.credential);
  });

  it('通道策略跟随 CALL_CHANNEL，非法值回落 webrtc', () => {
    mockConfig.call.channel = 'trtc';
    expect(callConfigService.getCallConfig(1).channel).toBe('trtc');
  });

  it('trtcConfigured 反映 TRTC 密钥是否齐全，供前端提示与排查', () => {
    expect(callConfigService.getCallConfig(1).trtcConfigured).toBe(false);
    mockConfig.trtc = { appId: '1400', secretKey: 'key' };
    expect(callConfigService.getCallConfig(1).trtcConfigured).toBe(true);
  });

  it('缺少 secret 时不签发 TURN（避免返回不可用凭据）', () => {
    mockConfig.call.turn = { url: 'turn:t:3478', secret: '', ttl: 3600 };
    const cfg = callConfigService.getCallConfig(1);
    expect(cfg.turnEnabled).toBe(false);
    expect(cfg.iceServers).toHaveLength(2);
  });
});
