#!/usr/bin/env node
/**
 * P2-13 生产测试数据清理工具（默认 dry-run，绝不自动删除）
 *
 * 背景：线上仍残留种子/测试数据（《前端页面功能全面检查报告-2026-10-21.md》P2-13）：
 *   - 测试用户：nickname LIKE '测试用户%' 且 dec = 'Sealos 测试数据'
 *   - 测试动态：content LIKE 'Sealos 测试动态%'
 *   - 图片外链：picsum.photos / seed.local（头像、动态图、相册、礼物、游戏图标、开屏等列）
 *   - 测试 Banner：xn_banner.image = banner1.png / banner2.png / banner3.png（见 backend/sql/02_init_data.sql）
 *
 * 用法：
 *   cd backend
 *   node scripts/cleanup-test-data.js                      # 默认 dry-run：统计 + 建议 SQL，不改库
 *   node scripts/cleanup-test-data.js --json               # 只输出 JSON 摘要
 *   node scripts/cleanup-test-data.js --help
 *   # 危险操作：仅在 dry-run 结果经人工确认、且已备份后才执行
 *   node scripts/cleanup-test-data.js --apply --confirm=DELETE-TEST-DATA
 *
 * 安全闸门：
 *   1) 默认 dry-run，只读；
 *   2) --apply 必须与 --confirm=DELETE-TEST-DATA 同时出现，否则在连接数据库之前直接退出；
 *   3) --apply 在真正 DELETE 前会重新统计并再打印一次待删数量，所有删除在同一事务内完成；
 *   4) 脚本不会自动运行（require.main 守卫），也不会被 server.js / 迁移引用；
 *   5) 只输出数量，不打印手机号、nickname 等 PII。
 *
 * 建议 SQL / 操作顺序（人工执行时；脚本 dry-run 也会输出同样内容）：
 *   -- 0) 先备份（删除不可回滚！）
 *   --    cd backend && node scripts/backup.js --mode=local --target=mysql
 *   -- 1) 复核口径
 *   SELECT COUNT(*) FROM `xn_user` WHERE `nickname` LIKE '测试用户%' AND `dec` = 'Sealos 测试数据';
 *   SELECT COUNT(*) FROM `xn_post` WHERE `content` LIKE 'Sealos 测试动态%';
 *   -- 2) 先删关联（点赞/评论/解锁），再删测试动态，最后删测试用户（同一事务）
 *   DELETE FROM `xn_post_like`    WHERE `post_id` IN (SELECT `id` FROM `xn_post` WHERE `content` LIKE 'Sealos 测试动态%');
 *   DELETE FROM `xn_post_comment` WHERE `post_id` IN (SELECT `id` FROM `xn_post` WHERE `content` LIKE 'Sealos 测试动态%');
 *   DELETE FROM `xn_post_unlock`  WHERE `post_id` IN (SELECT `id` FROM `xn_post` WHERE `content` LIKE 'Sealos 测试动态%');
 *   -- 测试用户还持有订单/钱包/聊天等关联数据：按脚本 USER_OWNED_TABLES 常量逐表按 user_id 清理，
 *   -- 否则直接删 xn_user 会留下孤儿行。--apply 会自动完成这一步。
 *   DELETE FROM `xn_post` WHERE `content` LIKE 'Sealos 测试动态%';
 *   DELETE FROM `xn_user` WHERE `nickname` LIKE '测试用户%' AND `dec` = 'Sealos 测试数据';
 *   -- 3) Banner 只报告不自动删：确认 banner1/2/3.png 是占位资源后替换为正式图或下架
 *   SELECT `id`, `title`, `image` FROM `xn_banner` WHERE `image` LIKE 'banner%.png';
 *   UPDATE `xn_banner` SET `image` = '<正式图 URL>' WHERE `image` LIKE 'banner%.png';
 *   -- 4) picsum.photos / seed.local 外链按上表逐列处理；替换为自有存储地址，不要直接 DELETE 真实用户上传行。
 *
 * 退出码：dry-run 正常 0；参数不合法 / 数据库配置缺失 / 执行异常 1。
 */
'use strict';

