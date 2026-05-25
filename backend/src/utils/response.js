const response = {
  success: (res, data = {}, message = 'success') => {
    return res.status(200).json({
      code: 200,
      message,
      data
    });
  },
  
  created: (res, data = {}, message = '创建成功') => {
    return res.status(201).json({
      code: 201,
      message,
      data
    });
  },
  
  badRequest: (res, message = '请求参数错误') => {
    return res.status(400).json({
      code: 400,
      message
    });
  },
  
  unauthorized: (res, message = '未授权') => {
    return res.status(401).json({
      code: 401,
      message
    });
  },
  
  forbidden: (res, message = '禁止访问') => {
    return res.status(403).json({
      code: 403,
      message
    });
  },
  
  notFound: (res, message = '资源不存在') => {
    return res.status(404).json({
      code: 404,
      message
    });
  },
  
  unprocessableEntity: (res, message = '业务逻辑错误') => {
    return res.status(422).json({
      code: 422,
      message
    });
  },
  
  error: (res, message = '服务器错误') => {
    return res.status(500).json({
      code: 500,
      message
    });
  },
  
  custom: (res, code, message = '', data = {}) => {
    return res.status(code).json({
      code,
      message,
      data
    });
  }
};

module.exports = response;
