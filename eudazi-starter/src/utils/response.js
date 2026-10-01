// 统一 API 响应格式，所有控制器通过本模块返回数据，保证前后端契约一致。
const response = {
  success: (res, data = {}, message = 'success') =>
    res.status(200).json({ code: 200, message, data }),
  created: (res, data = {}, message = '创建成功') =>
    res.status(201).json({ code: 201, message, data }),
  badRequest: (res, message = '请求参数错误') =>
    res.status(400).json({ code: 400, message }),
  unauthorized: (res, message = '未授权') =>
    res.status(401).json({ code: 401, message }),
  forbidden: (res, message = '禁止访问') =>
    res.status(403).json({ code: 403, message }),
  notFound: (res, message = '资源不存在') =>
    res.status(404).json({ code: 404, message }),
  error: (res, message = '服务器错误') =>
    res.status(500).json({ code: 500, message }),
};

module.exports = response;