// ===== 统计口径（唯一真源：SQL 条件与建议 SQL 都由这些常量生成） =====
const TEST_USER_NICKNAME_LIKE = '测试用户%';
const TEST_USER_DEC = 'Sealos 测试数据';
const TEST_POST_CONTENT_LIKE = 'Sealos 测试动态%';
const TEST_BANNER_IMAGE_LIKE = 'banner%.png';
const EXTERNAL_IMAGE_HOSTS = ['picsum.photos', 'seed.local'];
const APPLY_CONFIRM_TOKEN = 'DELETE-TEST-DATA';

// 图片外链扫描列（表/列均来自 models/mysql 现有字段，避免拼出不存在的列）
const IMAGE_REF_COLUMNS = [
  { table: 'xn_user', column: 'avatar', label: '用户头像' },
  { table: 'xn_companion_profile', column: 'icon', label: '陪玩资料图标' },
  { table: 'xn_companion_profile', column: 'voice_intro', label: '陪玩语音介绍' },
  { table: 'xn_post', column: 'images', label: '动态图片' },
  { table: 'xn_post', column: 'videos', label: '动态视频' },
  { table: 'xn_album_photo', column: 'image_url', label: '相册图片' },
  { table: 'xn_media_asset', column: 'url', label: '媒资地址' },
  { table: 'xn_gift', column: 'image', label: '礼物图片' },
  { table: 'xn_gift', column: 'svga', label: '礼物动效' },
  { table: 'xn_game', column: 'image', label: '游戏图标' },
  { table: 'xn_game', column: 'image_bg', label: '游戏背景图' },
  { table: 'xn_gift_log', column: 'user_avatar', label: '礼物记录头像' },
  { table: 'xn_gift_log', column: 'song_user_avatar', label: '礼物记录对方头像' },
  { table: 'xn_virtual_user', column: 'avatar', label: '虚拟用户头像' },
  { table: 'xn_splash_screen', column: 'image', label: '开屏弹窗图片' }
];

// 测试用户名下需要先级联清理的表（与 scripts/seed-test-data.js 的 DELETE_BY_USER 同口径）。
// 只按 user_id 列删除；不含 xn_post 之外的业务外键，避免误伤真实用户数据。
const USER_OWNED_TABLES = {
  xn_companion_profile: ['user_id'],
  xn_game_order: ['user_id', 'target_user_id'],
  xn_gift_log: ['user_id', 'song_user_id'],
  xn_order_chong: ['user_id'],
  xn_post: ['user_id'],
  xn_post_like: ['user_id'],
  xn_post_comment: ['user_id'],
  xn_post_unlock: ['user_id'],
  xn_user_follow: ['follower_id', 'following_id'],
  xn_album_photo: ['user_id'],
  xn_album_like: ['user_id'],
  xn_red_packet: ['sender_id'],
  xn_red_packet_log: ['user_id'],
  xn_report: ['user_id', 'target_user_id'],
  xn_reserve: ['user_id', 'target_user_id'],
  xn_reserve_slot: ['user_id'],
  xn_demand: ['user_id'],
  xn_call_record: ['caller_id', 'callee_id'],
  xn_call_billing: ['user_id', 'companion_id'],
  xn_chat_room: ['user_id'],
  xn_chat_log: ['fromid', 'toid'],
  xn_card: ['use_user_id'],
  xn_withdraw: ['user_id'],
  xn_media_asset: ['user_id'],
  xn_feedback: ['user_id'],
  xn_user_visit: ['user_id', 'visitor_id'],
  xn_user_pref: ['user_id'],
  xn_virtual_chat_history: ['user_id']
};

// ===== 纯函数：筛选条件（可单测，不碰数据库） =====
const buildTestUserWhere = () => ({
  clause: '`nickname` LIKE ? AND `dec` = ?',
  params: [TEST_USER_NICKNAME_LIKE, TEST_USER_DEC]
});

// 仅昵称命中的候选（不含 dec 标记），只统计不删除，避免把同名真实用户当成测试号
const buildTestUserNicknameOnlyWhere = () => ({
  clause: '`nickname` LIKE ?',
  params: [TEST_USER_NICKNAME_LIKE]
});

const buildTestPostWhere = () => ({
  clause: '`content` LIKE ?',
  params: [TEST_POST_CONTENT_LIKE]
});

const buildPostAssociationWhere = (column, postWhere = buildTestPostWhere()) => ({
  clause: '`' + column + '` IN (SELECT `id` FROM `xn_post` WHERE ' + postWhere.clause + ')',
  params: postWhere.params
});

