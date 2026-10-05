const { safeExtension, SAFE_EXTENSIONS, MIME_EXTENSION } = require('../../../src/utils/uploadFileNaming');

describe('utils/uploadFileNaming - M-12 上传后缀收敛', () => {
  it('白名单扩展名原样保留（大小写归一）', () => {
    expect(safeExtension('photo.JPG', 'image/jpeg')).toBe('.jpg');
    expect(safeExtension('a.png', 'image/png')).toBe('.png');
    expect(safeExtension('b.gif', 'image/gif')).toBe('.gif');
    expect(safeExtension('c.webp', 'image/webp')).toBe('.webp');
    expect(safeExtension('d.mp3', 'audio/mpeg')).toBe('.mp3');
    expect(safeExtension('e.wav', 'audio/wav')).toBe('.wav');
    expect(safeExtension('f.amr', 'audio/amr')).toBe('.amr');
    expect(safeExtension('g.mp4', 'video/mp4')).toBe('.mp4');
  });

  it('可执行后缀被丢弃，回退到 mimetype 映射（防存储型 XSS）', () => {
    expect(safeExtension('evil.html', 'image/jpeg')).toBe('.jpg');
    expect(safeExtension('evil.svg', 'image/png')).toBe('.png');
    expect(safeExtension('evil.php', 'video/mp4')).toBe('.mp4');
    expect(safeExtension('evil.js', 'image/webp')).toBe('.webp');
    expect(safeExtension('shell.htm', 'audio/mpeg')).toBe('.mp3');
  });

  it('路径穿越/超长/多点后缀都被收敛', () => {
    expect(safeExtension('../../evil.html', 'image/png')).toBe('.png');
    expect(safeExtension('a.verylongextension', 'image/jpeg')).toBe('.jpg');
    expect(safeExtension('evil.html.jpg', 'image/jpeg')).toBe('.jpg');
    expect(safeExtension('trailing.', 'image/jpeg')).toBe('.jpg');
  });

  it('未知 mimetype 且后缀不安全 = 空串（无后缀落盘，静态访问为 octet-stream）', () => {
    expect(safeExtension('evil.html', 'application/octet-stream')).toBe('');
    expect(safeExtension('noext', undefined)).toBe('');
    expect(safeExtension('noext', 'text/html')).toBe('');
  });

  it('原名缺失/空白时仍可按 mimetype 兜底，否则空串', () => {
    expect(safeExtension(undefined, 'image/png')).toBe('.png');
    expect(safeExtension(null, 'video/mp4')).toBe('.mp4');
    expect(safeExtension('', 'image/jpeg')).toBe('.jpg');
    expect(safeExtension(undefined, undefined)).toBe('');
  });

  it('白名单与 mimetype 映射覆盖 image/audio/video 三类且不含可执行后缀', () => {
    for (const ext of SAFE_EXTENSIONS) {
      expect(ext).toMatch(/^\.[a-z0-9]{1,4}$/);
    }
    for (const ext of Object.values(MIME_EXTENSION)) {
      expect(SAFE_EXTENSIONS.has(ext)).toBe(true);
    }
  });
});
