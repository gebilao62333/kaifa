#!/usr/bin/env node
/**
 * PII 密钥轮换脚本（《未完成事项清单》B-9）
 *
 * 使用步骤（缺一不可）：
 *   1) 新钥写入 PII_ENCRYPTION_KEY，旧钥写入 PII_ENCRYPTION_KEY_PREVIOUS，滚动重启服务
 *      （重启后 decryptField 会依次尝试当前/上一把钥，读写都不中断）；
 *   2) 执行本脚本（建议先 --dry-run 看清影响行数）：
 *        node scripts/rotate-pii-key.js --dry-run
 *        node scripts/rotate-pii-key.js
 *   3) 脚本输出 remaining=0 后，从环境变量中删除 PII_ENCRYPTION_KEY_PREVIOUS 并再次重启。
 *
 * 覆盖字段（所有走 utils/pii.js 的列）：
 *   - xn_user.real_name / id_card / real_name_front / real_name_back
 *   - xn_card.card_password
 *
 * 行为：只处理「上一把钥匙能解、当前钥不能解」的密文；明文与已用当前钥加密的行跳过。
 * 幂等：重复执行安全（第二次起 remaining 应为 0）。任一行更新失败会打印并继续，最后以退出码 1 提示需人工复核。
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const config = require('../src/config');
const pii = require('../src/utils/pii');
const sequelize = require('../src/config/mysql');

const BATCH = 200;
const TARGETS = [
  { table: 'xn_user', fields: ['real_name', 'id_card', 'real_name_front', 'real_name_back'] },
  { table: 'xn_card', fields: ['card_password'] }
];

const dryRun = process.argv.includes('--dry-run');

const main = async () => {
  if (!config.pii.encryptionKey) {
    console.error('PII_ENCRYPTION_KEY 未配置，拒绝执行');
    process.exit(1);
  }
  if (!config.pii.encryptionKeyPrevious) {
    console.error('PII_ENCRYPTION_KEY_PREVIOUS 未配置：没有可轮换的旧钥（若已轮换完成，本脚本无需再跑）');
    process.exit(1);
  }
  if (config.pii.encryptionKey === config.pii.encryptionKeyPrevious) {
    console.error('新旧密钥相同，无需轮换');
    process.exit(1);
  }

  console.log('PII 密钥轮换开始' + (dryRun ? '（dry-run：不写库）' : ''));
  let rotated = 0;
  let failed = 0;
  let remaining = 0;

  for (const target of TARGETS) {
    let lastId = 0;
    for (;;) {
      const selects = ['id'].concat(target.fields).join(', ');
      const [rows] = await sequelize.query(
        'SELECT ' + selects + ' FROM `' + target.table + '` WHERE id > ? ORDER BY id ASC LIMIT ' + BATCH,
        { replacements: [lastId] }
      );
      if (!rows || rows.length === 0) break;

      for (const row of rows) {
        lastId = Number(row.id);
        const patch = {};
        for (const field of target.fields) {
          const value = row[field];
          if (!value || !pii.looksEncrypted(value)) continue;
          const needs = pii.needsRotation(value);
          if (!needs) {
            // 已是当前钥密文（或无法判定）——不计入 remaining
            continue;
          }
          remaining += 1;
          if (dryRun) {
            console.log('[dry-run] 需重加密 ' + target.table + '.' + field + ' id=' + row.id);
            continue;
          }
          const plain = pii.decryptField(value);
          if (!plain) {
            failed += 1;
            console.error('解密失败，跳过 ' + target.table + '.' + field + ' id=' + row.id);
            continue;
          }
          patch[field] = pii.encryptField(plain);
        }
        if (dryRun || Object.keys(patch).length === 0) continue;
        const sets = Object.keys(patch).map((f) => '`' + f + '` = ?').join(', ');
        try {
          await sequelize.query(
            'UPDATE `' + target.table + '` SET ' + sets + ' WHERE id = ?',
            { replacements: Object.keys(patch).map((f) => patch[f]).concat(row.id) }
          );
          rotated += 1;
        } catch (error) {
          failed += 1;
          console.error('写库失败 ' + target.table + ' id=' + row.id + ': ' + error.message);
        }
      }
    }
  }

  console.log('轮换完成：重加密 ' + rotated + ' 行，失败 ' + failed + ' 行，需重加密字段数 ' + remaining);
  if (dryRun) {
    console.log('dry-run 结束：未写入任何数据；确认行数后去掉 --dry-run 再执行');
    return 0;
  }
  if (remaining > 0 && rotated === 0) {
    console.error('仍有需要轮换的字段但没有任何成功写入，请检查密钥配置');
    return 1;
  }
  if (failed > 0) return 1;
  console.log('现在可以安全移除 PII_ENCRYPTION_KEY_PREVIOUS 并重启服务');
  return 0;
};

main()
  .then((code) => process.exit(code || 0))
  .catch((error) => {
    console.error('轮换脚本失败:', error);
    process.exit(1);
  });
