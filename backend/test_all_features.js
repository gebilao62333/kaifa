/**
 * 功能测试脚本 - 创建10个用户并测试各个功能模块
 */
const http = require('http');

const BASE_URL = 'http://localhost:3000';
// 安全：不要把管理员令牌硬编码进仓库（推送到远端等于把 admin 凭据公开）。
// 通过环境变量提供：$env:ADMIN_TOKEN="..." 或写入 backend/.env（.env 已被 .gitignore 忽略）
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
if (!ADMIN_TOKEN) {
  console.error('缺少 ADMIN_TOKEN：请在 backend/.env 配置，或先执行 node -e "..." 生成');
  process.exit(1);
}

const stats = { total: 0, passed: 0, failed: 0, errors: [] };

function request(method, path, { body, token, adminAuth } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    if (adminAuth) options.headers['Authorization'] = `Bearer ${ADMIN_TOKEN}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Request timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function ok(res) { return res && res.data && (res.data.code === 200 || res.data.code === 201); }

function assert(name, condition, detail) {
  stats.total++;
  if (condition) {
    stats.passed++;
    console.log(`  ✅ ${name}`);
  } else {
    stats.failed++;
    console.log(`  ❌ ${name} — ${detail || 'failed'}`);
    stats.errors.push(name);
  }
}

function errDetail(res) {
  if (!res || !res.data) return 'no response';
  return JSON.stringify(res.data).slice(0, 200);
}

async function createUsers() {
  console.log('\n========== 阶段1：注册10个测试用户 ==========\n');
  const users = [];
  const names = ['小明', '小红', '小刚', '小美', '小强', '小丽', '小华', '小芳', '小龙', '小凤'];
  const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '重庆', '西安'];
  const base = Date.now();
  for (let i = 0; i < 10; i++) {
    const phone = `139${String(base + i).slice(-8)}`;
    const regRes = await request('POST', '/api/user/register', {
      body: { phone, password: 'test123', code: '000000' }
    });
    const success = ok(regRes) && regRes.data.data?.accessToken;
    assert(`注册用户 ${names[i]} (ID: ${regRes.data.data?.userId || '?'})`, !!success);
    if (success) {
      users.push({
        id: regRes.data.data.userId,
        nickname: names[i],
        phone,
        token: regRes.data.data.accessToken,
        refreshToken: regRes.data.data.refreshToken
      });
      await request('PUT', `/api/admin/users/${regRes.data.data.userId}`, {
        body: { nickname: names[i], sex: i % 2, city: cities[i], money: 1000 + i * 100, giftMoney: 500, dec: `${names[i]}的个性签名` },
        adminAuth: true
      });
    }
  }
  return users;
}

async function loginUsers(users) {
  console.log('\n========== 阶段2：用户登录验证 ==========\n');
  for (const user of users) {
    const res = await request('POST', '/api/user/login', {
      body: { username: user.phone, password: 'test123' }
    });
    if (ok(res) && res.data.data?.accessToken) {
      user.token = res.data.data.accessToken;
      user.refreshToken = res.data.data.refreshToken;
      assert(`用户 ${user.nickname} 登录成功`, true);
    } else {
      assert(`用户 ${user.nickname} 登录`, false, JSON.stringify(res.data).slice(0, 100));
    }
  }
  return users.filter(u => u.token);
}

async function testUserBasics(users) {
  console.log('\n========== 阶段3：用户基础功能测试 ==========\n');
  const u0 = users[0], u1 = users[1];

  const infoRes = await request('GET', '/api/user/get', { token: u0.token });
  assert('获取用户信息', ok(infoRes) && !!infoRes.data.data?.nickname);

  const updateRes = await request('POST', '/api/user/update', {
    token: u0.token, body: { nickname: '小明改名', dec: '新的个性签名', city: '北京' }
  });
  assert('更新用户资料', ok(updateRes));

  const followRes = await request('POST', '/api/user/follow', {
    token: u0.token, body: { targetUserId: u1.id }
  });
  assert(`用户${u0.nickname}关注${u1.nickname}`, ok(followRes));

  const checkRes = await request('GET', `/api/user/check-follow?userId=${u1.id}`, { token: u0.token });
  assert('检查关注状态', ok(checkRes));

  const fansRes = await request('GET', '/api/user/fans', { token: u1.token });
  assert('获取粉丝列表', ok(fansRes));

  const followsRes = await request('GET', '/api/user/follows', { token: u0.token });
  assert('获取关注列表', ok(followsRes));

  const visitRes = await request('POST', '/api/user/visit', {
    token: u0.token, body: { targetUserId: u1.id }
  });
  assert('记录用户访问', ok(visitRes));

  const visitorsRes = await request('GET', '/api/user/visitors', { token: u1.token });
  assert('获取来访记录', ok(visitorsRes));

  const prefSaveRes = await request('POST', '/api/user/pref', {
    token: u0.token, body: { data: JSON.stringify({ theme: 'dark', music: true }) }
  });
  assert('保存用户偏好', ok(prefSaveRes));

  const prefGetRes = await request('GET', '/api/user/pref', { token: u0.token });
  assert('获取用户偏好', ok(prefGetRes));
}

async function testCircle(users) {
  console.log('\n========== 阶段4：圈子/帖子功能测试 ==========\n');
  const u0 = users[0], u1 = users[1], u2 = users[2];

  const tagsRes = await request('GET', '/api/circle/tags');
  assert('获取帖子标签', ok(tagsRes));

  const postRes = await request('POST', '/api/circle/create', {
    token: u0.token, body: { content: '这是测试帖子，大家好！', images: [], tagId: 1 }
  });
  assert('创建帖子', ok(postRes) && !!(postRes.data.data?.id || postRes.data.data?.postId), errDetail(postRes));
  const postId = postRes.data.data?.id || postRes.data.data?.postId;

  const postsRes = await request('GET', '/api/circle/posts?page=1&pageSize=10', { token: u1.token });
  assert('获取帖子列表', ok(postsRes));

  if (postId) {
    const detailRes = await request('GET', `/api/circle/post/${postId}`, { token: u1.token });
    assert('获取帖子详情', ok(detailRes));

    const likeRes = await request('POST', '/api/circle/like', { token: u1.token, body: { postId } });
    assert('点赞帖子', ok(likeRes));

    const commentRes = await request('POST', '/api/circle/comment', {
      token: u1.token, body: { postId, content: '写得不错！' }
    });
    assert('评论帖子', ok(commentRes));

    const shareRes = await request('POST', '/api/circle/share', { token: u2.token, body: { postId } });
    assert('分享帖子', ok(shareRes));
  }

  const myPostsRes = await request('GET', '/api/circle/my-posts', { token: u0.token });
  assert('获取我的帖子', ok(myPostsRes));

  const post2Res = await request('POST', '/api/circle/create', {
    token: u1.token, body: { content: '小红的帖子，一起来玩吧！', images: [] }
  });
  assert('用户2创建帖子', ok(post2Res));
}

async function testChat(users) {
  console.log('\n========== 阶段5：聊天功能测试 ==========\n');
  const u0 = users[0], u1 = users[1];

  const msg1 = await request('POST', '/api/chat/send', {
    token: u0.token, body: { targetUserId: u1.id, content: '你好，我是小明！', type: 0 }
  });
  assert('发送文本消息', ok(msg1));

  const msg2 = await request('POST', '/api/chat/send', {
    token: u1.token, body: { targetUserId: u0.id, content: '你好小明，我是小红！', type: 0 }
  });
  assert('接收并回复消息', ok(msg2));

  const chatListRes = await request('GET', '/api/chat/list', { token: u0.token });
  assert('获取聊天列表', ok(chatListRes));

  const messagesRes = await request('GET', `/api/chat/messages?targetUserId=${u1.id}&page=1&pageSize=20`, { token: u0.token });
  assert('获取聊天记录', ok(messagesRes), errDetail(messagesRes));

  const markReadRes = await request('POST', '/api/chat/mark-read', {
    token: u0.token, body: { targetUserId: u1.id }
  });
  assert('标记消息已读', ok(markReadRes), errDetail(markReadRes));
}

async function testGift(users) {
  console.log('\n========== 阶段6：礼物功能测试 ==========\n');
  const u0 = users[0], u1 = users[1];

  const giftListRes = await request('GET', '/api/gift/list');
  assert('获取礼物列表', ok(giftListRes));
  const gifts = giftListRes.data.data;

  if (gifts && gifts.length > 0) {
    const sendGiftRes = await request('POST', '/api/gift/send', {
      token: u0.token, body: { receiverId: u1.id, giftId: gifts[0].giftId, count: 1 }
    });
    assert(`送礼物 (${gifts[0].name || gifts[0].giftId})`, ok(sendGiftRes), errDetail(sendGiftRes));
  }

  const bagRes = await request('GET', '/api/gift/bag', { token: u1.token });
  assert('获取礼物背包', ok(bagRes));

  const redPktRes = await request('POST', '/api/gift/redpacket/send', {
    token: u0.token, body: { receiverId: u1.id, totalAmount: 10, totalNum: 1, greeting: '测试红包' }
  });
  assert('发红包', ok(redPktRes), errDetail(redPktRes));

  const redPktHistRes = await request('GET', '/api/gift/redpacket/history?page=1&pageSize=10', { token: u0.token });
  assert('获取红包记录', ok(redPktHistRes));
}

async function testWallet(users) {
  console.log('\n========== 阶段7：钱包功能测试 ==========\n');
  const u0 = users[0];

  const overviewRes = await request('GET', '/api/wallet/overview', { token: u0.token });
  assert('获取钱包概览', ok(overviewRes));

  const incomeRes = await request('GET', '/api/wallet/income-records?page=1&pageSize=10', { token: u0.token });
  assert('获取收入记录', ok(incomeRes));

  const expenseRes = await request('GET', '/api/wallet/expense-records?page=1&pageSize=10', { token: u0.token });
  assert('获取支出记录', ok(expenseRes));

  const balanceRes = await request('GET', '/api/pay/wallet/balance', { token: u0.token });
  assert('查询余额', ok(balanceRes));

  const packagesRes = await request('GET', '/api/pay/packages');
  assert('获取充值套餐', ok(packagesRes));

  const payHistRes = await request('GET', '/api/pay/payment/history?page=1&pageSize=10', { token: u0.token });
  assert('获取支付记录', ok(payHistRes));
}

async function testReserve(users) {
  console.log('\n========== 阶段8：预约功能测试 ==========\n');
  const u0 = users[0], u1 = users[1];

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];

  const slotsRes = await request('GET', `/api/reserve/slots?companionId=${u1.id}&date=${dateStr}`, { token: u0.token });
  assert('查看可用时段', ok(slotsRes));

  const batchRes = await request('POST', '/api/reserve/slots/batch', {
    token: u1.token, body: { gameId: 1, slots: [
      { date: dateStr, time: '09:00' },
      { date: dateStr, time: '10:00' },
      { date: dateStr, time: '14:00' },
      { date: dateStr, time: '15:00' }
    ] }
  });
  assert('创建可用时段', ok(batchRes), errDetail(batchRes));

  const reserveRes = await request('POST', '/api/reserve/create', {
    token: u0.token, body: { companionId: u1.id, date: dateStr, time: '10:00', remark: '想一起打游戏' }
  });
  assert('创建预约', ok(reserveRes), errDetail(reserveRes));
  const reserveId = reserveRes.data.data?.id;

  const listRes = await request('GET', '/api/reserve/list?page=1&pageSize=10', { token: u0.token });
  assert('获取预约列表', ok(listRes));

  if (reserveId) {
    const detailRes = await request('GET', `/api/reserve/detail?id=${reserveId}`, { token: u0.token });
    assert('获取预约详情', ok(detailRes));

    const confirmRes = await request('POST', '/api/reserve/confirm', {
      token: u1.token, body: { id: reserveId }
    });
    assert('确认预约', ok(confirmRes));
  }
}

async function testDemand(users) {
  console.log('\n========== 阶段9：需求功能测试 ==========\n');
  const u0 = users[0];

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];

  const demandRes = await request('POST', '/api/demand/create', {
    token: u0.token, body: { serviceType: 'entertainment', game: '电影', date: dateStr, startTime: '14:00', endTime: '16:00', duration: 2, budget: 100 }
  });
  assert('发布需求', ok(demandRes));

  const demandListRes = await request('GET', '/api/demand/list?page=1&pageSize=10', { token: u0.token });
  assert('获取需求列表', ok(demandListRes));
}

async function testGames(users) {
  console.log('\n========== 阶段10：游戏陪玩功能测试 ==========\n');
  const u1 = users[1];

  const catRes = await request('GET', '/api/games/categories');
  assert('获取游戏分类', ok(catRes));

  const compRes = await request('GET', '/api/games/companions?page=1&pageSize=10');
  assert('获取陪玩列表', ok(compRes));

  const applyRes = await request('POST', '/api/games/apply', {
    token: u1.token, body: { gameId: 1, price: 50, description: '专业陪玩，技术过硬' }
  });
  assert('申请成为陪玩', ok(applyRes));

  const applyStatusRes = await request('GET', '/api/games/apply/status', { token: u1.token });
  assert('查询申请状态', ok(applyStatusRes));
}

async function testVip(users) {
  console.log('\n========== 阶段11：VIP功能测试 ==========\n');
  const u0 = users[0];

  const pkgRes = await request('GET', '/api/vip/packages');
  assert('获取VIP套餐', ok(pkgRes));

  const vipInfoRes = await request('GET', '/api/vip/info', { token: u0.token });
  assert('获取用户VIP信息', ok(vipInfoRes));

  const ordersRes = await request('GET', '/api/vip/orders?page=1&pageSize=10', { token: u0.token });
  assert('获取VIP订单列表', ok(ordersRes));
}

async function testSearch(users) {
  console.log('\n========== 阶段12：搜索功能测试 ==========\n');
  const u0 = users[0];

  const hotRes = await request('GET', '/api/search/hot');
  assert('获取热门搜索', ok(hotRes));

  const postSearchRes = await request('GET', '/api/search/posts?keyword=测试&page=1&pageSize=10', { token: u0.token });
  assert('搜索帖子', ok(postSearchRes));
}

async function testFeedbackReport(users) {
  console.log('\n========== 阶段13：反馈与举报测试 ==========\n');
  const u0 = users[0], u1 = users[1];

  const fbRes = await request('POST', '/api/feedback/submit', {
    token: u0.token, body: { content: '这个App很好用，建议增加夜间模式', type: 'suggestion', contact: '13800000000' }
  });
  assert('提交意见反馈', ok(fbRes));

  const myFbRes = await request('GET', '/api/feedback/my', { token: u0.token });
  assert('获取我的反馈', ok(myFbRes));

  const reportRes = await request('POST', '/api/report', {
    token: u0.token, body: { targetId: u1.id, targetType: 'user', reason: '测试举报', description: '这是测试举报内容' }
  });
  assert('提交举报', ok(reportRes));

  const reportListRes = await request('GET', '/api/report/list?page=1&pageSize=10', { token: u0.token });
  assert('获取举报列表', ok(reportListRes));
}

async function testPublicApis(users) {
  console.log('\n========== 阶段14：公共接口测试 ==========\n');
  const u0 = users[0];

  const bannerRes = await request('GET', '/api/banner/list');
  assert('获取Banner列表', ok(bannerRes));

  const splashRes = await request('GET', '/api/splash/active');
  assert('获取开屏广告', ok(splashRes));

  const configRes = await request('GET', '/api/config/home');
  assert('获取首页配置', ok(configRes));

  const noticeRes = await request('GET', '/api/notice/list');
  assert('获取公告列表', ok(noticeRes));

  const downloadRes = await request('GET', '/api/download/platforms');
  assert('获取下载平台', ok(downloadRes));

  const provinceRes = await request('GET', '/api/region/provinces');
  assert('获取省份列表', ok(provinceRes));

  const peerRes = await request('GET', '/api/p2p/peer-online?peerId=1', { token: u0.token });
  assert('P2P在线检测', ok(peerRes), errDetail(peerRes));
}

async function testAlbum(users) {
  console.log('\n========== 阶段15：相册功能测试 ==========\n');
  const u0 = users[0];

  const photosRes = await request('GET', `/api/album/photos?userId=${u0.id}`, { token: u0.token });
  assert('获取相册照片列表', ok(photosRes));
}

async function testRealName(users) {
  console.log('\n========== 阶段16：实名认证测试 ==========\n');
  const u0 = users[0];

  const statusRes = await request('GET', '/api/user/real-name', { token: u0.token });
  assert('获取实名认证状态', ok(statusRes));

  const realNameRes = await request('POST', '/api/user/real-name', {
    token: u0.token, body: { realName: '张测试', idCard: '110101199001011234', front: 'https://example.com/front.jpg', back: 'https://example.com/back.jpg' }
  });
  assert('提交实名认证', ok(realNameRes));
}

async function testTokenRefresh(users) {
  console.log('\n========== 阶段17：Token刷新测试 ==========\n');
  const u0 = users[0];

  const loginRes = await request('POST', '/api/user/login', {
    body: { username: u0.phone, password: 'test123' }
  });
  if (ok(loginRes) && loginRes.data.data?.refreshToken) {
    const refreshRes = await request('POST', '/api/user/refresh-token', {
      body: { refreshToken: loginRes.data.data.refreshToken }
    });
    assert('刷新Token', ok(refreshRes) && !!refreshRes.data.data?.accessToken);
  } else {
    assert('刷新Token（跳过-无refreshToken）', true);
  }
}

async function main() {
  console.log('========================================');
  console.log('  eu搭子后端 - 全功能自动化测试');
  console.log('========================================');

  try {
    let users = await createUsers();
    console.log(`\n成功注册 ${users.length} 个用户`);

    users = await loginUsers(users);
    console.log(`\n成功登录 ${users.length} 个用户`);

    if (users.length < 2) {
      console.log('\n❌ 可用用户不足2个，无法继续测试');
      return;
    }

    await testUserBasics(users);
    await testCircle(users);
    await testChat(users);
    await testGift(users);
    await testWallet(users);
    await testReserve(users);
    await testDemand(users);
    await testGames(users);
    await testVip(users);
    await testSearch(users);
    await testFeedbackReport(users);
    await testPublicApis(users);
    await testAlbum(users);
    await testRealName(users);
    await testTokenRefresh(users);

  } catch (err) {
    console.error('\n💥 测试过程发生异常:', err.message);
  }

  console.log('\n========================================');
  console.log('  测试结果汇总');
  console.log('========================================');
  console.log(`  总计: ${stats.total}`);
  console.log(`  通过: ${stats.passed} ✅`);
  console.log(`  失败: ${stats.failed} ❌`);
  console.log(`  通过率: ${(stats.passed / stats.total * 100).toFixed(1)}%`);
  if (stats.errors.length > 0) {
    console.log('\n  失败项:');
    stats.errors.forEach(e => console.log(`    - ${e}`));
  }
  console.log('========================================\n');
}

main();
