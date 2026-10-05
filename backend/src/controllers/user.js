const { authService, smsService, levelService, skinService } = require('../services');
const { User, Post, PostLike, UserFollow, UserVisit, UserPref } = require('../models');
const { Op } = require('sequelize');
const response = require('../utils/response');
const logger = require('../utils/logger');
const { isLevelGateError, handleLevelGate } = require('../utils/levelGate');
const pii = require('../utils/pii');
const tokenRevocation = require('../services/tokenRevocation');
const { verifyToken, TOKEN_TYPES } = require('../config/jwt');
const socialPrivacy = require('../utils/socialPrivacy');

// 审计低危项：账号枚举。此前「用户不存在 / 密码错误 / 该用户未设置密码」分别返回
// 不同文案并定位到不同字段，登录接口因此成了一个「手机号是否已注册」的枚举 oracle
// （与 C-3 修掉的卡密枚举同源）。现三者统一为同一 422 与同一文案，真实失败原因只落
// 服务端日志；前端在空 fieldErrors 时回落到 message 展示，无需按字段定位。
const LOGIN_CREDENTIAL_ERRORS = new Set(['用户不存在', '密码错误', '该用户未设置密码']);

const login = async (req, res) => {
  try {
    const { username, mobile, phone, password } = req.body;
    const account = username || mobile || phone;

    if (!account || !password) {
      return response.badRequest(res, '手机号和密码不能为空');
    }

    const result = await authService.loginWithPassword(account, password);
    response.success(res, result, '登录成功');
  } catch (error) {
    logger.error('登录错误:', error);
    if (LOGIN_CREDENTIAL_ERRORS.has(error.message)) {
      return response.unprocessableEntity(res, '手机号或密码错误');
    }
    response.error(res, '登录失败');
  }
};

