// 确保所有 JSON 响应强制使用 UTF-8 编码，防止中文乱码
const setJsonUtf8 = (res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
};

const response = {
  success: (res, data = {}, message = 'success') => {
    setJsonUtf8(res);
    return res.status(200).json({
      code: 200,
      message,
      data
    });
  },
  
  created: (res, data = {}, message = '创建成功') => {
    setJsonUtf8(res);
    return res.status(201).json({
      code: 201,
      message,
      data
    });
  },
  
  badRequest: (res, message = '请求参数错误') => {
    setJsonUtf8(res);
    return res.status(400).json({
      code: 400,
      message
    });
  },
  
  unauthorized: (res, message = '未授权') => {
    setJsonUtf8(res);
    return res.status(401).json({
      code: 401,
      message
    });
  },
  
  forbidden: (res, message = '禁止访问') => {
    setJsonUtf8(res);
    return res.status(403).json({
      code: 403,
      message
    });
  },
  
  notFound: (res, message = '资源不存在') => {
    setJsonUtf8(res);
    return res.status(404).json({
      code: 404,
      message
    });
  },
  
  unprocessableEntity: (res, message = '业务逻辑错误', errors = {}) => {
    setJsonUtf8(res);
    return res.status(422).json({
      code: 422,
      message,
      errors
    });
  },
  
  error: (res, message = '服务器错误') => {
    setJsonUtf8(res);
    return res.status(500).json({
      code: 500,
      message
    });
  },

  // 数据库错误统一响应 — 显式 500 不静默降级
  dbError: (res, operation = '数据库操作', detail = '') => {
    setJsonUtf8(res);
    const message = detail ? `${operation}失败: ${detail}` : `${operation}失败，请检查数据库连接`;
    return res.status(500).json({
      code: 500,
      message,
      error: `${operation}_failed`
    });
  },
  
  custom: (res, code, message = '', data = {}) => {
    setJsonUtf8(res);
    return res.status(code).json({
      code,
      message,
      data
    });
  }
};

module.exports = response;
