/**
 * 存量实名信息加密回填（《未完成事项清单》B-8）
 *
 * 背景：M-8 起新写入的实名信息（真实姓名/身份证号/正反面照）已用 utils/pii.js 加密，
 * 但改造前的存量行仍是明文，数据库/备份泄漏时等于直接暴露 PII。本迁移把存量明文幂等加密：
 *   - 已是密文的行（pii.looksEncrypted）跳过，可重复执行；
 *   - 未配置 PII_ENCRYPTION_KEY 时整体跳过（非生产 local 常见；生产缺密钥会在启动闸门被拒绝）；
 *   - 逐字段校验列宽：宽列迁移 20261004000002 受 AUTO_MIGRATE_WIDEN_COLUMNS 控制（生产默认跳过），
 *     若生产尚未跑该迁移，
 *     直接写密文会因「数据过长」失败。这里发现列宽不足就跳过该字段并告警，不阻塞启动。
 *
 * 依赖：先执行 20261004000002_widen_pii_columns.js（real_name/id_card → 255，正反面照 → 512），
 * 再配置 PII_ENCRYPTION_KEY；两者顺序反了会截断密文（见部署文档 U-5）。
 * 宽列迁移已接线，非生产默认执行；生产默认跳过，需显式 AUTO_MIGRATE_WIDEN_COLUMNS=true 或手工执行。
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const sequelize = require('../config/mysql');
const pii = require('../utils/pii');

const TABLE = 'xn_user';
const FIELDS = [
  { column: 'real_name', minLen: 255 },
  { column: 'id_card', minLen: 255 },
  { column: 'real_name_front', minLen: 512 },
  { column: 'real_name_back', minLen: 512 }
];
const BATCH = 200;

const columnLengths = async () => {
  const [rows] = await sequelize.query(
    'SELECT COLUMN_NAME AS col, CHARACTER_MAXIMUM_LENGTH AS len FROM INFORMATION_SCHEMA.COLUMNS ' +
    'WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
    { replacements: [TABLE] }
  );
  const map = {};
  for (const row of rows || []) map[row.col] = Number(row.len) || 0;
  return map;
};

const up = async () => {
  console.log('开始执行迁移：存量实名信息加密回填');
  if (!pii.isConfigured()) {
    console.warn('[B-8] PII_ENCRYPTION_KEY 未配置：跳过存量实名回填（生产环境不会走到这里）');
    return;
  }

  const lens = await columnLengths();
  const usable = FIELDS.filter((f) => {
    if (!lens[f.column]) {
      console.warn('[B-8] ' + TABLE + '.' + f.column + ' 不存在，跳过');
      return false;
    }
    if (lens[f.column] < f.minLen) {
      console.warn('[B-8] ' + TABLE + '.' + f.column + ' 列宽 ' + lens[f.column] + ' < ' + f.minLen +
        '，请先执行 20261004000002_widen_pii_columns.js（或设 AUTO_MIGRATE_WIDEN_COLUMNS=true 后重启），本字段跳过');
      return false;
    }
    return true;
  });

  if (usable.length === 0) {
    console.warn('[B-8] 没有可安全回填的实名字段（宽列迁移未执行？），跳过');
    return;
  }

  const columns = usable.map((f) => f.column);
  const selects = ['id'].concat(columns).join(', ');
  let lastId = 0;
  let encrypted = 0;
  let skipped = 0;

  for (;;) {
    const [rows] = await sequelize.query(
      'SELECT ' + selects + ' FROM `' + TABLE + '` WHERE id > ? ORDER BY id ASC LIMIT ' + BATCH,
      { replacements: [lastId] }
    );
    if (!rows || rows.length === 0) break;

    for (const row of rows) {
      lastId = Number(row.id);
      const patch = {};
      for (const column of columns) {
        const value = row[column];
        if (value === null || value === undefined || value === '') continue;
        // 存量明文才加密；已密文行跳过，保证幂等
        if (pii.looksEncrypted(value)) continue;
        const cipher = pii.encryptField(String(value));
        if (!cipher || cipher === value) continue;
        patch[column] = cipher;
      }
      if (Object.keys(patch).length === 0) {
        skipped += 1;
        continue;
      }
      const sets = Object.keys(patch).map((c) => '`' + c + '` = ?').join(', ');
      await sequelize.query(
        'UPDATE `' + TABLE + '` SET ' + sets + ' WHERE id = ?',
        { replacements: Object.keys(patch).map((c) => patch[c]).concat(row.id) }
      );
      encrypted += 1;
    }
  }

  console.log('存量实名加密回填完成：加密 ' + encrypted + ' 行，跳过 ' + skipped + ' 行（字段：' + columns.join('/') + '）');
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
