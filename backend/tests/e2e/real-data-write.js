/**
 * 真实数据端到端功能测试（写入型）
 * ------------------------------------------------------------------
 * 经用户授权，对真实库执行写入型业务流程，验证资金/状态是否正确。
 * 使用库内现有账号（1/2/11003 等）。每一步都会记录 HTTP 结果与资金/落库校验。
 *
 * 运行：
 *   cd backend
 *   NODE="/c/Users/Administrator/AppData/Local/Programs/Qoder CN/Qoder CN.exe"
 *   ELECTRON_RUN_AS_NODE=1 "$NODE" tests/e2e/real-data-write.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
process.env.NODE_ENV = 'development';
process.env.AUTO_MIGRATE = 'false';

const fs = require('fs');
const path = require('path');
const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const config = require('../../src/config');
const sequelize = require('../../src/config/mysql');
const setupRoutes = require('../../src/routes');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.get('/api/health', (req, res) => res.json({ code: 200, message: 'OK', data: {} }));
setupRoutes(app);
app.use((req, res) => res.status(404).json({ code: 404, message: '接口不存在' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => res.status(500).json({ code: 500, message: '服务器内部错误' }));

const tok = (uid) => jwt.sign({ userId: uid }, config.jwt.secret, { expiresIn: '1h' });
const U1 = tok(1);   // 游戏达人小王（5000）
const U2 = tok(2);   // 玩家小美（1200）
const U5 = tok(5);   // 资深玩家（15000）
const COMPANION = 11003;
const TC = tok(COMPANION);

const results = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function money(uid) {
  const [r] = await sequelize.query('SELECT money, gift_money FROM xn_user WHERE id = ?', { replacements: [uid] });
  return r[0] ? { money: Number(r[0].money), giftMoney: Number(r[0].gift_money) } : null;
}
const num = async (sql, rep = {}) => {
  const [r] = await sequelize.query(sql, { replacements: rep });
  return Number(r[0] ? Object.values(r[0])[0] : 0);
};

async function call(name, method, url, token, body, expect = 'any') {
  const started = Date.now();
  let status = 0, resp = {};
  try {
    let req = request(app)[method.toLowerCase()](url);
    if (token) req = req.set('Authorization', `Bearer ${token}`);
    if (body !== undefined) req = req.send(body);
    const res = await req;
    status = res.status;
    resp = res.body || {};
  } catch (e) {
    status = -1;
    resp = { message: e.message };
  }
  const ok = expect === 'any' ? (status > 0 && status < 500) : status === expect;
  const rec = { name, status, code: resp.code, message: resp.message || '', data: resp.data, ms: Date.now() - started, ok };
  results.push(rec);
  console.log(`${ok ? '✅' : '❌'} ${name.padEnd(34)} ${status} ${String(resp.code).padEnd(5)} ${resp.message || ''}`);
  return resp.data;
}

const daysFromNow = (d) => {
  const t = new Date(Date.now() + d * 86400000);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
};

async function main() {
  console.log('\n=== 真实数据端到端功能测试（写入型） ===');
  await sequelize.authenticate();

  // 取样
  const [giftRow] = await sequelize.query('SELECT id, money, title FROM xn_gift WHERE status = 1 ORDER BY id LIMIT 1');
  const gift = giftRow[0];
  const [gameRow] = await sequelize.query('SELECT id, name FROM xn_game ORDER BY id LIMIT 1');
  const game = gameRow[0];
  const [profRow] = await sequelize.query('SELECT user_id, price, status FROM xn_companion_profile WHERE status = 2 ORDER BY id LIMIT 1');
  const prof = profRow[0];
  const companionId = prof ? prof.user_id : COMPANION;
  const compPrice = prof ? Number(prof.price) : 0;
  const [vipRow] = await sequelize.query('SELECT id, price FROM xn_vip_package ORDER BY id LIMIT 1');
  const vip = vipRow[0];
  const [rcRow] = await sequelize.query('SELECT id, price, coins FROM xn_recharge_package ORDER BY id LIMIT 1');
  const rc = rcRow[0];
  console.log('取样：', JSON.stringify({ gift, game, companionId, compPrice, vip, rc }));

  // ---------- 1. 关注 / 取消关注 ----------
  await call('关注用户2', 'post', '/api/user/follow', U1, { targetUserId: 2, action: 1 });
  const followCnt = await num('SELECT COUNT(*) c FROM xn_user_follow WHERE follower_id = 1 AND following_id = 2');
  results.push({ name: '关注落库校验', ok: followCnt > 0 });
  console.log(`${followCnt > 0 ? '✅' : '❌'} 关注落库校验                xn_user_follow=${followCnt}`);
  await call('取消关注用户2', 'post', '/api/user/follow', U1, { targetUserId: 2, action: 0 });

  // ---------- 2. 访问记录 / 偏好 ----------
  await call('记录访问用户2', 'post', '/api/user/visit', U1, { targetUserId: 2 });
  const visitCnt = await num('SELECT COUNT(*) c FROM xn_user_visit WHERE user_id = 2 AND visitor_id = 1');
  results.push({ name: '访问落库校验', ok: visitCnt > 0 });
  console.log(`${visitCnt > 0 ? '✅' : '❌'} 访问落库校验                xn_user_visit=${visitCnt}`);
  await call('保存偏好', 'post', '/api/user/pref', U1, { theme: 'dark', skin: 'gold' });
  await call('读取偏好', 'get', '/api/user/pref', U1);

  // ---------- 3. 实名认证 ----------
  await call('提交实名认证', 'post', '/api/user/real-name', U1, {
    realName: '测试用户', idCard: '110101199001011234',
    front: 'https://example.com/f.jpg', back: 'https://example.com/b.jpg'
  });

  // ---------- 4. 聊天 ----------
  const sent = await call('发送聊天消息', 'post', '/api/chat/send', U1, { targetUserId: 2, content: 'e2e 功能测试消息', type: 0 });
  await call('标记会话已读', 'post', '/api/chat/mark-read', U2, { targetUserId: 1 });
  if (sent && sent.messageId) {
    await call('撤回消息', 'post', '/api/chat/revoke', U1, { messageId: sent.messageId });
  } else {
    console.log('⏭️  撤回消息                （未取得 messageId，跳过）');
  }

  // ---------- 5. 虚拟人聊天 ----------
  const vu = await call('虚拟人列表', 'get', '/api/virtual-user', U1);
  const vuId = vu && (vu.list ? (vu.list[0] && vu.list[0].id) : (Array.isArray(vu) ? vu[0] && vu[0].id : null));
  if (vuId) await call('与虚拟人聊天', 'post', `/api/virtual-user/${vuId}/chat`, U1, { message: '你好' });
  else console.log('⏭️  与虚拟人聊天            （无虚拟人，跳过）');

  // ---------- 6. 送礼（资金） ----------
  const b1 = await money(1); const b2 = await money(2);
  await call('赠送礼物', 'post', '/api/gift/send', U1, { receiverId: 2, giftId: gift.id, count: 1 });
  await sleep(150);
  const a1 = await money(1); const a2 = await money(2);
  const glCnt = await num('SELECT COUNT(*) c FROM xn_gift_log WHERE song_user_id = 1 AND user_id = 2');
  const expectCost = Number(gift.money);
  const costOk = Math.abs((b1.money - a1.money) - expectCost) < 0.01;
  const gainOk = Math.abs((a2.money - b2.money) - expectCost * 0.7) < 0.01;
  results.push({ name: '送礼资金校验(扣/收)', ok: costOk && gainOk });
  console.log(`${costOk && gainOk ? '✅' : '❌'} 送礼资金校验  扣${b1.money}→${a1.money}(-${(b1.money - a1.money).toFixed(2)}, 期望-${expectCost})  收${b2.money}→${a2.money}(+${(a2.money - b2.money).toFixed(2)}, 期望+${(expectCost * 0.7).toFixed(2)})  日志${glCnt}条`);

  // ---------- 7. 红包（资金） ----------
  const pkt = await call('发红包', 'post', '/api/gift/redpacket/send', U1, { type: 0, totalAmount: 10, totalNum: 1 });
  if (pkt && (pkt.packetNo || pkt.packet_no)) {
    await call('抢红包', 'post', '/api/gift/redpacket/receive', U2, { packetNo: pkt.packetNo || pkt.packet_no });
  } else {
    console.log('⏭️  抢红包                  （未取得 packetNo，跳过）', JSON.stringify(pkt));
  }

  // ---------- 8. 陪玩订单全链路（资金） ----------
  if (prof) {
    const c0 = await money(companionId);
    const o = await call('下单陪玩', 'post', '/api/games/push', U1, { targetUserId: companionId, gameId: game.id, num: 1 });
    if (o && o.orderId) {
      await call('陪玩师抢单', 'post', '/api/games/grab', TC, { orderId: o.orderId });
      await call('开始陪玩', 'post', '/api/games/start', TC, { orderId: o.orderId });
      await call('完成陪玩', 'post', '/api/games/complete', U1, { orderId: o.orderId });
      await call('评价订单', 'post', '/api/games/evaluate', U1, { orderId: o.orderId, rating: 5, comment: 'e2e 测试好评' });
      const c1 = await money(companionId);
      const st = await num('SELECT status FROM xn_game_order WHERE id = ?', [o.orderId]);
      const amt = await num('SELECT amount FROM xn_game_order WHERE id = ?', [o.orderId]);
      const expectIncome = Math.round(compPrice * 0.7 * 100) / 100;
      const incOk = Math.abs((c1.giftMoney - c0.giftMoney) - expectIncome) < 0.01;
      results.push({ name: '订单结算校验', ok: st === 3 && incOk });
      console.log(`${st === 3 && incOk ? '✅' : '❌'} 订单结算校验        status=${st}(期望3)  陪玩师 gift_money ${c0.giftMoney}→${c1.giftMoney}(+${(c1.giftMoney - c0.giftMoney).toFixed(2)}, 期望+${expectIncome})  order.amount=${amt}`);
    }
    // 取消订单分支
    const o2 = await call('下单(待取消)', 'post', '/api/games/push', U1, { targetUserId: companionId, gameId: game.id, num: 1 });
    if (o2 && o2.orderId) {
      const m0 = await money(1);
      await call('取消订单', 'post', '/api/games/cancel', U1, { orderId: o2.orderId, role: 'user' });
      const m1 = await money(1);
      console.log(`ℹ️  取消订单退款：${m0.money}→${m1.money}(Δ${(m1.money - m0.money).toFixed(2)})`);
    }
  }

  // ---------- 9. 预约全链路（资金） ----------
  if (prof) {
    const date = daysFromNow(30 + Math.floor(Math.random() * 25)); // 每次跑随机未来日期，避开已占用时段
    await call('陪玩师设置时间槽', 'post', '/api/reserve/slots/batch', TC, { gameId: game.id, slots: [{ date, time: '10:00' }] });
    const r0 = await money(1);
    const rv = await call('创建预约(50)', 'post', '/api/reserve/create', U1, { companionId, gameId: game.id, date, time: '10:00', duration: 1, price: 50, serviceType: 'online' });
    const r1 = await money(1);
    const rvId = rv && (rv.reserveId || rv.id);
    if (rvId) {
      await call('陪玩师确认预约', 'post', '/api/reserve/confirm', TC, { reserveId: rvId });
      await call('完成预约', 'post', '/api/reserve/complete', U1, { reserveId: rvId });
    }
    const rvOk = !!rvId && Math.abs((r0.money - r1.money) - 50) < 0.01;
    results.push({ name: '预约扣款校验', ok: rvOk });
    console.log(`${rvOk ? '✅' : '❌'} 预约扣款：${r0.money}→${r1.money}(-${(r0.money - r1.money).toFixed(2)}, 期望-50)`);
    // 取消退款分支（>24h 全退）
    await call('陪玩师设置时间槽2', 'post', '/api/reserve/slots/batch', TC, { gameId: game.id, slots: [{ date, time: '11:00' }] });
    const c0 = await money(1);
    const rv2 = await call('创建预约(30)', 'post', '/api/reserve/create', U1, { companionId, gameId: game.id, date, time: '11:00', duration: 1, price: 30, serviceType: 'online' });
    const cMid = await money(1);
    const rvId2 = rv2 && (rv2.reserveId || rv2.id);
    if (rvId2) await call('取消预约', 'post', '/api/reserve/cancel', U1, { reserveId: rvId2 });
    const c1 = await money(1);
    const deductOk = Math.abs((c0.money - cMid.money) - 30) < 0.01;
    const refundOk = Math.abs(c1.money - c0.money) < 0.01;
    results.push({ name: '预约取消退款校验', ok: deductOk && refundOk });
    console.log(`${deductOk && refundOk ? '✅' : '❌'} 预约取消退款：扣${c0.money}→${cMid.money}(-${(c0.money - cMid.money).toFixed(2)}/期望-30)  退${cMid.money}→${c1.money}(+${(c1.money - cMid.money).toFixed(2)}/期望+30 全退)`);
  }

  // ---------- 10. 动态（发帖/点赞/评论/分享/转发/解锁） ----------
  const post = await call('发布动态', 'post', '/api/circle/create', U1, { content: 'e2e 功能测试动态 ' + Date.now(), images: [], visibility: 0 });
  const postId = post && (post.postId || post.id);
  if (postId) {
    await call('点赞动态', 'post', '/api/circle/like', U2, { postId });
    await call('评论动态', 'post', '/api/circle/comment', U2, { postId, content: 'e2e 测试评论' });
    await call('分享动态', 'post', '/api/circle/share', U1, { postId });
    await call('转发动态', 'post', '/api/circle/repost', U1, { postId, comment: 'e2e 转发' });
    await call('删除动态', 'post', '/api/circle/delete', U1, { postId });
  }
  // 私密帖解锁（资金）
  const pp = await call('发布私密帖(10)', 'post', '/api/circle/create', U1, { content: 'e2e 私密内容 ' + Date.now(), images: [], visibility: 4, price: 10 });
  const ppId = pp && (pp.postId || pp.id);
  if (ppId) {
    const m0 = await money(2);
    await call('解锁私密帖', 'post', '/api/circle/unlock', U2, { postId: ppId, unlockType: 2 });
    const m1 = await money(2);
    console.log(`ℹ️  私密帖解锁扣款：${m0.money}→${m1.money}(Δ${(m1.money - m0.money).toFixed(2)}, 期望-10)`);
    await call('删除私密帖', 'post', '/api/circle/delete', U1, { postId: ppId });
  }

  // ---------- 11. 举报 / 反馈 / 需求 ----------
  await call('提交举报', 'post', '/api/report', U1, { targetType: 1, targetId: 2, reason: 'e2e 测试举报' });
  await call('提交反馈', 'post', '/api/feedback/submit', U1, { type: 1, content: 'e2e 测试反馈', contact: '13800138000' });
  const dm = await call('发布需求', 'post', '/api/demand/create', U1, {
    serviceType: 'online', game: '王者荣耀', date: daysFromNow(3),
    startTime: '19:00', endTime: '21:00', duration: 2, budget: 100, remark: 'e2e'
  });
  const dmId = dm && (dm.demandId || dm.id);
  if (dmId) await call('取消需求', 'post', '/api/demand/cancel', U1, { demandId: dmId });

  // ---------- 12. VIP 开通（资金/状态） ----------
  if (vip) {
    const vo = await call('创建VIP订单', 'post', '/api/vip/order', U5, { packageId: vip.id });
    const orderNo = vo && (vo.orderNo || vo.order_no);
    if (orderNo) {
      await call('完成VIP订单', 'post', '/api/vip/order/complete', U5, { orderNo, transactionId: 'e2e-tx' });
      const vst = await num('SELECT status FROM xn_vip_order WHERE order_no = ?', [orderNo]);
      console.log(`ℹ️  VIP订单状态：${vst}`);
    }
  }

  // ---------- 13. 充值下单 + 回调（资金） ----------
  if (rc) {
    const m0 = await money(5);
    const co = await call('充值下单', 'post', '/api/pay/create-order', U5, { packageId: rc.id, payType: 1 });
    const orderNo = co && (co.orderNo || co.order_no);
    if (orderNo) {
      await call('充值回调', 'post', '/api/pay/wx-callback', null, { payNo: orderNo, transactionId: 'e2e-tx' });
      const m1 = await money(5);
      const expectCoins = Number(rc.coins);
      const ok = Math.abs((m1.money - m0.money) - expectCoins) < 0.01;
      results.push({ name: '充值回调入账校验', ok });
      console.log(`${ok ? '✅' : '❌'} 充值回调入账：${m0.money}→${m1.money}(+${(m1.money - m0.money).toFixed(2)}, 期望+${expectCoins})`);
    }
  }

  // ---------- 14. 提现（两条入口，落库） ----------
  const w0 = await num('SELECT COUNT(*) c FROM xn_withdraw');
  await call('礼物提现', 'post', '/api/gift/withdraw', U5, { money: 100, type: 1 });
  await call('钱包提现', 'post', '/api/wallet/withdraw', U5, { amount: 100, type: 1, account: 'e2e@alipay.com' });
  const w1 = await num('SELECT COUNT(*) c FROM xn_withdraw');
  const wOk = w1 - w0 >= 1;
  results.push({ name: '提现落库校验', ok: wOk });
  console.log(`${wOk ? '✅' : '❌'} 提现落库校验                xn_withdraw ${w0}→${w1}(+${w1 - w0})`);

  // ---------- 15. 相册 ----------
  const ph = await call('上传相册照片', 'post', '/api/album/upload', U1, { url: 'https://example.com/e2e.jpg', description: 'e2e', privacy: 1 });
  const phId = ph && (ph.id || ph.photoId);
  if (phId) {
    await call('相册点赞', 'post', '/api/album/like', U2, { id: phId });
    await call('删除相册照片', 'post', '/api/album/delete', U1, { id: phId });
  }

  // ---------- 汇总 ----------
  const pass = results.filter((r) => r.ok).length;
  const fail = results.length - pass;
  console.log(`\n=== 写入型汇总：PASS ${pass} / FAIL ${fail}（共 ${results.length}） ===`);
  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.log('\n未通过项：');
    failed.forEach((r) => console.log(`  ❌ ${r.name}  ${r.status || ''} ${r.message || ''}`));
  }

  fs.writeFileSync(path.join(__dirname, 'write-report.json'), JSON.stringify({ generatedAt: new Date().toISOString(), pass, fail, results }, null, 2));
  console.log('📄 报告：tests/e2e/write-report.json');

  await sequelize.close();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(async (e) => {
  console.error('❌ 运行失败：', e);
  try { await sequelize.close(); } catch (_) { /* ignore */ }
  process.exit(2);
});
