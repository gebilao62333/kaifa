const User = require('../../../src/models/mysql/User');

describe('User 模型 - status 语义一致性', () => {
  // 背景：authMiddleware 以 `user.status !== 1` 判定「账号已被禁用」，
  // 管理后台同样以 1=正常 / 0=禁用 展示与切换。
  // 模型默认值曾为 0，导致新注册用户一注册就被判为禁用，所有需登录接口返回 403。
  it('status 默认值应为 1（正常），而非 0（禁用）', () => {
    expect(User.rawAttributes.status.defaultValue).toBe(1);
  });
});
