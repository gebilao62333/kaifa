const security = require('../../../src/middlewares/security');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.locals = {};
  return res;
};

describe('Middleware - Security', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('sanitizeInput', () => {
    it('returns non-string input unchanged', () => {
      expect(security.sanitizeInput(123)).toBe(123);
      expect(security.sanitizeInput(null)).toBe(null);
    });

    it('strips script tags and javascript urls', () => {
      expect(security.sanitizeInput('<script>alert(1)</script>')).toBe('');
      expect(security.sanitizeInput('javascript:alert(1)')).not.toContain('javascript:');
    });

    it('escapes html special characters', () => {
      expect(security.sanitizeInput('<b>"x"</b>')).toBe('&lt;b&gt;&quot;x&quot;&lt;/b&gt;');
    });

    it('leaves slashes untouched for urls', () => {
      expect(security.sanitizeInput('a/b')).toBe('a/b');
    });
  });

  describe('xssProtection', () => {
    it('sanitizes nested body and query strings', () => {
      const req = {
        body: { a: '<script>x</script>', nested: { b: '<b>y</b>' }, list: ['<i>z</i>'] },
        query: { q: '<u>w</u>' }
      };
      const next = jest.fn();
      security.xssProtection(req, mockRes(), next);
      expect(next).toHaveBeenCalled();
      expect(req.body.a).toBe('');
      expect(req.body.nested.b).toBe('&lt;b&gt;y&lt;/b&gt;');
      expect(req.body.list[0]).toBe('&lt;i&gt;z&lt;/i&gt;');
      expect(req.query.q).toBe('&lt;u&gt;w&lt;/u&gt;');
    });

    it('works without body or query', () => {
      const next = jest.fn();
      security.xssProtection({}, mockRes(), next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('csrfProtection', () => {
    const freshToken = () => {
      const getRes = mockRes();
      security.csrfProtection({ method: 'GET', cookies: {}, headers: {}, query: {}, body: {} }, getRes, jest.fn());
      return getRes.cookie.mock.calls[0][1];
    };

    it('issues a token on GET', () => {
      const res = mockRes();
      const next = jest.fn();
      security.csrfProtection({ method: 'GET', cookies: {}, headers: {}, query: {}, body: {} }, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.cookie).toHaveBeenCalledWith('XSRF-TOKEN', expect.any(String), expect.any(Object));
      expect(res.locals.csrfToken).toEqual(expect.any(String));
    });

    it('reuses an existing valid cookie token', () => {
      const token = freshToken();
      const res = mockRes();
      const next = jest.fn();
      security.csrfProtection({ method: 'GET', cookies: { 'XSRF-TOKEN': token }, headers: {}, query: {}, body: {} }, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.locals.csrfToken).toBe(token);
    });

    it('rejects POST without a token', () => {
      const res = mockRes();
      security.csrfProtection({ method: 'POST', cookies: {}, headers: {}, query: {}, body: {} }, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('rejects POST with an unknown token', () => {
      const res = mockRes();
      security.csrfProtection({ method: 'POST', headers: { 'x-xsrf-token': 'nope' }, query: {}, body: {} }, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('accepts a token from header, body and query', () => {
      const fromHeader = freshToken();
      const headerOk = jest.fn();
      security.csrfProtection({ method: 'POST', headers: { 'x-xsrf-token': fromHeader }, query: {}, body: {} }, mockRes(), headerOk);
      expect(headerOk).toHaveBeenCalled();

      const fromBody = freshToken();
      const bodyOk = jest.fn();
      security.csrfProtection({ method: 'POST', headers: {}, query: {}, body: { _csrf: fromBody } }, mockRes(), bodyOk);
      expect(bodyOk).toHaveBeenCalled();

      const fromQuery = freshToken();
      const queryOk = jest.fn();
      security.csrfProtection({ method: 'POST', headers: {}, query: { _csrf: fromQuery }, body: {} }, mockRes(), queryOk);
      expect(queryOk).toHaveBeenCalled();
    });

    it('rejects an expired token', () => {
      const token = freshToken();
      const realNow = Date.now;
      Date.now = () => realNow() + 4000000;
      try {
        const res = mockRes();
        security.csrfProtection({ method: 'POST', headers: { 'x-xsrf-token': token }, query: {}, body: {} }, res, jest.fn());
        expect(res.status).toHaveBeenCalledWith(403);
      } finally {
        Date.now = realNow;
      }
    });
  });

  it('generateCsrfToken returns a hex string', () => {
    const token = security.generateCsrfToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });
});