const register = async (req, res) => {
  try {
    const { phone, password, code } = req.body;

    if (!phone || !password || !code) {
      return response.badRequest(res, '手机号、密码和验证码不能为空');
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return response.badRequest(res, '请输入正确的手机号');
    }

    if (password.length < 6 || password.length > 16) {
      return response.badRequest(res, '密码长度6-16位');
    }

    const result = await authService.register(phone, password, `用户${phone.slice(-4)}`, code);
    response.created(res, result, '注册成功');
  } catch (error) {
    logger.error('注册错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { phone, password, code } = req.body;

    if (!phone || !password || !code) {
      return response.badRequest(res, '手机号、密码和验证码不能为空');
    }

    if (password.length < 6 || password.length > 16) {
      return response.badRequest(res, '密码长度6-16位');
    }

    // ⚠️ 必须先校验短信验证码：历史实现只接收 code 但从不校验，
    // 任何人只要知道手机号就能重置该用户密码（完整账户接管）。
    // verifyCode 校验成功后会删除验证码，天然一次性使用。
    try {
      await smsService.verifyCode(phone, code, 'reset');
    } catch (codeError) {
      const msg = codeError.message || '验证码错误或已过期';
      logger.warn(`[resetPassword] 验证码校验失败 phone=${smsService.maskMobile(phone)}: ${msg}`);
      if (msg.includes('不可用')) {
        return response.custom(res, 503, '短信服务暂不可用，请稍后重试');
      }
      return response.badRequest(res, '验证码错误或已过期');
    }

    const { User } = require('../models');
    const bcrypt = require('bcryptjs');

    const user = await User.findOne({ where: { mobile: phone } });
    if (!user) {
      return response.notFound(res, '用户不存在');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 审计 H-5：重置口令必须同时让旧会话作废——用户端鉴权不回查口令，
    // 否则「重置密码」后攻击者手里的旧令牌还能继续用满整个有效期。
    // 放在写库之前：生产拿不到吊销状态就不改密，避免出现「密码已改、旧令牌仍有效」的中间态。
    // 非生产沿用读取侧的 fail-open 取向（本地常常没有 Redis），只在响应里如实回报是否真吊销了。
    const revoked = await tokenRevocation.revokeAllUserTokens(user.id);
    if (!revoked.verifiable && tokenRevocation.revocationFailMode() === 'closed') {
      return response.serviceUnavailable(res, '登出服务暂时不可用，请稍后重试');
    }

    await user.update({ password: hashedPassword });

    response.success(res, { devicesRevoked: revoked.ok }, '密码重置成功，所有设备需重新登录');
  } catch (error) {
    logger.error('重置密码错误:', error);
    response.error(res, '密码重置失败');
  }
};

const getUserInfo = async (req, res) => {
  try {
    const targetUserId = req.query.userId || req.userId;
    const userInfo = await authService.getUserInfo(req.userId, targetUserId);
    response.success(res, userInfo);
  } catch (error) {
    logger.error('获取用户信息错误:', error);
    response.error(res, error.message);
  }
};

const updateUserInfo = async (req, res) => {
  try {
    // Lv.5 解锁个性签名：清空签名不受限，只有写入内容才需要等级
    if (String(req.body.dec ?? '').trim() !== '') {
      await levelService.requireLevel(req.userId, 'signature');
    }
    await authService.updateUserInfo(req.userId, req.body);
    response.success(res, {}, '更新成功');
  } catch (error) {
    if (isLevelGateError(error)) return handleLevelGate(res, error);
    logger.error('更新用户信息错误:', error);
    response.error(res, error.message);
  }
};

const sendSms = async (req, res) => {
  try {
    const { phone, mobile, type } = req.body;
    const phoneNumber = phone || mobile;
    // 场景决定验证码存取的 Redis key；只读校验接口也接受 type，但仅允许登录/注册/重置三类
    const scene = type && smsService.SMS_SCENES.includes(type) ? type : 'login';
    
    if (!phoneNumber || !/^1[3-9]\d{9}$/.test(phoneNumber)) {
      return response.badRequest(res, '请输入正确的手机号');
    }
    
    const result = await smsService.sendSMS(phoneNumber, scene);
    // 开发环境下返回验证码方便调试
    const responseData = result.code ? { code: result.code } : {};
    response.success(res, responseData, '发送成功');
  } catch (error) {
    logger.error('发送验证码错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const loginMobile = async (req, res) => {
  try {
    const { mobile, phone, code, deviceId, platform } = req.body;
    const mobileNumber = phone || mobile;
    
    if (!mobileNumber || !code) {
      return response.badRequest(res, '手机号和验证码不能为空');
    }
    
    const result = await authService.loginWithMobile(mobileNumber, code, deviceId, platform);
    response.success(res, result, '登录成功');
  } catch (error) {
    logger.error('手机号登录错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const loginThird = async (req, res) => {
  try {
    const { type, code, encryptedData, iv } = req.body;
    
    if (!type || !code) {
      return response.badRequest(res, '登录类型和授权码不能为空');
    }
    
    const result = await authService.loginWithThird(type, code, encryptedData, iv);
    response.success(res, result, '登录成功');
  } catch (error) {
    logger.error('第三方登录错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const follow = async (req, res) => {
  try {
    const { targetUserId, action = 1 } = req.body;
    
    if (!targetUserId) {
      return response.badRequest(res, '目标用户ID不能为空');
    }
    
    const result = await authService.followUser(req.userId, targetUserId, Number(action));
    response.success(res, result, action === 1 ? '关注成功' : '取消关注成功');
  } catch (error) {
    logger.error('关注用户错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const getFans = async (req, res) => {
  try {
    const { User, UserFollow } = require('../models');
    const { parseQuery } = require('../utils/helper');

    // 审计 M-11：粉丝/关注列表是「谁和谁有关系」的社交关系隐私，只允许本人读取——
    // 此前 `?userId=他人ID` 可让任意登录用户拉取任何人的社交关系图（前端从不传该参数）。
    const scope = socialPrivacy.resolveSelfScope(req.query.userId, req.userId);
    if (!scope.ok) {
      return scope.reason === socialPrivacy.PRIVATE_SCOPE
        ? response.forbidden(res, '无权查看他人社交关系')
        : response.badRequest(res, '用户ID格式不正确');
    }
    const userId = scope.userId;
    const { page, pageSize, offset } = parseQuery(req.query);
    
    const follows = await UserFollow.findAndCountAll({
      where: { following_id: userId },
      offset,
      limit: pageSize,
      order: [['create_time', 'DESC']]
    });
    
    const fans = await Promise.all(follows.rows.map(async (follow) => {
      const user = await User.findByPk(follow.follower_id);
      const isFollow = await UserFollow.findOne({
        where: { follower_id: req.userId, following_id: follow.follower_id }
      });
      
      return {
        userId: user?.id,
        nickname: user?.nickname || '',
        avatar: user?.avatar || '',
        level: user?.lv || 1,
        isFollow: !!isFollow
      };
    }));
    
    response.success(res, {
      total: follows.count,
      list: fans
    });
  } catch (error) {
    logger.error('获取粉丝列表错误:', error);
    response.error(res, error.message);
  }
};

const getFollows = async (req, res) => {
  try {
    const { User, UserFollow } = require('../models');
    const { parseQuery } = require('../utils/helper');

    // 审计 M-11：同 getFans——关注列表只允许本人读取，拒绝跨用户社交关系查询。
    const scope = socialPrivacy.resolveSelfScope(req.query.userId, req.userId);
    if (!scope.ok) {
      return scope.reason === socialPrivacy.PRIVATE_SCOPE
        ? response.forbidden(res, '无权查看他人社交关系')
        : response.badRequest(res, '用户ID格式不正确');
    }
    const userId = scope.userId;
    const { page, pageSize, offset } = parseQuery(req.query);
    
    const follows = await UserFollow.findAndCountAll({
      where: { follower_id: userId },
      offset,
      limit: pageSize,
      order: [['create_time', 'DESC']]
    });
    
    const list = await Promise.all(follows.rows.map(async (follow) => {
      const user = await User.findByPk(follow.following_id);
      const isFollow = await UserFollow.findOne({
        where: { follower_id: req.userId, following_id: follow.following_id }
      });
      
      return {
        userId: user?.id,
        nickname: user?.nickname || '',
        avatar: user?.avatar || '',
        level: user?.lv || 1,
        isFollow: !!isFollow
      };
    }));

    response.success(res, {
      total: follows.count,
      list
    });
  } catch (error) {
    logger.error('获取关注列表错误:', error);
    response.error(res, error.message);
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken: refreshTokenStr } = req.body;
    
    if (!refreshTokenStr) {
      return response.badRequest(res, 'refresh token不能为空');
    }
    
    const result = await authService.refreshToken(refreshTokenStr);
    response.success(res, result, '刷新token成功');
  } catch (error) {
    logger.error('刷新token错误:', error);
    if (error.message === '无效的refresh token' || error.message === 'refresh token不能为空') {
      response.unprocessableEntity(res, error.message);
    } else if (error.message === 'REFRESH_REVOKED') {
      // 审计 H-5：本人已在别处「全端下线」或这枚 refresh 已被登出，必须重新登录
      response.unauthorized(res, '登录状态已失效，请重新登录');
    } else if (error.message === 'REVOCATION_UNAVAILABLE') {
      response.serviceUnavailable(res, '认证服务暂时不可用，请稍后重试');
    } else {
      response.error(res, '刷新token失败');
    }
  }
};

// 审计 H-5：此前全站没有登出接口，前端「退出登录」只清 localStorage，
// 令牌在剩余有效期内（默认 7 天）依然可以直接打接口——被盗的令牌不会因为用户登出而失效。
const logout = async (req, res) => {
  try {
    const results = [await tokenRevocation.revokeToken(req.token)];

    const refreshTokenStr = (req.body || {}).refreshToken;
    if (refreshTokenStr) {
      const decodedRefresh = verifyToken(refreshTokenStr, [TOKEN_TYPES.REFRESH]);
      // 只吊销本人的 refresh：不加这层归属判断，任何人送别人的令牌就能定向替对方登出
      if (decodedRefresh && Number(decodedRefresh.userId) === Number(req.userId)) {
        results.push(await tokenRevocation.revokeToken(refreshTokenStr));
      }
    }

    // 用户端登录响应里本来就会下发 refreshToken，但 C 端 SPA 从不保存它（也没有刷新链路），
    // 于是「只拉黑 access」会留下一枚 30 天内还能换新令牌的孤儿凭据。C 端登出因此带上
    // logoutAllDevices：改走水位线，把该用户此刻之前的全部令牌（含 refresh）一次作废。
    if ((req.body || {}).logoutAllDevices) {
      results.push(await tokenRevocation.revokeAllUserTokens(req.userId));
    }

    // 与读取侧同一取向：生产无法确认吊销即 503（不能声称「已登出」），
    // 非生产 fail-open 让流程走完，但用 serverRevoked 如实回报，前端据此清本地态。
    if (results.some((item) => !item.verifiable)) {
      if (tokenRevocation.revocationFailMode() === 'closed') {
        return response.serviceUnavailable(res, '登出服务暂时不可用，请稍后重试');
      }
      logger.warn('[logout] 吊销状态无法确认，按 fail-open 返回登出成功');
    }

    response.success(res, {
      clientShouldClearToken: true,
      serverRevoked: results.every((item) => item.ok)
    }, '已登出');
  } catch (error) {
    logger.error('登出错误:', error);
    response.error(res, '登出失败');
  }
};

const checkFollow = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return response.badRequest(res, '用户ID不能为空');
    }

    const isFollow = await UserFollow.findOne({
      where: { follower_id: req.userId, following_id: parseInt(userId) }
    });

    response.success(res, { isFollowing: !!isFollow });
  } catch (error) {
    logger.error('检查关注状态错误:', error);
    response.error(res, error.message);
  }
};

const submitRealName = async (req, res) => {
  try {
    const { realName, idCard, front, back } = req.body;
    if (!realName || !idCard || !front || !back) {
      return response.badRequest(res, '姓名、身份证号及正反面照片不能为空');
    }
    if (!/^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/.test(String(idCard))) {
      return response.badRequest(res, '身份证号格式不正确');
    }
    const user = await User.findByPk(req.userId);
    if (!user) {
      return response.error(res, '用户不存在');
    }
    await user.update({
      // 审计 M-8：实名敏感字段静态加密后落库（密钥见 utils/pii.js；生产缺失密钥时启动即被拒绝）
      real_name: pii.encryptField(realName),
      id_card: pii.encryptField(idCard),
      real_name_front: pii.encryptField(front),
      real_name_back: pii.encryptField(back),
      real_name_status: 1,
      real_name_time: Math.floor(Date.now() / 1000)
    });
    response.success(res, { status: 1 }, '认证信息已提交，等待审核');
  } catch (error) {
    logger.error('实名认证提交错误:', error);
    response.error(res, error.message);
  }
};

const getRealNameStatus = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) {
      return response.error(res, '用户不存在');
    }
    const maskName = (v) => (v ? String(v).replace(/.(?=.{1})/g, '*') : '');
    const maskIdCard = (v) => (v ? String(v).replace(/^(.{3}).*(.{4})$/, '$1***********$2') : '');
    response.success(res, {
      status: user.real_name_status || 0,
      // 审计 M-8：先解密再脱敏；存量明文行 decryptField 原样返回，行为与历史一致
      realName: maskName(pii.decryptField(user.real_name)),
      idCard: maskIdCard(pii.decryptField(user.id_card)),
      time: user.real_name_time || 0
    });
  } catch (error) {
    logger.error('查询实名状态错误:', error);
    response.error(res, error.message);
  }
};

// 批量回填「我是否已关注此人」，避免前端关注态恒为 false
const attachFollowingState = async (list, currentUserId) => {
  const ids = [...new Set(list.map(item => item.userId).filter(Boolean))];
  if (!ids.length) {
    return list.map(item => ({ ...item, isFollowed: false }));
  }
  const rows = await UserFollow.findAll({
    where: { follower_id: currentUserId, following_id: { [Op.in]: ids } },
    attributes: ['following_id']
  });
  const followedIds = new Set(rows.map(r => r.following_id));
  return list.map(item => ({ ...item, isFollowed: followedIds.has(item.userId) }));
};

// 点赞记录：谁赞过我的动态
const getLikes = async (req, res) => {
  try {
    const posts = await Post.findAll({ where: { user_id: req.userId }, attributes: ['id'] });
    const postIds = posts.map(p => p.id);
    if (!postIds.length) {
      return response.success(res, { list: [], total: 0 });
    }
    const likes = await PostLike.findAll({
      where: { post_id: { [Op.in]: postIds } },
      order: [['create_time', 'DESC']],
      limit: 200
    });
    const userIds = [...new Set(likes.map(l => l.user_id))];
    const users = userIds.length
      ? await User.findAll({ where: { id: { [Op.in]: userIds } }, attributes: ['id', 'nickname', 'avatar'] })
      : [];
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    const rawList = likes.map(l => ({
      userId: l.user_id,
      nickname: userMap[l.user_id]?.nickname || '',
      avatar: userMap[l.user_id]?.avatar || '',
      postId: l.post_id,
      time: l.create_time
    }));
    const list = await attachFollowingState(rawList, req.userId);
    response.success(res, { list, total: list.length });
  } catch (error) {
    logger.error('获取点赞记录错误:', error);
    response.error(res, error.message);
  }
};

// 访客记录：谁访问过我的主页
const getVisitors = async (req, res) => {
  try {
    const visits = await UserVisit.findAll({
      where: { user_id: req.userId },
      order: [['create_time', 'DESC']],
      limit: 100
    });
    const visitorIds = [...new Set(visits.map(v => v.visitor_id))];
    const users = visitorIds.length
      ? await User.findAll({ where: { id: { [Op.in]: visitorIds } }, attributes: ['id', 'nickname', 'avatar'] })
      : [];
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    const rawList = visits.map(v => ({
      userId: v.visitor_id,
      nickname: userMap[v.visitor_id]?.nickname || '',
      avatar: userMap[v.visitor_id]?.avatar || '',
      time: v.create_time
    }));
    const list = await attachFollowingState(rawList, req.userId);
    response.success(res, { list, total: list.length });
  } catch (error) {
    logger.error('获取访客记录错误:', error);
    response.error(res, error.message);
  }
};

// 记录一次主页访问（同访问者去重，更新最近时间）
const recordVisit = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) {
      return response.badRequest(res, '目标用户ID不能为空');
    }
    const targetId = parseInt(targetUserId);
    if (targetId === req.userId) {
      return response.success(res, {}, 'ok');
    }
    const now = Math.floor(Date.now() / 1000);
    const exist = await UserVisit.findOne({ where: { user_id: targetId, visitor_id: req.userId } });
    if (exist) {
      await exist.update({ create_time: now });
    } else {
      await UserVisit.create({ user_id: targetId, visitor_id: req.userId, create_time: now });
    }
    response.success(res, {}, 'ok');
  } catch (error) {
    logger.error('记录访问错误:', error);
    response.error(res, error.message);
  }
};

