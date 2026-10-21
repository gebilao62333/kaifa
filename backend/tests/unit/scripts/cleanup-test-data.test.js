// P2-13：生产测试数据清理工具（backend/scripts/cleanup-test-data.js）的纯函数单测。
// 覆盖筛选条件、统计口径、建议 SQL 与 --apply 安全闸门；不连接数据库、不执行任何 DELETE。
const script = require('../../../scripts/cleanup-test-data');

describe('Scripts - 测试数据清理工具（P2-13，默认 dry-run）', () => {
  describe('筛选条件', () => {
    it('测试用户必须同时命中昵称前缀与 Sealos 数据标记', () => {
      const where = script.buildTestUserWhere();
      expect(where.clause).toContain('`nickname` LIKE ?');
      expect(where.clause).toContain('`dec` = ?');
      expect(where.params).toEqual(['测试用户%', 'Sealos 测试数据']);
    });

    it('仅昵称命中只用于统计候选，不参与删除条件', () => {
      const where = script.buildTestUserNicknameOnlyWhere();
      expect(where.clause).toBe('`nickname` LIKE ?');
      expect(where.params).toEqual(['测试用户%']);
    });

    it('测试动态按内容前缀筛选', () => {
      expect(script.buildTestPostWhere()).toEqual({
        clause: '`content` LIKE ?',
        params: ['Sealos 测试动态%']
      });
    });

    it('点赞/评论/解锁按测试动态子查询关联', () => {
      const where = script.buildPostAssociationWhere('post_id');
      expect(where.clause).toBe('`post_id` IN (SELECT `id` FROM `xn_post` WHERE `content` LIKE ?)');
      expect(where.params).toEqual(['Sealos 测试动态%']);
    });

    it('图片外链条件同时覆盖 picsum.photos 与 seed.local', () => {
      const where = script.buildExternalImageWhere('avatar');
      expect(where.clause).toBe('(`avatar` LIKE ? OR `avatar` LIKE ?)');
      expect(where.params).toEqual(['%picsum.photos%', '%seed.local%']);
    });

    it('测试 Banner 条件覆盖 bannerN.png 与两类外链', () => {
      const where = script.buildTestBannerWhere();
      expect(where.clause).toBe('(`image` LIKE ? OR `image` LIKE ? OR `image` LIKE ?)');
      expect(where.params).toEqual(['banner%.png', '%picsum.photos%', '%seed.local%']);
    });

    it('SQL 建议里把常量内联为可直接执行的语句（无占位符）', () => {
      const sql = script.buildSuggestedSql({ testUsers: 100, testPosts: 95, externalImageRefTotal: 3 }).join('\n');
      expect(sql).toContain("`nickname` LIKE '测试用户%'");
      expect(sql).toContain("`dec` = 'Sealos 测试数据'");
      expect(sql).toContain("`content` LIKE 'Sealos 测试动态%'");
      expect(sql).toContain("LIKE 'banner%.png'");
      expect(sql).not.toContain('?');
    });
  });

  describe('外链判定与 URL 解析', () => {
    it('识别 picsum / seed.local（大小写不敏感），其它地址返回 null', () => {
      expect(script.classifyExternalImageUrl('https://picsum.photos/200/200?random=1')).toBe('picsum');
      expect(script.classifyExternalImageUrl('https://SEED.local/photo/1.jpg')).toBe('seed.local');
      expect(script.classifyExternalImageUrl('https://cdn.example.com/a.png')).toBeNull();
      expect(script.classifyExternalImageUrl('')).toBeNull();
      expect(script.classifyExternalImageUrl(null)).toBeNull();
      expect(script.classifyExternalImageUrl(undefined)).toBeNull();
    });

    it('isExternalTestImageUrl 只认两类测试外链', () => {
      expect(script.isExternalTestImageUrl('https://picsum.photos/600/400?random=7000')).toBe(true);
      expect(script.isExternalTestImageUrl('https://seed.local/media/1.jpg')).toBe(true);
      expect(script.isExternalTestImageUrl('https://cos.ap-guangzhou.myqcloud.com/a.png')).toBe(false);
    });

    it('解析动态 images：JSON 数组 / 逗号分隔 / 单个地址 / 空值', () => {
      expect(script.parseImageRefs('["https://picsum.photos/a.png","https://seed.local/b.png"]')).toEqual([
        'https://picsum.photos/a.png',
        'https://seed.local/b.png'
      ]);
      expect(script.parseImageRefs('https://picsum.photos/a.png, https://seed.local/b.png')).toEqual([
        'https://picsum.photos/a.png',
        'https://seed.local/b.png'
      ]);
      expect(script.parseImageRefs('https://cdn.example.com/a.png')).toEqual(['https://cdn.example.com/a.png']);
      expect(script.parseImageRefs('')).toEqual([]);
      expect(script.parseImageRefs(null)).toEqual([]);
      expect(script.parseImageRefs([])).toEqual([]);
    });
  });

  describe('统计口径聚合', () => {
    it('汇总外链总数、过滤 0 行明细、归一化计数并保留异常', () => {
      const summary = script.summarizeCounts({
        testUsers: 100,
        testUsersNicknameOnly: '120',
        testPosts: 95,
        testPostLikes: 95,
        testPostComments: 95,
        testPostUnlocks: 20,
        testBanners: 3,
        imageRefs: [
          { table: 'xn_user', column: 'avatar', label: '用户头像', count: 100 },
          { table: 'xn_post', column: 'images', label: '动态图片', count: '95' },
          { table: 'xn_game', column: 'image', label: '游戏图标', count: 0 }
        ],
        errors: ['xn_old.col: Unknown column']
      });

      expect(summary.testUsers).toBe(100);
      expect(summary.testUsersNicknameOnly).toBe(120);
      expect(summary.externalImageRefTotal).toBe(195);
      expect(summary.externalImageRefs).toHaveLength(2);
      expect(summary.externalImageRefs[1].count).toBe(95);
      expect(summary.errors).toEqual(['xn_old.col: Unknown column']);
    });

    it('缺失/非法计数一律归零', () => {
      const summary = script.summarizeCounts({ testUsers: 'abc', imageRefs: null });
      expect(summary.testUsers).toBe(0);
      expect(summary.externalImageRefTotal).toBe(0);
      expect(summary.externalImageRefs).toEqual([]);
      expect(summary.errors).toEqual([]);
    });
  });

  describe('Markdown 摘要', () => {
    it('包含 dry-run 提示、计数表与外链明细', () => {
      const summary = script.summarizeCounts({
        testUsers: 2,
        testPosts: 1,
        testBanners: 3,
        imageRefs: [{ table: 'xn_user', column: 'avatar', label: '用户头像', count: 2 }]
      });
      const markdown = script.formatMarkdown(summary);
      expect(markdown).toContain('dry-run');
      expect(markdown).toContain('测试用户');
      expect(markdown).toContain('xn_user.avatar');
      expect(markdown).toContain('| 用户头像 | 2 |');
    });

    it('没有任何外链时给出「未发现」提示', () => {
      const markdown = script.formatMarkdown(script.summarizeCounts({}));
      expect(markdown).toContain('未发现 picsum.photos / seed.local 引用');
    });
  });

  describe('--apply 安全闸门（必须在连库前生效）', () => {
    it('默认 dry-run：不带 --apply 时不允许删除', () => {
      const args = script.parseArgs([]);
      expect(args.apply).toBe(false);
      expect(script.assertApplyAllowed(args)).toBe(false);
    });

    it('仅 --apply 时拒绝执行', () => {
      const args = script.parseArgs(['--apply']);
      expect(args.apply).toBe(true);
      expect(() => script.assertApplyAllowed(args)).toThrow('--confirm=DELETE-TEST-DATA');
    });

    it('确认串不正确时拒绝执行', () => {
      const args = script.parseArgs(['--apply', '--confirm=delete']);
      expect(() => script.assertApplyAllowed(args)).toThrow(/拒绝执行/);
    });

    it('--apply 且确认串正确才放行，并解析 --json', () => {
      const args = script.parseArgs(['--apply', '--confirm=DELETE-TEST-DATA', '--json']);
      expect(script.assertApplyAllowed(args)).toBe(true);
      expect(args.json).toBe(true);
      expect(args.confirm).toBe('DELETE-TEST-DATA');
    });

    it('未知参数被收集（main 会拒绝执行）', () => {
      expect(script.parseArgs(['--drop-all']).unknown).toEqual(['--drop-all']);
    });
  });

  describe('数据库配置校验（不连接数据库）', () => {
    it('缺少必需变量时抛错并指出缺失项', () => {
      expect(() => script.buildDbConfig({ DB_HOST: '127.0.0.1' })).toThrow(/DB_USER/);
      expect(() => script.buildDbConfig({ DB_HOST: '127.0.0.1', DB_USER: 'u' })).toThrow(/DB_PASSWORD/);
    });

    it('默认端口 3306、默认库名 eudazi、端口可覆盖', () => {
      const config = script.buildDbConfig({ DB_HOST: '127.0.0.1', DB_USER: 'u', DB_PASSWORD: 'p' });
      expect(config.port).toBe(3306);
      expect(config.database).toBe('eudazi');
      expect(script.buildDbConfig({ DB_HOST: 'h', DB_USER: 'u', DB_PASSWORD: 'p', DB_PORT: '3307', DB_NAME: 'x' }).port).toBe(3307);
    });
  });
});