const buildExternalImageWhere = (column) => {
  const likes = EXTERNAL_IMAGE_HOSTS.map((host) => '%' + host + '%');
  return {
    clause: '(' + likes.map(() => '`' + column + '` LIKE ?').join(' OR ') + ')',
    params: likes
  };
};

const buildTestBannerWhere = () => {
  const likes = [TEST_BANNER_IMAGE_LIKE].concat(EXTERNAL_IMAGE_HOSTS.map((host) => '%' + host + '%'));
  return {
    clause: '(' + likes.map(() => '`image` LIKE ?').join(' OR ') + ')',
    params: likes
  };
};

const sqlString = (value) => "'" + String(value === null || value === undefined ? '' : value).replace(/'/g, "''") + "'";

// 把参数内联成可直接执行的 SQL（值都是脚本内常量，不来自用户输入）
const inlineWhere = (where) => {
  let sql = where.clause;
  for (const param of where.params) {
    const literal = typeof param === 'number' ? String(param) : sqlString(param);
    sql = sql.replace('?', literal);
  }
  return sql;
};

// 单条 URL 的分类：picsum / seed.local / null
const classifyExternalImageUrl = (url) => {
  const value = String(url === null || url === undefined ? '' : url).toLowerCase();
  if (!value) return null;
  if (value.includes('picsum.photos')) return 'picsum';
  if (value.includes('seed.local')) return 'seed.local';
  return null;
};

const isExternalTestImageUrl = (url) => classifyExternalImageUrl(url) !== null;

// 把动态 images/videos 这类「JSON 数组字符串 / 逗号分隔字符串」拆成 URL 列表
const parseImageRefs = (value) => {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  const text = String(value).trim();
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
  } catch (e) {
    // 非 JSON：按逗号/换行分隔兜底
  }
  return text.split(/[,\n]/).map((item) => item.trim()).filter(Boolean);
};

// ===== 纯函数：参数闸门 =====
const parseArgs = (argv = []) => {
  const args = { apply: false, confirm: null, json: false, help: false, unknown: [] };
  for (const item of argv) {
    if (item === '--apply') args.apply = true;
    else if (item === '--json') args.json = true;
    else if (item === '--help' || item === '-h') args.help = true;
    else if (item.startsWith('--confirm=')) args.confirm = item.slice('--confirm='.length);
    else args.unknown.push(item);
  }
  return args;
};

// 返回 false 表示 dry-run；返回 true 表示允许真实删除；参数不全时直接抛错（调用方在连库前执行）
const assertApplyAllowed = (args) => {
  if (!args.apply) return false;
  if (args.confirm !== APPLY_CONFIRM_TOKEN) {
    throw new Error(
      '拒绝执行：--apply 必须同时提供 --confirm=' + APPLY_CONFIRM_TOKEN +
      '（当前 ' + (args.confirm === null ? '未提供 --confirm' : '--confirm=' + args.confirm) + '）'
    );
  }
  return true;
};

const buildDbConfig = (env = {}) => {
  const missing = ['DB_HOST', 'DB_USER', 'DB_PASSWORD'].filter((key) => !env[key]);
  if (missing.length) {
    throw new Error('数据库配置缺失: ' + missing.join(', ') + '（请在 backend/.env 中配置后重试）');
  }
  return {
    host: env.DB_HOST,
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME || 'eudazi',
    charset: 'utf8mb4'
  };
};

// ===== 纯函数：统计口径与输出 =====
const toCount = (value) => {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? count : 0;
};

const summarizeCounts = (rawCounts = {}) => {
  const imageRefs = (Array.isArray(rawCounts.imageRefs) ? rawCounts.imageRefs : []).map((item) => ({
    table: item.table,
    column: item.column,
    label: item.label || '',
    count: toCount(item.count)
  }));
  const externalImageRefTotal = imageRefs.reduce((sum, item) => sum + item.count, 0);
  return {
    testUsers: toCount(rawCounts.testUsers),
    testUsersNicknameOnly: toCount(rawCounts.testUsersNicknameOnly),
    testPosts: toCount(rawCounts.testPosts),
    testPostLikes: toCount(rawCounts.testPostLikes),
    testPostComments: toCount(rawCounts.testPostComments),
    testPostUnlocks: toCount(rawCounts.testPostUnlocks),
    testBanners: toCount(rawCounts.testBanners),
    externalImageRefTotal,
    externalImageRefs: imageRefs.filter((item) => item.count > 0),
    errors: Array.isArray(rawCounts.errors) ? rawCounts.errors.slice() : []
  };
};