// ===== 等级与经验 =====
const getLevelInfo = async (req, res) => {
  try {
    const data = await levelService.getInfo(req.userId);
    response.success(res, data);
  } catch (error) {
    logger.error('获取等级信息错误:', error);
    response.error(res, '获取等级信息失败');
  }
};

const checkIn = async (req, res) => {
  try {
    const data = await levelService.checkIn(req.userId);
    response.success(res, data, '签到成功');
  } catch (error) {
    if (error.message === '今日已签到') {
      return response.unprocessableEntity(res, error.message);
    }
    logger.error('签到错误:', error);
    response.error(res, '签到失败');
  }
};

// 只在请求真正「开启」该权益时校验等级：
// 关闭隐身、纯保存偏好都不该被门槛挡住。
// 审计 H-6：skin_shop 的判定不再出现在这里——它由 POST /api/user/skins/purchase 无条件校验，
// 因为改造前这里写的是 `data.skinShop && spendNum > 0`，客户端只要把 spend 传 0 就同时绕过了扣费和门槛。
const benefitsRequested = (data) => {
  const keys = [];
  if (!data || typeof data !== 'object') return keys;
  if (data.stealthSettings && data.stealthSettings.stealth === true) keys.push('stealth_visit');
  if (data.selectedBadge) keys.push('identity_badge');
  if (data.priorityMatchingSettings) keys.push('priority_matching');
  return keys;
};

