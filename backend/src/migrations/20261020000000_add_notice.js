/**
 * 新增 xn_notice 平台公告表（《未完成事项清单》B-3）
 *
 * 背景：GET /api/notice/list 此前返回硬编码示例数据，公告没有落库、后台也没有 CRUD，
 * 管理员只能靠开屏弹窗做一次性推送。改为正常的内容表：
 *   - status=1 发布 / 0 下线；start_time/end_time=0 表示立即生效/长期有效；
 *   - pinned 置顶；type 为 notice/activity/system 三类展示样式；
 *   - C 端 list 只读「已发布且当前在有效期内」的公告；
 *   - 后台写接口在创建/发布后通过 socket 全服广播（B-4）。
 *
 * 幂等：CREATE TABLE IF NOT EXISTS，重复执行安全。
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const sequelize = require('../config/mysql');

const TABLE = 'xn_notice';

const up = async () => {
  console.log('开始执行迁移：创建 ' + TABLE);
  await sequelize.query(
    'CREATE TABLE IF NOT EXISTS ' + TABLE + ' (' +
    'id INT UNSIGNED NOT NULL AUTO_INCREMENT, ' +
    'title VARCHAR(120) NOT NULL COMMENT \'公告标题\', ' +
    'content TEXT NOT NULL COMMENT \'公告正文\', ' +
    'type VARCHAR(20) NOT NULL DEFAULT \'notice\' COMMENT \'notice/activity/system\', ' +
    'status TINYINT NOT NULL DEFAULT 1 COMMENT \'1发布 0下线\', ' +
    'pinned TINYINT NOT NULL DEFAULT 0 COMMENT \'1置顶\', ' +
    'start_time INT(10) NOT NULL DEFAULT 0 COMMENT \'生效时间戳，0=立即\', ' +
    'end_time INT(10) NOT NULL DEFAULT 0 COMMENT \'失效时间戳，0=长期\', ' +
    'creator_id INT(10) NOT NULL DEFAULT 0 COMMENT \'创建管理员ID\', ' +
    'create_time INT(10) NOT NULL DEFAULT 0, ' +
    'update_time INT(10) NOT NULL DEFAULT 0, ' +
    'PRIMARY KEY (id), ' +
    'KEY idx_notice_status_time (status, start_time, end_time), ' +
    'KEY idx_notice_pinned (pinned, create_time)' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT=\'平台公告（B-3）\''
  );
  console.log('已执行 CREATE TABLE IF NOT EXISTS ' + TABLE);
};

const down = async () => {
  await sequelize.query('DROP TABLE IF EXISTS ' + TABLE);
  console.log('已删除 ' + TABLE);
};

module.exports = { up, down };

if (require.main === module) {
  up()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('迁移失败:', error);
      process.exit(1);
    });
}
