const fs = require('fs');
const path = require('path');

// 审计低危项：基础镜像固定。本机没有 docker（也拉不了镜像），因此用静态解析兜住两类
// 最易复发的回归：① 回退到已 EOL 的 Node 线（16/18）；② mysql/mongo 重新写成浮动的
// major.minor 标签。已用镜像仓库 manifest 校验过 mysql:8.0.45 与 mongo:6.0.28 实际存在。
const ROOT = path.resolve(__dirname, '../../../..');

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

describe('基础镜像固定（低危项）', () => {
  const dockerfile = read('Dockerfile');
  const dockerfileDev = read('Dockerfile.dev');
  const compose = read('docker-compose.yml');
  const composeDev = read('docker-compose.dev.yml');

  it('Dockerfile 的 Node 基础镜像不在已 EOL 的 16/18 线上（builder + runtime 两阶段）', () => {
    const majors = [...dockerfile.matchAll(/FROM\s+node:(\d+)(?:[.\-])/g)].map((m) => Number(m[1]));
    expect(majors.length).toBeGreaterThanOrEqual(2);
    majors.forEach((major) => expect(major).toBeGreaterThanOrEqual(20));
  });

  it('开发镜像（Dockerfile.dev / docker-compose.dev.yml）同样不在 EOL 线', () => {
    expect(dockerfileDev).not.toMatch(/FROM\s+node:(16|18)(?:[.\-])/);
    expect(composeDev).not.toMatch(/image:\s*node:(16|18)(?:[.\-])/);
    expect(composeDev).toMatch(/image:\s*node:\d+/);
  });

  it('mysql 固定到明确补丁版（不再浮动 8.0）', () => {
    expect(compose).toMatch(/image:\s*mysql:8\.0\.\d+/);
    expect(compose).not.toMatch(/image:\s*mysql:8\.0\s*$/m);
  });

  it('mongo 固定到明确补丁版（不再浮动 6.0）', () => {
    expect(compose).toMatch(/image:\s*mongo:6\.0\.\d+/);
    expect(compose).not.toMatch(/image:\s*mongo:6\.0\s*$/m);
  });
});