const SUMMARY_ROWS = [
  ['testUsers', '测试用户（nickname LIKE 测试用户% AND dec=Sealos 测试数据）'],
  ['testUsersNicknameOnly', '仅昵称命中测试用户%、但无 Sealos 标记（只统计，不删除）'],
  ['testPosts', '测试动态（content LIKE Sealos 测试动态%）'],
  ['testPostLikes', '测试动态关联点赞'],
  ['testPostComments', '测试动态关联评论'],
  ['testPostUnlocks', '测试动态关联解锁'],
  ['testBanners', '测试 Banner（bannerN.png / 外链图）'],
  ['externalImageRefTotal', '图片外链引用总数（picsum.photos / seed.local）']
];

const formatMarkdown = (summary) => {
  const lines = [];
  lines.push('# 测试数据清理 dry-run 摘要');
  lines.push('');
  lines.push('- 模式：dry-run（只统计，不执行 DELETE/UPDATE）');
  lines.push('- 数据库：由 backend/.env 的 DB_HOST/DB_NAME 决定');
  lines.push('');
  lines.push('## 1. 计数');
  lines.push('');
  lines.push('| 项目 | 数量 |');
  lines.push('| --- | ---: |');
  for (const [key, label] of SUMMARY_ROWS) {
    lines.push('| ' + label + ' | ' + (summary[key] || 0) + ' |');
  }
  lines.push('');
  lines.push('## 2. 图片外链引用明细');
  lines.push('');
  if (summary.externalImageRefs.length === 0) {
    lines.push('未发现 picsum.photos / seed.local 引用。');
  } else {
    lines.push('| 表.列 | 说明 | 行数 |');
    lines.push('| --- | --- | ---: |');
    for (const item of summary.externalImageRefs) {
      lines.push('| ' + item.table + '.' + item.column + ' | ' + item.label + ' | ' + item.count + ' |');
    }
  }
  if (summary.errors.length > 0) {
    lines.push('');
    lines.push('## 3. 统计异常（需人工确认表结构）');
    lines.push('');
    for (const error of summary.errors) lines.push('- ' + error);
  }
  return lines.join('\n');
};

const buildSuggestedSql = (summary = {}) => {
  const userCondition = inlineWhere(buildTestUserWhere());
  const postCondition = inlineWhere(buildTestPostWhere());
  const bannerCondition = inlineWhere(buildTestBannerWhere());
  return [
    '-- 0) 先备份（删除不可回滚）：cd backend && node scripts/backup.js --mode=local --target=mysql',
    '-- 1) 复核计数（dry-run 统计：测试用户 ' + (summary.testUsers || 0) + ' / 测试动态 ' + (summary.testPosts || 0) + ' / 外链引用 ' + (summary.externalImageRefTotal || 0) + '）',
    'SELECT COUNT(*) AS test_users FROM `xn_user` WHERE ' + userCondition + ';',
    'SELECT COUNT(*) AS test_posts FROM `xn_post` WHERE ' + postCondition + ';',
    'SELECT COUNT(*) AS test_post_likes FROM `xn_post_like` WHERE ' + inlineWhere(buildPostAssociationWhere('post_id')) + ';',
    'SELECT COUNT(*) AS test_post_comments FROM `xn_post_comment` WHERE ' + inlineWhere(buildPostAssociationWhere('post_id')) + ';',
    'SELECT COUNT(*) AS test_banners FROM `xn_banner` WHERE ' + bannerCondition + ';',
    '-- 2) 先删关联，再删动态，最后删用户；--apply 会在同一事务内自动按 USER_OWNED_TABLES 清理测试用户其它关联数据',
    'DELETE FROM `xn_post_like` WHERE ' + inlineWhere(buildPostAssociationWhere('post_id')) + ';',
    'DELETE FROM `xn_post_comment` WHERE ' + inlineWhere(buildPostAssociationWhere('post_id')) + ';',
    'DELETE FROM `xn_post_unlock` WHERE ' + inlineWhere(buildPostAssociationWhere('post_id')) + ';',
    'DELETE FROM `xn_post` WHERE ' + postCondition + ';',
    'DELETE FROM `xn_user` WHERE ' + userCondition + ';',
    '-- 3) Banner 仅报告，不自动删除：确认后替换为正式图或下架',
    'SELECT `id`, `title`, `image` FROM `xn_banner` WHERE ' + bannerCondition + ';',
    "UPDATE `xn_banner` SET `image` = '<正式图 URL>' WHERE " + bannerCondition + ';',
    '-- 4) picsum.photos / seed.local 外链：按 dry-run 明细逐列替换为自有存储地址，不要 DELETE 真实用户上传行'
  ];
};

