const fs = require('fs');
const path = require('path');

// 审计低危项：错误信息外泄。两处最易复发的回归——
//   ① /api/health 的 503 分支把依赖异常的 e.message 原样回传（匿名可达端点）；
//   ② 管理端登录 catch 的调试行把完整堆栈写进容器日志。
const BACKEND = path.resolve(__dirname, '../../..');

const read = (rel) => fs.readFileSync(path.join(BACKEND, rel), 'utf8');

describe('错误信息与日志卫生（低危项）', () => {
  it('server.js 不再把依赖异常的 e.message 放进响应体', () => {
    const src = read('server.js');
    expect(src).not.toMatch(/error:\s*e\.message/);
    expect(src).not.toMatch(/data:\s*\{[^}]*message:\s*e\.message/);
  });

  it('adminManage.js 不再保留登录调试用的堆栈 console 输出', () => {
    const src = read('src/controllers/adminManage.js');
    expect(src).not.toContain('Admin login debug');
    expect(src).not.toMatch(/console\.error\([^)]*\.stack/);
  });
});
