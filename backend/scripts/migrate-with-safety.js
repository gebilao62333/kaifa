#!/usr/bin/env node
/**
 * 真迁移安全执行器（2026-10-20）
 *
 * 目的：在执行 runMigrations 之前做「前置条件检查 + 备份 + 迁移后核对」，避免在
 * 生产/云端库上直接跑迁移时因为缺 PII 密钥或宽列迁移未执行（生产默认跳过）而写坏数据。
 *
 * 用法（在 backend/ 目录）：
 *   node scripts/migrate-with-safety.js --dry-run     # 只检查前置条件并打印目标库，不写库
 *   node scripts/migrate-with-safety.js               # 备份 → 执行迁移 → 核对
 *   node scripts/migrate-with-safety.js --skip-backup # 仅当已有外部备份时使用
 *
 * 退出码：0 成功；1 前置条件不满足/迁移失败/核对异常；2 参数或连接问题。
 *
 * 前置条件（缺一不可）：
 *   1) backend/.env 内 DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME 指向目标库；
 *   2) PII_ENCRYPTION_KEY 已配置（否则实名/卡密/手机号迁移会把数据以明文/dev 哈希写入）；
 *   3) 宽列迁移已执行（20261004000002，real_name/id_card≥255、
 *      正反面照≥512）；生产默认跳过宽列迁移，需要时先设 AUTO_MIGRATE_WIDEN_COLUMNS=true
 *      或在维护窗口手工执行，否则迁移会逐字段跳过或写入失败。
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const config = require('../src/config');
const mysql = require('mysql2/promise');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const SKIP_BACKUP = args.includes('--skip-backup');

const BACKUP_DIR = path.resolve(__dirname, '../backups');
const BACKUP_TABLES = ['xn_user', 'xn_card'];
const WIDEN_REQUIREMENTS = [
  { table: 'xn_user', column: 'real_name', min: 255 },
  { table: 'xn_user', column: 'id_card', min: 255 },
  { table: 'xn_user', column: 'real_name_front', min: 512 },
  { table: 'xn_user', column: 'real_name_back', min: 512 }
];

const fail = (message) => {
  console.error('\n[迁移中止] ' + message);
  process.exit(1);
};

const maskHost = (host) => String(host || '').replace(/^(.{4}).+/, '$1***');

const connect = async () => {
  try {
    return await mysql.createConnection({
      host: config.db.mysql.host,
      port: Number(config.db.mysql.port) || 3306,
      user: config.db.mysql.user,
      password: config.db.mysql.password,
      database: config.db.mysql.name,
      connectTimeout: 15000
    });
  } catch (error) {
    const codes = [];
    if (error.code) codes.push(error.code);
    if (Array.isArray(error.errors)) error.errors.forEach((e) => { if (e.code) codes.push(e.code); });
    console.error('\n[连接失败] ' + (error.message || '无错误信息') + (codes.length ? '（' + [...new Set(codes)].join('/') + '）' : ''));
    console.error('目标: ' + maskHost(config.db.mysql.host) + ':' + (config.db.mysql.port || 3306) + '/' + config.db.mysql.name);
    console.error('排查：①库实例是否在运行（Sealos 数据库被暂停时 TCP 不可达）；②是否仅允许集群内网访问；③本机 IP 是否在白名单。');
    process.exit(2);
  }
};

const columnLength = async (conn, table, column) => {
  const [rows] = await conn.query(
    'SELECT CHARACTER_MAXIMUM_LENGTH AS len FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    [table, column]
  );
  return rows[0] ? Number(rows[0].len) : 0;
};

const preflight = async (conn) => {
  console.log('==== 前置检查 ====');
  console.log('目标库：' + maskHost(config.db.mysql.host) + ':' + (config.db.mysql.port || 3306) + '/' + config.db.mysql.name);

  const piiKey = (config.pii && config.pii.encryptionKey) || '';
  if (!piiKey) {
    fail('PII_ENCRYPTION_KEY 未配置。迁移 13/14/15 会把卡密密码、实名信息、手机号明文写入，并把手机号盲索引用 dev 回退哈希（之后配真密钥会导致按手机号登录全部失效）。\n'
      + '       请先生成并写入 backend/.env：openssl rand -hex 32\n'
      + '       然后执行宽列迁移（生产默认跳过）：node src/migrations/20261004000002_widen_pii_columns.js');
  }
  console.log('PII_ENCRYPTION_KEY: 已配置（长度 ' + piiKey.length + '）');

  for (const req of WIDEN_REQUIREMENTS) {
    const len = await columnLength(conn, req.table, req.column);
    if (len < req.min) {
      fail(req.table + '.' + req.column + ' 当前长度 ' + len + ' < ' + req.min + '。\n'
        + '       请先执行宽列迁移（生产默认跳过）：node src/migrations/20261004000002_widen_pii_columns.js\n'
        + '       （已接线但生产默认跳过：设 AUTO_MIGRATE_WIDEN_COLUMNS=true 或维护窗口手工执行，否则密文写入会被截断/跳过）');
    }
  }
  console.log('实名字段列宽：满足加密要求（≥255/≥512）');

  const [cards] = await conn.query("SELECT COUNT(*) AS c FROM xn_card");
  const [users] = await conn.query("SELECT COUNT(*) AS c FROM xn_user");
  console.log('现有数据：xn_user=' + users[0].c + ' 行，xn_card=' + cards[0].c + ' 行');
};

const sqlEscape = (value) => {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (Buffer.isBuffer(value)) return 'X\'' + value.toString('hex') + '\'';
  if (value instanceof Date) return '\'' + value.toISOString().slice(0, 19).replace('T', ' ') + '\'';
  return '\'' + String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '\'';
};

const backup = async (conn) => {
  if (SKIP_BACKUP) {
    console.log('\n[跳过备份] --skip-backup 已指定');
    return null;
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = path.join(BACKUP_DIR, 'migration-' + stamp);
  fs.mkdirSync(dir, { recursive: true });

  for (const table of BACKUP_TABLES) {
    const [ddlRows] = await conn.query('SHOW CREATE TABLE `' + table + '`');
    const ddl = ddlRows[0] && (ddlRows[0]['Create Table'] || ddlRows[0]['Create View']);
    const file = path.join(dir, table + '.sql');
    const stream = fs.createWriteStream(file, { encoding: 'utf8' });
    stream.write('-- 备份表 ' + table + ' @ ' + new Date().toISOString() + '\n');
    stream.write('-- 恢复方式：先 DROP 再执行本文件（文件内 DDL 为备份时刻结构）\n');
    stream.write('DROP TABLE IF EXISTS `' + table + '`;\n');
    stream.write(String(ddl || '') + ';\n\n');
    const [rows] = await conn.query('SELECT * FROM `' + table + '`');
    for (const row of rows) {
      const cols = Object.keys(row).map((c) => '`' + c + '`').join(', ');
      const vals = Object.keys(row).map((c) => sqlEscape(row[c])).join(', ');
      stream.write('INSERT INTO `' + table + '` (' + cols + ') VALUES (' + vals + ');\n');
    }
    stream.write('\n-- 备份结束（' + rows.length + ' 行）\n');
    await new Promise((resolve, reject) => { stream.end(resolve); stream.on('error', reject); });
    console.log('  已备份 ' + table + ' → ' + file + '（' + rows.length + ' 行）');
  }
  console.log('备份目录：' + dir);
  return dir;
};

const verify = async (conn) => {
  console.log('\n==== 迁移后核对 ====');
  const [notice] = await conn.query("SHOW TABLES LIKE 'xn_notice'");
  console.log('1) xn_notice 表：' + (notice.length ? '存在' : '缺失 ✗'));

  const [card] = await conn.query("SELECT SUM(CHAR_LENGTH(card_password) > 50) AS encrypted, SUM(CHAR_LENGTH(card_password) <= 50) AS plain_like FROM xn_card WHERE card_password IS NOT NULL AND card_password <> ''");
  console.log('2) 卡密密码：密文 ' + (card[0].encrypted || 0) + ' 行，疑似明文 ' + (card[0].plain_like || 0) + ' 行');

  const [mobile] = await conn.query("SELECT SUM(COALESCE(mobile,'') <> '') AS with_mobile, SUM(COALESCE(mobile_hash,'') <> '') AS with_hash, SUM(COALESCE(mobile,'') <> '' AND COALESCE(mobile_hash,'') = '') AS missing_hash FROM xn_user");
  console.log('3) 手机号：有号 ' + (mobile[0].with_mobile || 0) + '，有 hash ' + (mobile[0].with_hash || 0) + '，缺 hash ' + (mobile[0].missing_hash || 0) + (mobile[0].missing_hash > 0 ? ' ✗ 需人工修复后重跑' : ''));

  const [idx] = await conn.query("SHOW INDEX FROM xn_user WHERE Key_name IN ('uk_user_mobile_hash','idx_user_mobile_hash')");
  console.log('4) mobile_hash 索引：' + (idx.length ? idx.map((r) => r.Key_name + (r.Non_unique === 0 ? '(unique)' : '(non-unique)')).filter((v, i, a) => a.indexOf(v) === i).join(', ') : '缺失 ✗'));

  const [realName] = await conn.query("SELECT SUM(CHAR_LENGTH(real_name) BETWEEN 1 AND 191) AS short_name, SUM(CHAR_LENGTH(id_card) BETWEEN 1 AND 191) AS short_id FROM xn_user WHERE COALESCE(real_name,'') <> '' OR COALESCE(id_card,'') <> ''");
  console.log('5) 实名短列（疑似未加密）：real_name ' + (realName[0].short_name || 0) + '，id_card ' + (realName[0].short_id || 0));
};

const checkPiiKey = () => {
  const piiKey = (config.pii && config.pii.encryptionKey) || '';
  if (!piiKey) {
    fail('PII_ENCRYPTION_KEY 未配置。迁移 13/14/15 会把卡密密码、实名信息、手机号明文写入，并把手机号盲索引用 dev 回退哈希（之后配真密钥会导致按手机号登录全部失效）。\n'
      + '       请先生成并写入 backend/.env：openssl rand -hex 32\n'
      + '       然后执行宽列迁移（生产默认跳过）：node src/migrations/20261004000002_widen_pii_columns.js');
  }
  console.log('PII_ENCRYPTION_KEY: 已配置（长度 ' + piiKey.length + '）');
};

(async () => {
  // 先校验密钥（不依赖数据库连通性），避免在缺密钥时连上库后误跑加密迁移
  checkPiiKey();
  const conn = await connect();
  try {
    await preflight(conn);
    if (DRY_RUN) {
      console.log('\n[dry-run] 前置检查通过；未执行迁移。去掉 --dry-run 可正式执行。');
      return;
    }
    console.log('\n==== 备份 ====');
    await backup(conn);
    await conn.end();

    console.log('\n==== 执行自动迁移（第 1~15 步，幂等）====');
    const { runMigrations } = require('../src/migrations/runMigrations');
    await runMigrations();

    const conn2 = await connect();
    try {
      await verify(conn2);
    } finally {
      await conn2.end();
    }
    console.log('\n迁移完成。请继续按《Sealos部署核对清单.md》§五「启动后核对」做功能冒烟。');
  } finally {
    try { await conn.end(); } catch (e) { /* 已关闭 */ }
  }
})().catch((error) => {
  console.error('\n[迁移失败] ' + (error && error.stack ? error.stack : error));
  process.exit(1);
});