// ===== 数据库读取（仅在 main 内调用，模块被 require 时不连库） =====
const countWhere = async (conn, table, where) => {
  const [rows] = await conn.query('SELECT COUNT(*) AS total FROM `' + table + '` WHERE ' + where.clause, where.params);
  return toCount(rows && rows[0] ? rows[0].total : 0);
};

const collectCounts = async (conn) => {
  const counts = {
    testUsers: 0,
    testUsersNicknameOnly: 0,
    testPosts: 0,
    testPostLikes: 0,
    testPostComments: 0,
    testPostUnlocks: 0,
    testBanners: 0,
    imageRefs: [],
    errors: []
  };
  counts.testUsers = await countWhere(conn, 'xn_user', buildTestUserWhere());
  counts.testUsersNicknameOnly = await countWhere(conn, 'xn_user', buildTestUserNicknameOnlyWhere());
  counts.testPosts = await countWhere(conn, 'xn_post', buildTestPostWhere());
  counts.testPostLikes = await countWhere(conn, 'xn_post_like', buildPostAssociationWhere('post_id'));
  counts.testPostComments = await countWhere(conn, 'xn_post_comment', buildPostAssociationWhere('post_id'));
  counts.testPostUnlocks = await countWhere(conn, 'xn_post_unlock', buildPostAssociationWhere('post_id'));
  counts.testBanners = await countWhere(conn, 'xn_banner', buildTestBannerWhere());

  for (const target of IMAGE_REF_COLUMNS) {
    try {
      const count = await countWhere(conn, target.table, buildExternalImageWhere(target.column));
      counts.imageRefs.push({ table: target.table, column: target.column, label: target.label, count });
    } catch (error) {
      // 旧库可能缺表/缺列：记录后继续，不因可选列阻断主流程
      counts.errors.push(target.table + '.' + target.column + ': ' + (error && error.message ? error.message : error));
    }
  }
  return counts;
};

const selectIds = async (conn, table, where) => {
  const [rows] = await conn.query('SELECT `id` FROM `' + table + '` WHERE ' + where.clause, where.params);
  return rows.map((row) => Number(row.id)).filter((id) => Number.isInteger(id) && id > 0);
};

// --apply：事务内先重新统计并打印，再删除测试动态/测试用户及其关联数据
const applyDeletion = async (conn) => {
  const deleted = { users: 0, posts: 0, postLikes: 0, postComments: 0, postUnlocks: 0, userOwned: {}, errors: [] };
  await conn.beginTransaction();
  try {
    const summary = summarizeCounts(await collectCounts(conn));
    console.log('[cleanup-test-data] 删除前复核计数（即将执行 DELETE）：');
    console.log(formatMarkdown(summary));
    if (summary.testUsers === 0 && summary.testPosts === 0) {
      await conn.rollback();
      console.log('[cleanup-test-data] 未发现待删除的测试用户/测试动态，已回滚，未做任何修改。');
      return deleted;
    }

    const userIds = await selectIds(conn, 'xn_user', buildTestUserWhere());
    const postIds = await selectIds(conn, 'xn_post', buildTestPostWhere());

    // 1) 测试动态的点赞/评论/解锁
    for (const item of [
      ['xn_post_like', 'postLikes'],
      ['xn_post_comment', 'postComments'],
      ['xn_post_unlock', 'postUnlocks']
    ]) {
      if (postIds.length === 0) break;
      const [res] = await conn.query('DELETE FROM `' + item[0] + '` WHERE `post_id` IN (?)', [postIds]);
      deleted[item[1]] = Number(res.affectedRows || 0);
    }

    // 2) 测试用户名下的其它关联数据（与 seed 脚本同口径；缺表/缺列只记录不中断）
    if (userIds.length > 0) {
      for (const [table, columns] of Object.entries(USER_OWNED_TABLES)) {
        for (const column of columns) {
          try {
            const [res] = await conn.query('DELETE FROM `' + table + '` WHERE `' + column + '` IN (?)', [userIds]);
            const affected = Number(res.affectedRows || 0);
            if (affected > 0) deleted.userOwned[table + '.' + column] = affected;
          } catch (error) {
            deleted.errors.push(table + '.' + column + ': ' + (error && error.message ? error.message : error));
          }
        }
      }
    }

    // 3) 测试动态（按内容命中，或作者是测试用户）
    if (postIds.length > 0 || userIds.length > 0) {
      const [res] = await conn.query(
        'DELETE FROM `xn_post` WHERE `id` IN (?) OR `user_id` IN (?)',
        [postIds.length > 0 ? postIds : [-1], userIds.length > 0 ? userIds : [-1]]
      );
      deleted.posts = Number(res.affectedRows || 0);
    }

    // 4) 测试用户
    if (userIds.length > 0) {
      const [res] = await conn.query('DELETE FROM `xn_user` WHERE `id` IN (?)', [userIds]);
      deleted.users = Number(res.affectedRows || 0);
    }

    await conn.commit();
    return deleted;
  } catch (error) {
    await conn.rollback();
    throw error;
  }
};

