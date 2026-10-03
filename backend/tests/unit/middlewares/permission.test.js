const { requirePermission } = require('../../../src/middlewares/permission');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Middleware - Permission', () => {
  it('rejects unauthenticated requests', () => {
    const res = mockRes();
    requirePermission('user:read')({}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('allows super admins', () => {
    const next = jest.fn();
    requirePermission('user:read')({ admin: { id: 1, permissions: ['all'] } }, mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('allows admins with the required permission', () => {
    const next = jest.fn();
    requirePermission('user:read')({ admin: { id: 2, permissions: '["user:read"]' } }, mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('rejects admins without the permission', () => {
    const res = mockRes();
    requirePermission('user:write')({ admin: { id: 2, permissions: '["user:read"]' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('rejects admins with no permissions', () => {
    const res = mockRes();
    requirePermission('user:read')({ admin: { id: 3, permissions: '[]' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
