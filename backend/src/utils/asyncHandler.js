/**
 * 异步路由处理器包装器
 * 自动捕获 async 路由中的异常并传递给 Express 错误处理中间件
 * 
 * 用法: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;
