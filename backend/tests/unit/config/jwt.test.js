const jwt = require('jsonwebtoken');
const {
  generateToken,
  generateTokenPair,
  verifyToken,
  refreshAccessToken,
  decodeToken,
  signToken
} = require('../../../src/config/jwt');

describe('Config - JWT', () => {
  const payload = { userId: 100001, username: 'tester' };

  it('generates and verifies an access token', () => {
    const token = generateToken(payload, 'access');
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(100001);
    expect(decoded.username).toBe('tester');
  });

  it('generates a refresh token too', () => {
    expect(typeof generateToken(payload, 'refresh')).toBe('string');
  });

  it('generates a token pair', () => {
    const pair = generateTokenPair(payload);
    expect(typeof pair.accessToken).toBe('string');
    expect(typeof pair.refreshToken).toBe('string');
    expect(pair.expiresIn).toBeDefined();
    expect(pair.refreshExpiresIn).toBeDefined();
  });

  it('returns null for invalid tokens', () => {
    expect(verifyToken('not-a-token')).toBe(null);
  });

  it('refreshes a valid refresh token', () => {
    const { refreshToken } = generateTokenPair(payload);
    const refreshed = refreshAccessToken(refreshToken);
    expect(typeof refreshed.accessToken).toBe('string');
    expect(typeof refreshed.refreshToken).toBe('string');
    expect(verifyToken(refreshed.accessToken).userId).toBe(100001);
  });

  it('throws when refreshing an invalid token', () => {
    expect(() => refreshAccessToken('bad')).toThrow('无效的refresh token');
  });

  it('decodes a token without verifying', () => {
    const token = signToken(payload, '1h');
    expect(decodeToken(token).userId).toBe(100001);
    expect(decodeToken('garbage')).toBe(null);
  });
});