const USAGE = '用法：node scripts/cleanup-test-data.js [--json] [--apply --confirm=DELETE-TEST-DATA]';

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(USAGE);
    console.log('默认 dry-run：统计测试用户/动态/外链图片/测试 Banner 并输出建议 SQL；--apply 需同时 --confirm=' + APPLY_CONFIRM_TOKEN);
    return;
  }
  if (args.unknown.length > 0) {
    throw new Error('未知参数: ' + args.unknown.join(' ') + '；' + USAGE);
  }
  // 参数闸门必须在连接数据库之前执行：只有 --apply 而没有确认串时，绝不连库、绝不删除
  const apply = assertApplyAllowed(args);

  require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
  const dbConfig = buildDbConfig(process.env);
  console.log('[cleanup-test-data] 目标数据库: ' + dbConfig.host + ':' + dbConfig.port + '/' + dbConfig.database + ' (' + dbConfig.user + ')');
  console.log('[cleanup-test-data] 模式: ' + (apply ? 'APPLY（真实删除，务必已备份）' : 'dry-run（只统计，不写库）'));

  const mysql = require('mysql2/promise');
  const conn = await mysql.createConnection(dbConfig);
  try {
    if (!apply) {
      const summary = summarizeCounts(await collectCounts(conn));
      if (args.json) {
        console.log(JSON.stringify(summary, null, 2));
      } else {
        console.log(formatMarkdown(summary));
        console.log('');
        console.log('## 建议 SQL（人工复核后执行）');
        console.log('');
        console.log(buildSuggestedSql(summary).join('\n'));
      }
      console.log('');
      console.log('[cleanup-test-data] dry-run 结束：未执行任何 DELETE/UPDATE。');
      return;
    }

    const deleted = await applyDeletion(conn);
    console.log('[cleanup-test-data] 删除完成：' + JSON.stringify(deleted, null, 2));
    if (deleted.errors.length > 0) {
      console.error('[cleanup-test-data] 部分关联表删除失败（已提交其余删除，请人工核对）：' + deleted.errors.join(' | '));
      process.exitCode = 1;
    }
  } finally {
    await conn.end();
  }
};

if (require.main === module) {
  main().catch((error) => {
    console.error('[cleanup-test-data] 执行失败:', error && error.message ? error.message : error);
    process.exitCode = 1;
  });
}

module.exports = {
  TEST_USER_NICKNAME_LIKE,
  TEST_USER_DEC,
  TEST_POST_CONTENT_LIKE,
  TEST_BANNER_IMAGE_LIKE,
  EXTERNAL_IMAGE_HOSTS,
  APPLY_CONFIRM_TOKEN,
  IMAGE_REF_COLUMNS,
  USER_OWNED_TABLES,
  buildTestUserWhere,
  buildTestUserNicknameOnlyWhere,
  buildTestPostWhere,
  buildPostAssociationWhere,
  buildExternalImageWhere,
  buildTestBannerWhere,
  sqlString,
  inlineWhere,
  classifyExternalImageUrl,
  isExternalTestImageUrl,
  parseImageRefs,
  parseArgs,
  assertApplyAllowed,
  buildDbConfig,
  summarizeCounts,
  formatMarkdown,
  buildSuggestedSql
};
