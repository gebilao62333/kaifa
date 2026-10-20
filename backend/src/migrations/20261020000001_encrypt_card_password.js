/**
 * 卡密密码静态加密（《未完成事项清单》B-10）
 *
 * 背景：xn_card.card_password 明文落库，管理端列表直接回显；数据库/备份一旦泄露，
 * 卡密即等价于现金。改造为与实名 PII 同一套 utils/pii.js（AES-256-GCM）：
 *   写入前加密、管理端展示与核销时解密；存量明文行由 decryptField 透明兼容。
 *
 * 本迁移做两件事（顺序不可反）：
 *   1. 列宽 VARCHAR(50) → VARCHAR(255)：密文形态为 salt+iv+tag+密文 的十六进制，远超原列宽，
 *      不放宽会因「数据过长」写入失败（与 M-8 的宽列先行口径一致）；
 *   2. 把存量明文 card_password 就地加密（已是密文的行跳过），幂等可重复执行。
 *
 * 与 M-8 的手动宽列迁移不同：xn_card 是小表，ALTER 代价可控，故接入启动自动迁移（第 13 步）。
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const sequelize = require('../config/mysql');
const pii = require('../utils/pii');

const TABLE = 'xn_card';
const COLUMN = 'card_password';
const TARGET_LEN = 255;
const BATCH = 200;

const columnInfo = async () => {
  const [rows] = await sequelize.query(
    "SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH AS len FROM INFORMATION_SCHEMA.COLUMNS " +
    "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
    { replacements: [TABLE, COLUMN] }
  );
  return rows[0] || null;
};

const widenColumn = async () => {
  const info = await columnInfo();
  if (!info) {
    console.log(TABLE + '.' + COLUMN + ' 不存在，跳过宽列');
    return false;
  }
  if (Number(info.len) >= TARGET_LEN) {
    console.log(TABLE + '.' + COLUMN + ' 已是 VARCHAR(' + info.len + ')，跳过');
    return true;
  }
  await sequelize.query(
    'ALTER TABLE `' + TABLE + '` MODIFY `' + COLUMN + '` VARCHAR(' + TARGET_LEN + ") NOT NULL COMMENT '卡密密码（静态加密）'"
  );
  console.log(TABLE + '.' + COLUMN + ' → VARCHAR(' + TARGET_LEN + ')');
  return true;
};

const encryptExisting = async () => {
  let lastId = 0;
  let encrypted = 0;
  let skipped = 0;

  for (;;) {
    const [rows] = await sequelize.query(
      "SELECT id, `" + COLUMN + "` AS pwd FROM `" + TABLE + "` WHERE id > ? ORDER BY id ASC LIMIT " + BATCH,
      { replacements: [lastId] }
    );
    if (!rows || rows.length === 0) break;

    for (const row of rows) {
      lastId = Number(row.id);
      const value = row.pwd;
      if (!value) {
        skipped += 1;
        continue;
      }
      // 已是密文（或当前未配置 PII 密钥导致加密为空操作）都跳过，保证幂等
      if (pii.looksEncrypted(value)) {
        skipped += 1;
        continue;
      }
      const cipher = pii.encryptField(String(value));
      if (!cipher || cipher === value) {
        // 非生产未配置 PII_ENCRYPTION_KEY 时 encryptField 原样返回；不做无意义的写
        skipped += 1;
        continue;
      }
      await sequelize.query(
        "UPDATE `" + TABLE + "` SET `" + COLUMN + "` = ? WHERE id = ?",
        { replacements: [cipher, row.id] }
      );
      encrypted += 1;
    }
  }

  console.log('存量卡密密码加密完成：加密 ' + encrypted + ' 行，跳过 ' + skipped + ' 行');
};

const up = async () => {
  console.log('开始执行迁移：卡密密码静态加密');
  const ok = await widenColumn();
  if (!ok) return;
  if (!pii.isConfigured()) {
    console.warn('[B-10] PII_ENCRYPTION_KEY 未配置：仅完成宽列，存量明文保持原样（生产环境会在启动时因缺密钥被拒绝）');
  }
  await encryptExisting();
  console.log('卡密密码迁移完成');
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