// 审计 H-6：装扮所有权是服务端事实，通用偏好接口不再接受客户端提交的 skinShop 快照。
const stripUntrustedPref = (data) => {
  if (!data || typeof data !== 'object') return {};
  const clone = { ...data };
  delete clone[skinService.STATE_KEY];
  return clone;
};

// spend 字段已废弃：只容忍旧客户端显式传 0（保持兼容），任何非 0 值都直接 422 指路到新接口。
const rejectedSpend = (spend) => {
  if (spend === undefined || spend === null || spend === '') return null;
  const num = Number(spend);
  if (Number.isFinite(num) && num === 0) return null;
  return '扣款金额不再由客户端决定，请改调 POST /api/user/skins/purchase';
};

// ===== 用户偏好/装扮数据（服务端持久化，替代纯前端 localStorage） =====
const getPref = async (req, res) => {
  try {
    const row = await UserPref.findOne({ where: { user_id: req.userId } });
    let data = {};
    if (row && row.data) {
      try { data = JSON.parse(row.data); } catch (e) { data = {}; }
    }
    // 装扮状态改由 GET /api/user/skins 提供（目录 + 所有权 + 余额），这里不再回传 skinShop
    response.success(res, { data: stripUntrustedPref(data) });
  } catch (error) {
    logger.error('获取用户偏好错误:', error);
    response.error(res, error.message);
  }
};

