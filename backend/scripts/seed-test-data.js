#!/usr/bin/env node
/**
 * 生成 100 个测试用户，并用这 100 个用户生成全部核心业务各 100 条记录。
 *
 *   cd backend && node scripts/seed-test-data.js
 *
 * 幂等：所有测试用户手机号以 1390001 开头、业务单号以 SEED 开头；
 * 每次执行会先删掉上一批 seed 数据（只删这些标记），再重新生成。
 * 不会删除/修改真实用户与真实业务数据。
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')
// B-7：手机号加密 + 盲索引（seed 用户同样走线上写法，保证能按手机号登录）
const { mobileFields } = require('../src/utils/mobile')

const COUNT = 100
const TEST_PASSWORD = 'Test@123456'
const MOBILE_PREFIX = '1390001'
const now = Math.floor(Date.now() / 1000)
const day = 86400

const DB = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'eudazi',
  multipleStatements: true,
  charset: 'utf8mb4'
}

const q = (conn, sql, params) => conn.query(sql, params)
const insert = async (conn, table, rows) => {
  if (!rows.length) return []
  const cols = Object.keys(rows[0])
  const values = rows.map((r) => cols.map((c) => (r[c] === undefined ? null : r[c])))
  const sql = 'INSERT INTO `' + table + '` (' + cols.map((c) => '`' + c + '`').join(',') + ') VALUES ?'
  const [res] = await conn.query(sql, [values])
  return Array.from({ length: rows.length }, (_, i) => res.insertId + i)
}

const DELETE_BY_USER = {
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
}

;(async () => {
  if (!DB.host || !DB.user || !DB.password) {
    console.error('缺少 DB_HOST/DB_USER/DB_PASSWORD（backend/.env）'); process.exit(1)
  }
  const conn = await mysql.createConnection(DB)
  try {
    await conn.beginTransaction()

    // ===== 1. 清理上一批 seed 数据 =====
    const [old] = await q(conn, 'SELECT id FROM xn_user WHERE username LIKE ?', ['seed_user_%'])
    const oldIds = old.map((r) => r.id)
    for (const [table, cols] of Object.entries(DELETE_BY_USER)) {
      for (const col of cols) {
        if (oldIds.length) await q(conn, 'DELETE FROM `' + table + '` WHERE `' + col + '` IN (?)', [oldIds])
      }
    }
    // 按单号标记兜底清理（覆盖没有用户外键的记录）
    for (const [table, col, prefix] of [
      ['xn_game_order', 'order_no', 'SEEDORD%'],
      ['xn_vip_order', 'order_no', 'SEEDVIP%'],
      ['xn_order_chong', 'order_no', 'SEEDRC%'],
      ['xn_call_record', 'call_no', 'SEEDCALL%'],
      ['xn_red_packet', 'packet_no', 'SEEDRP%'],
      ['xn_card', 'card_no', 'SEEDCARD%'],
      ['xn_media_asset', 'url', 'https://seed.local/%'],
      ['xn_album_photo', 'image_url', 'https://seed.local/%']
    ]) {
      await q(conn, 'DELETE FROM `' + table + '` WHERE `' + col + '` LIKE ?', [prefix])
    }
    if (oldIds.length) await q(conn, 'DELETE FROM xn_user WHERE id IN (?)', [oldIds])
    console.log('[seed] cleaned', oldIds.length, 'old seed users')

    // ===== 2. 参考资料（不存在则补最小数据）=====
    let [games] = await q(conn, 'SELECT id, name FROM xn_game WHERE status = 1 LIMIT 20')
    if (!games.length) {
      const ids = await insert(conn, 'xn_game', Array.from({ length: 5 }, (_, i) => ({ name: '测试游戏' + (i + 1), image: 'https://seed.local/game' + i + '.png', status: 1, sort: i, create_time: now })))
      games = ids.map((id, i) => ({ id, name: '测试游戏' + (i + 1) }))
    }
    let [gifts] = await q(conn, 'SELECT id, title, image, money FROM xn_gift WHERE status = 1 LIMIT 20')
    if (!gifts.length) {
      const ids = await insert(conn, 'xn_gift', Array.from({ length: 5 }, (_, i) => ({ title: '测试礼物' + (i + 1), image: 'https://seed.local/gift' + i + '.png', money: 10 + i * 10, status: 1, sort: i })))
      gifts = ids.map((id, i) => ({ id, title: '测试礼物' + (i + 1), image: 'https://seed.local/gift' + i + '.png', money: 10 + i * 10 }))
    }
    let [vipPkgs] = await q(conn, 'SELECT id, name, price, duration, level FROM xn_vip_package WHERE status = 1 LIMIT 10')
    if (!vipPkgs.length) {
      const ids = await insert(conn, 'xn_vip_package', [{ name: '测试月卡', price: 30, duration: 30, level: 1, status: 1, create_time: now }])
      vipPkgs = [{ id: ids[0], name: '测试月卡', price: 30, duration: 30, level: 1 }]
    }
    let [virtUsers] = await q(conn, 'SELECT id FROM xn_virtual_user WHERE status = 1 LIMIT 20')
    if (!virtUsers.length) {
      const ids = await insert(conn, 'xn_virtual_user', Array.from({ length: 5 }, (_, i) => ({ name: '测试虚拟用户' + (i + 1), avatar: 'https://seed.local/v' + i + '.png', gender: i % 2, age: 20 + i, region: '北京', tags: '[]', intro: 'seed', price_per_hour: 50, online_status: 1, status: 1, create_time: now, update_time: now })))
      virtUsers = ids.map((id) => ({ id }))
    }
    const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '西安', '重庆']

    // ===== 3. 100 个用户 =====
    const passwordHash = bcrypt.hashSync(TEST_PASSWORD, 10)
    const userRows = Array.from({ length: COUNT }, (_, i) => ({
      username: 'seed_user_' + String(i + 1).padStart(3, '0'),
      nickname: '测试用户' + String(i + 1).padStart(3, '0'),
      avatar: 'https://picsum.photos/200/200?random=' + (3000 + i),
      ...mobileFields(MOBILE_PREFIX + String(1000 + i)),
      password: passwordHash,
      money: 1000 + i * 10,
      gift_money: 200 + i,
      gift_money_zong: 500,
      score: 100 + i * 5,
      lv: 1 + (i % 10),
      vip: i % 3 === 0 ? 1 : 0,
      vip_lv: i % 3 === 0 ? 1 + (i % 5) : 0,
      vip_expire_time: i % 3 === 0 ? now + 30 * day : 0,
      sex: i % 2,
      city: cities[i % cities.length],
      status: 1,
      fans_num: i * 3,
      create_time: now - i * day,
      last_login_time: now - i * 3600,
      ip: '10.0.0.' + (i + 1),
      platform: 'seed',
      dec: 'Sealos 测试数据'
    }))
    const userIds = await insert(conn, 'xn_user', userRows)
    console.log('[seed] users:', userIds.length)

    // ===== 4. 陪玩资料 =====
    const profiles = userIds.map((uid, i) => ({
      user_id: uid,
      game_id: games[i % games.length].id,
      price: 50 + i,
      tags: '王者荣耀,和平精英,聊天',
      voice_intro: 'https://seed.local/voice' + i + '.mp3',
      voice_time: 15,
      icon: 'https://picsum.photos/200/200?random=' + (5000 + i),
      description: '测试陪玩资料 ' + (i + 1),
      order_num: i % 20,
      income_total: 1000 + i * 50,
      pingjia_num: i % 10,
      star: 5,
      status: 2,
      create_time: now - day,
      update_time: now
    }))
    await insert(conn, 'xn_companion_profile', profiles)

    // ===== 5. 游戏订单 100 =====
    const orderRows = userIds.map((uid, i) => {
      const target = userIds[(i + 1) % COUNT]
      const price = 50 + (i % 50)
      const duration = 1 + (i % 3)
      const status = [0, 1, 2, 3, 4][i % 5]
      const created = now - i * 3600
      return {
        order_no: 'SEEDORD' + (100000 + i),
        user_id: uid,
        target_user_id: target,
        companion_id: target,
        companion_name: '测试用户' + String(((i + 1) % COUNT) + 1).padStart(3, '0'),
        duration,
        amount: price * duration,
        game_id: games[i % games.length].id,
        game_name: games[i % games.length].name,
        price,
        num: 1,
        total_price: price * duration,
        status,
        remark: 'Sealos seed 订单 ' + (i + 1),
        create_time: created,
        add_time: created,
        start_time: status >= 2 ? created + 600 : null,
        end_time: status >= 3 ? created + 600 + duration * 3600 : 0,
        pingjia_status: status === 3 ? 1 : 0,
        pingjia_time: status === 3 ? created + duration * 3600 : 0,
        star: status === 3 ? 5 : 0,
        content: status === 3 ? '测试评价：服务很好' : ''
      }
    })
    const orderIds = await insert(conn, 'xn_game_order', orderRows)
    console.log('[seed] game orders:', orderIds.length)

    // ===== 6. 帖子 / 点赞 / 评论 / 解锁 =====
    const postRows = userIds.map((uid, i) => {
      const isPrivate = i < 20
      return {
        user_id: uid,
        content: 'Sealos 测试动态 #' + (i + 1) + ' 今天一起开黑吗？',
        images: JSON.stringify(['https://picsum.photos/600/400?random=' + (7000 + i)]),
        videos: '',
        thumb_num: i % 20,
        comment_num: i % 10,
        share_num: i % 5,
        tag_id: (i % 5) + 1,
        type: 0,
        status: 1,
        is_private: isPrivate ? 1 : 0,
        private_password: isPrivate ? '1234' : '',
        private_price: isPrivate ? 10 : 0,
        create_time: now - i * 1800,
        update_time: now - i * 1800
      }
    })
    const postIds = await insert(conn, 'xn_post', postRows)
    console.log('[seed] posts:', postIds.length)

    await insert(conn, 'xn_post_like', postIds.map((pid, i) => ({ post_id: pid, user_id: userIds[(i + 7) % COUNT], create_time: now - i * 60 })))
    await insert(conn, 'xn_post_comment', postIds.map((pid, i) => ({ post_id: pid, user_id: userIds[(i + 11) % COUNT], content: '测试评论 ' + (i + 1), reply_id: 0, reply_user_id: 0, create_time: now - i * 60 })))
    const privatePostIds = postIds.slice(0, 20)
    await insert(conn, 'xn_post_unlock', Array.from({ length: COUNT }, (_, i) => ({ post_id: privatePostIds[i % privatePostIds.length], user_id: userIds[i], price: 10, create_time: now - i * 60 })))

    // ===== 7. 关注 / 访问 =====
    await insert(conn, 'xn_user_follow', userIds.map((uid, i) => ({ follower_id: uid, following_id: userIds[(i + 1) % COUNT], create_time: now - i * 60 })))
    await insert(conn, 'xn_user_visit', userIds.map((uid, i) => ({ user_id: uid, visitor_id: userIds[(i + 2) % COUNT], create_time: now - i * 60 })))

    // ===== 8. 礼物 / 红包 =====
    await insert(conn, 'xn_gift_log', userIds.map((uid, i) => {
      const g = gifts[i % gifts.length]
      return {
        user_id: uid,
        user_nickname: '测试用户' + String(i + 1).padStart(3, '0'),
        user_avatar: 'https://picsum.photos/100/100?random=' + (3000 + i),
        song_user_id: userIds[(i + 3) % COUNT],
        song_user_nickname: '测试用户' + String(((i + 3) % COUNT) + 1).padStart(3, '0'),
        song_user_avatar: 'https://picsum.photos/100/100?random=' + (3000 + ((i + 3) % COUNT)),
        gift_id: g.id,
        gift_name: g.title,
        gift_image: g.image,
        gift_num: 1 + (i % 3),
        totalmoney: (Number(g.money) || 10) * (1 + (i % 3)),
        currency: 'coin',
        create_time: now - i * 120
      }
    }))
    const packetRows = userIds.map((uid, i) => ({
      packet_no: 'SEEDRP' + (100000 + i),
      sender_id: uid,
      sender_nickname: '测试用户' + String(i + 1).padStart(3, '0'),
      type: i % 2,
      total_num: 3,
      total_amount: 30,
      remain_num: 2,
      remain_amount: 20,
      expire_time: now + day,
      status: 0,
      create_time: now - i * 300
    }))
    const packetIds = await insert(conn, 'xn_red_packet', packetRows)
    await insert(conn, 'xn_red_packet_log', packetIds.map((pid, i) => ({ packet_id: pid, user_id: userIds[(i + 5) % COUNT], user_nickname: '测试用户' + String(((i + 5) % COUNT) + 1).padStart(3, '0'), amount: 10, create_time: now - i * 300 })))

    // ===== 9. 预约 / 需求 / 时段 =====
    const reserveRows = userIds.map((uid, i) => ({
      user_id: uid,
      target_user_id: userIds[(i + 1) % COUNT],
      game_id: games[i % games.length].id,
      reserve_date: new Date(Date.now() + (i % 14 + 1) * day).toISOString().slice(0, 10),
      reserve_time: '20:00:00',
      status: i % 5,
      duration: 2,
      price: 100,
      remark: 'Sealos 测试预约 ' + (i + 1),
      service_type: i % 2 ? 'online' : 'offline',
      create_time: now - i * 600,
      update_time: now - i * 600
    }))
    await insert(conn, 'xn_reserve', reserveRows)
    await insert(conn, 'xn_reserve_slot', userIds.map((uid, i) => ({ user_id: uid, game_id: games[i % games.length].id, reserve_date: new Date(Date.now() + (i % 14 + 1) * day).toISOString().slice(0, 10), reserve_time: '21:00:00', status: 0, create_time: now })))
    await insert(conn, 'xn_demand', userIds.map((uid, i) => ({
      user_id: uid,
      service_type: i % 2 ? 'online' : 'offline',
      game_id: games[i % games.length].id,
      game_name: games[i % games.length].name,
      date: new Date(Date.now() + (i % 14 + 1) * day).toISOString().slice(0, 10),
      start_time: '19:00:00',
      end_time: '22:00:00',
      duration: 3,
      budget: 100 + i,
      remark: 'Sealos 测试需求 ' + (i + 1),
      offline_location: i % 2 ? '' : '北京朝阳',
      gender: i % 2 ? 'male' : 'female',
      age_start: 18,
      age_end: 35,
      tags: JSON.stringify(['王者荣耀', '娱乐']),
      status: i % 3 === 0 ? 'closed' : 'active',
      create_time: now - i * 900,
      update_time: now - i * 900
    })))

    // ===== 10. 通话 / 计费 =====
    const callRows = userIds.map((uid, i) => ({
      call_no: 'SEEDCALL' + (100000 + i),
      caller_id: uid,
      callee_id: userIds[(i + 1) % COUNT],
      call_type: i % 2 ? 2 : 1,
      trtc_room_id: 100000 + i,
      status: 4,
      connect_time: now - i * 7200,
      end_time: now - i * 7200 + 600,
      duration: 10,
      end_reason: 'completed',
      is_companion_call: 1,
      order_id: orderIds[i],
      create_time: now - i * 7200
    }))
    const callIds = await insert(conn, 'xn_call_record', callRows)
    await insert(conn, 'xn_call_billing', callIds.map((cid, i) => ({ call_id: cid, user_id: userIds[i], companion_id: userIds[(i + 1) % COUNT], duration: 10, unit_price: 10, total_amount: 100, status: 1, settle_time: now - i * 3600, create_time: now - i * 7200 })))

    // ===== 11. 聊天（MySQL） =====
    await insert(conn, 'xn_chat_log', userIds.map((uid, i) => ({ fromid: uid, toid: userIds[(i + 1) % COUNT], content: 'Sealos 测试消息 ' + (i + 1), type: 1, vod_url: '', sec: 0, time: now - i * 120, isread: i % 2, is_del: 0, is_revoked: 0 })))
    await insert(conn, 'xn_chat_room', userIds.map((uid, i) => ({ user_id: uid, virtual_user_id: virtUsers[i % virtUsers.length].id, last_message: '虚拟用户测试消息 ' + (i + 1), last_message_time: now - i * 180, unread_count: i % 3, create_time: now - day, update_time: now - i * 180 })))
    await insert(conn, 'xn_virtual_chat_history', userIds.map((uid, i) => ({ virtual_user_id: virtUsers[i % virtUsers.length].id, user_id: uid, content: '虚拟聊天历史 ' + (i + 1), type: 0, sender: i % 2, sort_order: i, create_time: now - i * 180 })))

    // ===== 12. 钱包 / 提现 / 充值 / VIP =====
    await insert(conn, 'xn_withdraw', userIds.map((uid, i) => ({
      user_id: uid,
      money: 50 + i,
      amount: 50 + i,
      pay_money: 50 + i,
      shouxufei: 1,
      type: i % 2 ? 2 : 1,
      account: 'test' + i + '@example.com',
      bank: '',
      name: '测试用户' + String(i + 1).padStart(3, '0'),
      mobile: MOBILE_PREFIX + String(1000 + i),
      image: '',
      is_check: i % 3,
      status: i % 3,
      state: i % 3 === 0 ? 'pending' : i % 3 === 1 ? 'approved' : 'rejected',
      channel: 'wallet',
      currency: 'coin',
      remark: 'Sealos 测试提现 ' + (i + 1),
      create_time: now - i * 1800,
      update_time: now - i * 1800
    })))
    await insert(conn, 'xn_order_chong', userIds.map((uid, i) => ({ order_no: 'SEEDRC' + (100000 + i), user_id: uid, amount: 10 + i, coins: 100 + i, status: 1, pay_type: i % 2 ? 'wechat' : 'alipay', pay_time: now - i * 3600, create_time: now - i * 3600, update_time: now - i * 3600 })))
    await insert(conn, 'xn_vip_order', userIds.map((uid, i) => {
      const p = vipPkgs[i % vipPkgs.length]
      return { user_id: uid, order_no: 'SEEDVIP' + (100000 + i), package_id: p.id, price: p.price, duration: p.duration, level: p.level || 1, pay_type: 1, status: 1, pay_no: 'SEEDPAY' + i, create_time: now - i * 3600, pay_time: now - i * 3600 }
    }))
    await insert(conn, 'xn_card', Array.from({ length: COUNT }, (_, i) => {
      const key = 'SEEDKEY' + (100000000000000000n + BigInt(i)).toString()
      return { card_no: 'SEEDCARD' + (100000 + i), card_password: 'SEEDPWD' + i, card_key: key, type: 1, value: 10, coin_amount: 100 + i, status: i % 2, use_user_id: i % 2 ? userIds[i] : null, use_time: i % 2 ? now - i * 3600 : 0, admin_id: 1, admin_name: 'seed', create_time: now - i * 3600 }
    }))

    // ===== 13. 相册 / 举报 / 反馈 / 媒资 / 偏好 =====
    const photoIds = await insert(conn, 'xn_album_photo', userIds.map((uid, i) => ({ user_id: uid, image_url: 'https://seed.local/photo/' + (i + 1) + '.jpg', description: '测试相册 ' + (i + 1), privacy: i % 4 === 0 ? 'private' : 'public', password: i % 4 === 0 ? '1234' : '', price: i % 4 === 0 ? 5 : 0, likes: i % 10, create_time: now - i * 1200, status: 1 })))
    await insert(conn, 'xn_album_like', photoIds.map((pid, i) => ({ photo_id: pid, user_id: userIds[(i + 9) % COUNT], create_time: now - i * 60 })))
    await insert(conn, 'xn_report', userIds.map((uid, i) => ({ user_id: uid, target_user_id: userIds[(i + 4) % COUNT], target_type: (i % 3) + 1, target_id: postIds[i] || 0, reason: '测试举报 ' + (i + 1), images: '[]', status: i % 2, handle_result: i % 2 ? '已处理' : '', handle_time: i % 2 ? now : 0, create_time: now - i * 600 })))
    await insert(conn, 'xn_feedback', userIds.map((uid, i) => ({ user_id: uid, type: ['bug', 'suggestion', 'other'][i % 3], content: 'Sealos 测试反馈 ' + (i + 1), images: '[]', contact: MOBILE_PREFIX + String(1000 + i), status: i % 2, reply: '', create_time: now - i * 300, update_time: now - i * 300 })))
    await insert(conn, 'xn_media_asset', userIds.map((uid, i) => ({ user_id: uid, biz_type: 'seed', biz_id: postIds[i], url: 'https://seed.local/media/' + (i + 1) + '.jpg', storage: 'local', file_type: 'image', create_time: now - i * 300, status: 1 })))
    await insert(conn, 'xn_user_pref', userIds.map((uid, i) => ({ user_id: uid, data: JSON.stringify({ privacy: { showOnline: true, showLocation: i % 2 === 0, allowVisit: true, allowSearch: true }, seed: true }), update_time: now })))

    await conn.commit()

    // ===== 14. 统计输出 =====
    const tables = ['xn_user', 'xn_companion_profile', 'xn_game_order', 'xn_post', 'xn_post_like', 'xn_post_comment', 'xn_post_unlock', 'xn_user_follow', 'xn_user_visit', 'xn_gift_log', 'xn_red_packet', 'xn_red_packet_log', 'xn_reserve', 'xn_reserve_slot', 'xn_demand', 'xn_call_record', 'xn_call_billing', 'xn_chat_log', 'xn_chat_room', 'xn_virtual_chat_history', 'xn_withdraw', 'xn_order_chong', 'xn_vip_order', 'xn_card', 'xn_album_photo', 'xn_album_like', 'xn_report', 'xn_feedback', 'xn_media_asset', 'xn_user_pref']
    console.log('\n[seed] 完成，各表 seed 用户/记录数量：')
    const [[uc]] = await q(conn, 'SELECT COUNT(*) c FROM xn_user WHERE username LIKE ?', ['seed_user_%'])
    console.log('  xn_user(seed):', uc.c)
    for (const t of tables.slice(1)) {
      let cond
      if (['xn_game_order', 'xn_post', 'xn_companion_profile', 'xn_follow' ].includes(t)) cond = '1=1'
      else cond = '1=1'
      try {
        const [[r]] = await q(conn, 'SELECT COUNT(*) c FROM `' + t + '`')
        console.log('  ' + t + '(总):', r.c)
      } catch (e) { console.log('  ' + t + ' 统计失败', e.message) }
    }
    console.log('\n测试账号：13900011000 ~ 13900011099，统一密码 Test@123456')
  } catch (err) {
    try { await conn.rollback() } catch (e) {}
    console.error('[seed] 失败，已回滚:', err.message)
    process.exitCode = 1
  } finally {
    await conn.end()
  }
})()
