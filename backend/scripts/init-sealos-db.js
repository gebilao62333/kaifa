#!/usr/bin/env node
/**
 * Sealos / 空库初始化：建库 + 导入 schema/data + 跑迁移 + 自检关键列
 *
 *   cd backend && node scripts/init-sealos-db.js
 *
 * 幂等：
 *   - schema 全是 CREATE TABLE IF NOT EXISTS，可重复执行
 *   - data 仅在 xn_user 为空时导入（避免重复主键）
 *   - 迁移本身幂等
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')

const DB = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'eudazi',
  multipleStatements: true,
  charset: 'utf8mb4'
}

const runFile = async (conn, file) => {
  const sql = fs.readFileSync(path.resolve(__dirname, '..', 'sql', file), 'utf8')
  await conn.query(sql)
  console.log('[init-db] imported', file)
}

;(async () => {
  if (!DB.host || !DB.user || !DB.password) {
    console.error('[init-db] 缺少 DB_HOST/DB_USER/DB_PASSWORD（backend/.env）')
    process.exit(1)
  }

  // 1. 建库（如果不存在）
  const rootConn = await mysql.createConnection(Object.assign({}, DB, { database: undefined }))
  await rootConn.query('CREATE DATABASE IF NOT EXISTS `' + DB.database + '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci')
  await rootConn.end()
  console.log('[init-db] database ready:', DB.database)

  // 2. 表结构 + 初始数据
  const conn = await mysql.createConnection(DB)
  await runFile(conn, '01_init_schema.sql')

  const [[userCount]] = await conn.query('SELECT COUNT(*) AS c FROM xn_user')
  if (Number(userCount.c) === 0) {
    try {
      await runFile(conn, '02_init_data.sql')
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') console.warn('[init-db] data 已存在，跳过重复导入')
      else throw e
    }
  } else {
    console.log('[init-db] xn_user 已有数据，跳过 02_init_data.sql')
  }

  // 3. 迁移（runMigrations 只接线 8 个；两个必须手工补）
  const { runMigrations } = require('../src/migrations/runMigrations')
  await runMigrations()
  for (const f of ['20261003000002_widen_user_id_and_ip', '20261004000002_widen_pii_columns']) {
    const mod = require('../src/migrations/' + f)
    if (mod && typeof mod.up === 'function') { await mod.up(); console.log('[init-db] manual migration', f) }
  }

  // 4. 关键结构自检
  const [[tables]] = await conn.query("SELECT COUNT(*) AS c FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?", [DB.database])
  const checks = [
    ['xn_card.card_key', "SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='xn_card' AND COLUMN_NAME='card_key'"],
    ['xn_chat_log.expire_at', "SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='xn_chat_log' AND COLUMN_NAME='expire_at'"],
    ['xn_chat_log.read_at', "SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='xn_chat_log' AND COLUMN_NAME='read_at'"],
    ['xn_chat_log.destroy_at', "SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='xn_chat_log' AND COLUMN_NAME='destroy_at'"]
  ]
  let fail = 0
  for (const [name, sql] of checks) {
    const [[r]] = await conn.query(sql, [DB.database])
    const ok = Number(r.c) > 0
    if (!ok) fail++
    console.log('[init-db]', ok ? 'OK  ' : 'FAIL', name)
  }
  console.log('[init-db] 表数量:', tables.c)
  await conn.end()

  if (fail) { console.error('[init-db] 关键列缺失:', fail); process.exit(1) }
  console.log('[init-db] DONE')
})().catch((e) => { console.error('[init-db] ERROR:', e.message); process.exit(1) })