const savePref = async (req, res) => {
  try {
    const { data, spend } = req.body;
    const spendMessage = rejectedSpend(spend);
    if (spendMessage) {
      return response.unprocessableEntity(res, spendMessage, { spend: [spendMessage] });
    }
    const safeData = stripUntrustedPref(data);
    const now = Math.floor(Date.now() / 1000);
    const sequelize = require('../config/mysql');

    for (const benefit of benefitsRequested(safeData)) {
      await levelService.requireLevel(req.userId, benefit);
    }

    // 审计 B-04 的条件扣款已整体移入 skinService.purchase（金额取自服务端目录，
    // 扣款与所有权写入同生共死）；这里只剩纯偏好读写，仍在事务内做读-改-写避免并发覆盖。
    const transaction = await sequelize.transaction();
    try {
      const row = await UserPref.findOne({ where: { user_id: req.userId }, transaction });
      let merged = {};
      if (row && row.data) {
        try { merged = JSON.parse(row.data) || {}; } catch (e) { merged = {}; }
      }
      // 审计 H-6：以服务端持有的 skinShop 为准，客户端快照不参与合并
      if (merged[skinService.STATE_KEY]) {
        merged[skinService.STATE_KEY] = skinService.sanitizeState(merged[skinService.STATE_KEY]);
      }
      Object.assign(merged, safeData);
      const payload = JSON.stringify(merged);
      if (row) {
        await row.update({ data: payload, update_time: now }, { transaction });
      } else {
        await UserPref.create({ user_id: req.userId, data: payload, update_time: now }, { transaction });
      }
      await transaction.commit();
    } catch (txError) {
      if (transaction.finished !== 'commit') {
        try { await transaction.rollback(); } catch (rollbackError) { /* 已回滚 */ }
      }
      throw txError;
    }
    response.success(res, {}, '已保存');
  } catch (error) {
    if (isLevelGateError(error)) return handleLevelGate(res, error);
    logger.error('保存用户偏好错误:', error);
    response.error(res, error.message);
  }
};

