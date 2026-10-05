const fs = require('fs');
const path = require('path');

// 审计 M-9：nginx 的 add_header 继承是「全有或全无」——任一 server / location
// 只要自带哪怕一条 add_header，就会丢弃从上层继承来的全部安全头。本机没有 nginx
// 可执行文件（也起不了容器），因此用静态解析兜住这条最容易复发的回归：把「自带
// add_header 却没有重新引入安全头片段」的块找出来，防止后续新增 location 时再次漏网。
const NGINX_DIR = path.resolve(__dirname, '../../../../nginx');

const COMMON_SNIPPET = '/etc/nginx/conf.d/security-headers.inc';
const SSL_SNIPPET = '/etc/nginx/conf.d/security-headers-ssl.inc';

// 站点配置：80 用通用片段，443 用 ssl 片段
const SITE_FILES = [
  { file: 'conf.d/default.conf', snippet: COMMON_SNIPPET },
  { file: 'conf.d/default.ssl.conf', snippet: SSL_SNIPPET }
];

function read(rel) {
  return fs.readFileSync(path.join(NGINX_DIR, rel), 'utf8');
}

// 去掉注释；本仓库 nginx 配置里的头值不含 '#'，按行截断安全
function stripComments(text) {
  return text
    .split('\n')
    .map((line) => line.replace(/#.*$/, ''))
    .join('\n');
}

// 提取所有 `location ... {` / `server {` 块（含嵌套体的起止下标）
function extractBlocks(text) {
  const blocks = [];
  const re = /\b(location|server)\b[^{;]*\{/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const start = text.indexOf('{', m.index);
    let depth = 0;
    let end = -1;
    for (let i = start; i < text.length; i += 1) {
      if (text[i] === '{') depth += 1;
      else if (text[i] === '}') {
        depth -= 1;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end === -1) continue;
    const label = `${m[1]}${text.slice(m.index + m[1].length, start)}`.replace(/\s+/g, ' ').trim();
    blocks.push({ start, end, label });
    re.lastIndex = start + 1;
  }
  return blocks;
}

// 一个块的「直接内容」= 去掉所有嵌套子块后的文本（避免把子块的 add_header 误算到父块头上）
function directBody(text, block, blocks) {
  const children = blocks
    .filter((b) => b !== block && b.start > block.start && b.end < block.end)
    .sort((a, b) => a.start - b.start);
  let out = '';
  let cursor = block.start + 1;
  for (const child of children) {
    if (child.start < cursor) continue;
    out += text.slice(cursor, child.start);
    cursor = child.end + 1;
  }
  out += text.slice(cursor, block.end);
  return out;
}

describe('Nginx 安全头继承（审计 M-9）', () => {
  it('通用片段定义四类基线安全头', () => {
    const snippet = stripComments(read('conf.d/security-headers.inc'));
    expect(snippet).toMatch(/add_header\s+X-Content-Type-Options\s+"nosniff"/);
    expect(snippet).toMatch(/add_header\s+X-Frame-Options\s+"SAMEORIGIN"/);
    expect(snippet).toMatch(/add_header\s+Referrer-Policy\s+"strict-origin-when-cross-origin"/);
    expect(snippet).toMatch(/add_header\s+Content-Security-Policy\s+".*frame-ancestors 'self'/);
  });

  it('ssl 片段在通用片段之上补 HSTS 与 X-XSS-Protection', () => {
    const snippet = stripComments(read('conf.d/security-headers-ssl.inc'));
    expect(snippet).toMatch(/add_header\s+Strict-Transport-Security\s+"max-age=\d+/);
    expect(snippet).toMatch(/add_header\s+X-XSS-Protection/);
    // 复用通用片段而不是复制一份，避免两处漂移
    expect(snippet).toContain(`include ${COMMON_SNIPPET};`);
  });

  it('nginx.conf 的 http 块引入通用片段作为基线', () => {
    const text = stripComments(read('nginx.conf'));
    expect(text).toContain(`include ${COMMON_SNIPPET};`);
    // 不允许在 http 层再零散写安全头（会与片段重复且难以维护一致性）
    expect(text).not.toMatch(/add_header\s+X-Content-Type-Options/);
    expect(text).not.toMatch(/add_header\s+Content-Security-Policy/);
  });

  it.each(SITE_FILES)(
    '$file：每个自带 add_header 的块都重新引入了 $snippet',
    ({ file, snippet }) => {
      const text = stripComments(read(file));
      const blocks = extractBlocks(text);
      expect(blocks.length).toBeGreaterThan(0);

      const offenders = blocks.filter((block) => {
        const direct = directBody(text, block, blocks);
        const hasAddHeader = /(^|\s)add_header\s/.test(direct);
        const reIntroduces = direct.includes(`include ${snippet};`);
        return hasAddHeader && !reIntroduces;
      });

      expect(offenders.map((b) => b.label)).toEqual([]);
    }
  );

  it('非 ssl 站点文件不误引 ssl 片段（HSTS 不应在 80 端口下发）', () => {
    const text = stripComments(read('conf.d/default.conf'));
    expect(text).not.toContain('security-headers-ssl.inc');
  });

  it('生产 SSL 站点文件不残留直接声明的安全头（应全部走片段）', () => {
    const text = stripComments(read('conf.d/default.ssl.conf'));
    expect(text).not.toMatch(/add_header\s+Strict-Transport-Security/);
    expect(text).not.toMatch(/add_header\s+X-Content-Type-Options/);
    expect(text).not.toMatch(/add_header\s+X-Frame-Options/);
  });
});
