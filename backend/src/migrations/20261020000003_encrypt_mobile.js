/**
 * 手机号静态加密 + 盲索引（《未完成事项清单》B-7）
 *
 * 背景：xn_user.mobile 是 unique 查号键（登录/注册查重/找回密码/管理端搜索都要按它查人），
 * 历史留存明文。直接加密会因随机 salt 无法等值查询，因此采用「密文 + 确定性盲索引」：
 *   - mobile       ：AES-256-GCM 密文（B-7 起新写入即加密，读取侧 pii.decryptField 兼容明文）；
 *   - mobile_hash  ：HMAC-SHA256(PII 密钥, 规范化手机号) 十六进制，唯一索引，所有按号查询走它。
 *
 * 迁移步骤（顺序不可反）：
 *   1. mobile 列宽 16/50 → 255（容纳密文）；
 *   2. 新增 mobile_hash VARCHAR(64) 与唯一索引 uk_user_mobile_hash
 *      （若存量有重复手机号导致唯一索引失败，退化为普通索引 idx_user_mobile_hash 并告警，
 *        由运营人工清理重复号后再补唯一约束）；
 *   3. 回填：逐行解密/读取明文 → 写回密文 + hash；已密文且 hash 一致的行跳过（幂等）。
 *
 * 依赖 PII_ENCRYPTION_KEY（与实名/卡密同一把钥匙）。生产缺钥会被启动闸门拒绝；
 * 非生产缺钥时 pii/mobile 工具走「明文 + dev 回退哈希」，迁移仍会把 hash 补齐（列宽已放宽）。
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const sequelize = require('../config/mysql');
const pii = require('../utils/pii');
const { hashMobile, normalize } = require('../utils/mobile');

const TABLE = 'xn_user';
const BATCH = 200;

const columnInfo = async (column) => {
  const [rows] = await sequelize.query(
    'SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH AS len FROM INFORMATION_SCHEMA.COLUMNS ' +
    'WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    { replacements: [TABLE, column] }
  );
  return rows[0] || null;
};

const indexExists = async (name) => {
  const [rows] = await sequelize.query(
    'SELECT 1 AS ok FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1',
    { replacements: [TABLE, name] }
  );
  return rows.length > 0;
};

const widenMobile = async () => {
  const info = await columnInfo('mobile');
  if (!info) {
    console.warn(TABLE + '.mobile 不存在，跳过宽列');
    return false;
  }
  if (Number(info.len) >= 255) {
    console.log(TABLE + '.mobile 已是 VARCHAR(' + info.len + ')，跳过');
    return true;
  }
  await sequelize.query('ALTER TABLE `' + TABLE + '` MODIFY `mobile` VARCHAR(255) NULL');
  console.log(TABLE + '.mobile → VARCHAR(255)');
  return true;
};

const ensureHashColumnAndIndex = async () => {
  const info = await columnInfo('mobile_hash');
  if (!info) {
    await sequelize.query(
      'ALTER TABLE `' + TABLE + '` ADD COLUMN `mobile_hash` VARCHAR(64) NULL COMMENT \'手机号盲索引 HMAC-SHA256\''
    );
    console.log('已新增字段 mobile_hash');
  } else {
    console.log('字段 mobile_hash 已存在，跳过');
  }

  if (await indexExists('uk_user_mobile_hash')) {
    console.log('唯一索引 uk_user_mobile_hash 已存在，跳过');
    return;
  }
  if (await indexExists('idx_user_mobile_hash')) {
    console.log('普通索引 idx_user_mobile_hash 已存在（存量重复号未清理），跳过');
    return;
  }

  try {
    await sequelize.query('ALTER TABLE `' + TABLE + '` ADD UNIQUE KEY uk_user_mobile_hash (mobile_hash)');
    console.log('已新增唯一索引 uk_user_mobile_hash');
  } catch (error) {
    console.warn('[B-7] 唯一索引创建失败（存量手机号可能重复）：' + error.message);
    await sequelize.query('ALTER TABLE `' + TABLE + '` ADD INDEX idx_user_mobile_hash (mobile_hash)');
    console.warn('[B-7] 已退化为普通索引 idx_user_mobile_hash，请人工清理重复手机号后补唯一约束');
  }
};

const backfill = async () => {
  let lastId = 0;
  let updated = 0;
  let skipped = 0;

  for (;;) {
    const [rows] = await sequelize.query(
      'SELECT id, mobile, mobile_hash FROM `' + TABLE + '` WHERE id > ? ORDER BY id ASC LIMIT ' + BATCH,
      { replacements: [lastId] }
    );
    if (!rows || rows.length === 0) break;

    for (const row of rows) {
      lastId = Number(row.id);
      const raw = row.mobile;
      if (raw === null || raw === undefined || raw === '') {
        // 空号：只保证 hash 为空，避免脏数据残留
        if (row.mobile_hash) {
          await sequelize.query('UPDATE `' + TABLE + '` SET mobile_hash = NULL WHERE id = ?', { replacements: [row.id] });
          updated += 1;
        } else {
          skipped += 1;
        }
        continue;
      }

      const plain = pii.looksEncrypted(raw) ? pii.decryptField(raw) : raw;
      if (!plain) {
        // 密文解不开（缺钥/换钥遗留）：不覆盖，等运维修复密钥后重跑
        console.warn('[B-7] id=' + row.id + ' 手机号无法解密，跳过（请检查 PII_ENCRYPTION_KEY）');
        skipped += 1;
        continue;
      }

      const normalized = normalize(plain);
      const hash = hashMobile(normalized);
      const encrypted = pii.looksEncrypted(raw) ? raw : pii.encryptField(normalized);
      if (row.mobile_hash === hash && encrypted === raw) {
        skipped += 1;
        continue;
      }
      try {
        await sequelize.query(
          'UPDATE `' + TABLE + '` SET mobile = ?, mobile_hash = ? WHERE id = ?',
          { replacements: [encrypted, hash, row.id] }
        );
        updated += 1;
      } catch (error) {
        console.error('[B-7] id=' + row.id + ' 回填失败: ' + error.message);
        skipped += 1;
      }
    }
  }

  console.log('手机号回填完成：更新 ' + updated + ' 行，跳过 ' + skipped + ' 行');
};

const up = async () => {
  console.log('开始执行迁移：手机号加密 + 盲索引');
  const ok = await widenMobile();
  if (!ok) return;
  await ensureHashColumnAndIndex();
  await backfill();
  console.log('手机号迁移完成');
};

module.exports = { up };

if (require.main === module) {
  up()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('迁移失败:', error);
      process.exit(1);
    });
}