// ===== 装扮商城（审计 H-6：目录、价格、所有权、扣款全部服务端化） =====
const publicSkin = (skin) => ({
  id: skin.id,
  type: skin.type,
  name: skin.name,
  price: Number(skin.price) || 0,
  vipLevel: Number(skin.vipLevel) || 0
});

const skinFailure = (res, error, label) => {
  if (isLevelGateError(error)) return handleLevelGate(res, error);
  if (skinService.isBusinessError(error)) {
    return response.unprocessableEntity(res, error.message, { skin: [error.code] });
  }
  logger.error(`${label}错误:`, error);
  return response.error(res, `${label}失败`);
};

const listSkins = async (req, res) => {
  try {
    response.success(res, await skinService.listForUser(req.userId));
  } catch (error) {
    logger.error('获取装扮列表错误:', error);
    response.error(res, '获取装扮列表失败');
  }
};

const purchaseSkin = async (req, res) => {
  try {
    const { skinId } = req.body;
    if (!skinId || typeof skinId !== 'string') {
      return response.badRequest(res, '缺少 skinId');
    }
    const result = await skinService.purchase(req.userId, skinId);
    response.success(res, {
      skin: publicSkin(result.skin),
      charged: result.charged,
      alreadyOwned: result.alreadyOwned,
      balance: result.balance
    }, result.charged > 0 ? '购买成功' : '已获得');
  } catch (error) {
    return skinFailure(res, error, '购买装扮');
  }
};

const useSkin = async (req, res) => {
  try {
    const { skinId } = req.body;
    if (!skinId || typeof skinId !== 'string') {
      return response.badRequest(res, '缺少 skinId');
    }
    const result = await skinService.use(req.userId, skinId);
    response.success(res, {
      skin: publicSkin(result.skin),
      charged: result.charged,
      balance: result.balance
    }, '已切换');
  } catch (error) {
    return skinFailure(res, error, '切换装扮');
  }
};

module.exports = {
  login,
  register,
  resetPassword,
  getUserInfo,
  updateUserInfo,
  sendSms,
  loginMobile,
  loginThird,
  follow,
  getFans,
  getFollows,
  checkFollow,
  refreshToken,
  logout,
  submitRealName,
  getRealNameStatus,
  getLikes,
  getVisitors,
  recordVisit,
  getPref,
  savePref,
  listSkins,
  purchaseSkin,
  useSkin,
  getLevelInfo,
  checkIn
};
