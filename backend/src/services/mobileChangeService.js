const sequelize = require('../config/mysql');
const config = require('../config');
const { User } = require('../models');
const smsService = require('./smsService');
const tokenRevocation = require('./tokenRevocation');
const { buildMobileWhere, decryptMobile, mobileFields } = require('../utils/mobile');
const logger = require('../utils/logger');

// P1-8：换绑手机号。
//
// 为什么单独一个服务而不是塞进 authService：换号要同时写 mobile/mobile_hash（PII 加密 + 盲索引）
// 并吊销全部会话，和 authService 里的登录/注册改动面不重叠；控制器直接 require 本文件
// （与 controllers/user.js 里 tokenRevocation / blockService 的直接引用同一风格）。
//
// 安全口径（与 K 系列已收口的不变量对齐）：
//   1) 旧号、新号各一个独立短信场景（bind_old / bind_new）——历史实现三类共用 key，
//      登录码可直接当重置码用；换号更不能让「旧号码」收到的码去校验「新号码」。
//   2) 旧号由服务端从当前账号解密后取，客户端只能「可选地」回传旧号用于一致性校验，
//      不能借请求体替换成别人的号码来收码。
//   3) 新号唯一性一律走 mobile_hash 盲索引（buildMobileWhere），不能按明文查。
//   4) 换号成功必须吊销该账号全部会话（access + refresh）并让前端重新登录：
//      手机号往往是找回密码的凭据，换号后旧令牌仍然有效等于留了一个后门。
const SCENE_OLD = 'bind_old';
const SCENE_NEW = 'bind_new';

const MOBILE_PATTERN = /^1[3-9]\d{9}$/;

// 业务错误：带 code 便于控制器映射 HTTP 状态码；非业务错误（数据库/未知异常）继续上抛成 500
const businessError = (message, code) => {
  const error = new Error(message);
  error.isBusinessError = true;
  error.code = code;
  return error;
};

const isBusinessError = (error) => Boolean(error && error.isBusinessError);

const maskMobile = (mobile) => smsService.maskMobile(mobile);

// 当前账号的真实手机号：只用于「给旧号发码 / 校验旧号验证码」，不写日志、不回传明文。
// 解密切换期失败时按「未绑定」处理——宁可拒绝换号，也不能把空号当旧号发码。
const readCurrentMobile = (user) => {
  try {
    return String(decryptMobile(user && user.mobile) || '').trim();
  } catch (error) {
    logger.warn('[ChangeMobile] 当前手机号解密失败，按未绑定处理');
    return '';
  }
};

const requireUser = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw businessError('用户不存在', 'USER_NOT_FOUND');
  }
  return user;
};

const normalizeNewMobile = (newPhone) => {
  const phone = String(newPhone === null || newPhone === undefined ? '' : newPhone).trim();
  if (!MOBILE_PATTERN.test(phone)) {
    throw businessError('请输入正确的新手机号', 'INVALID_MOBILE');
  }
  return phone;
};

const findMobileOwner = (mobile) => User.findOne({ where: buildMobileWhere(mobile) });

// 新号占用校验：允许命中自己（幂等重试），命中他人即拒绝。
// 明文手机号不落日志；错误文案只说明「已被占用」，不暴露对方账号信息。
const assertMobileAvailable = async (mobile, userId) => {
  const owner = await findMobileOwner(mobile);
  if (owner && Number(owner.id) !== Number(userId)) {
    throw businessError('该手机号已被其他账号绑定', 'MOBILE_TAKEN');
  }
};

// 发码失败映射：区分「短信服务不可用」（503）/「限流」（429）/ 其它发送失败（422）
const smsSendFailure = (error) => {
  const message = (error && error.message) || '';
  if (message.includes('不可用')) {
    return businessError('短信服务暂不可用，请稍后重试', 'SMS_UNAVAILABLE');
  }
  if (message.includes('频繁')) {
    return businessError(message, 'SMS_RATE_LIMITED');
  }
  return businessError(message && message.length <= 40 ? message : '验证码发送失败，请稍后重试', 'SMS_SEND_FAILED');
};

// 一次请求同时发送旧号/新号两个验证码：
// 两个场景各自独立 key，但只消耗一次 smsLimiter 的 IP 额度（/api/user/change-mobile/send-code 挂 smsLimiter），
// 不会出现「第一次请求成功、第二次被 1 分钟 IP 限流拒绝」的半成品状态。
const sendChangeCode = async (userId, { oldPhone, newPhone } = {}) => {
  const phone = normalizeNewMobile(newPhone);
  const user = await requireUser(userId);
  const current = readCurrentMobile(user);

  if (!current) {
    throw businessError('当前账号未绑定手机号，暂时无法更换', 'MOBILE_NOT_BOUND');
  }
  if (oldPhone && String(oldPhone).trim() !== current) {
    throw businessError('原手机号与当前绑定号不一致', 'OLD_MOBILE_MISMATCH');
  }
  if (phone === current) {
    throw businessError('新手机号不能与当前手机号相同', 'SAME_MOBILE');
  }
  // 不在发码阶段查占用：否则任何登录用户可借「发码」接口 1 次/分钟探测任意号码是否已注册
  // （账号枚举 oracle）。占用检查留到双码校验通过后（此时已证明持有旧号，且仍拿不到新号验证码则无法继续）。

  let oldResult;
  let newResult;
  try {
    oldResult = await smsService.sendSMS(current, SCENE_OLD);
    newResult = await smsService.sendSMS(phone, SCENE_NEW);
  } catch (error) {
    logger.warn('[ChangeMobile] 换号验证码发送失败:', error && error.message);
    throw smsSendFailure(error);
  }

  const data = {
    maskedPhone: maskMobile(current),
    maskedNewPhone: maskMobile(phone)
  };
  // 测试/演示环境把两个验证码一起回传，前端自动回填；生产环境绝不回传。
  // sendSMS 本身只在 testMode / 显式 returnCodeInDev 下带 code，这里再按 nodeEnv 兜一道。
  if (config.nodeEnv !== 'production') {
    const devCodes = {};
    if (oldResult && oldResult.code) devCodes.oldCode = oldResult.code;
    if (newResult && newResult.code) devCodes.newCode = newResult.code;
    if (Object.keys(devCodes).length) data.devCodes = devCodes;
  }
  return data;
};

// 单个验证码校验：错误文案按「旧号/新号」区分，方便用户定位；
// verifyCode 成功即销毁验证码（一次性），失败有失败次数上限，不可被穷举。
const verifySceneCode = async (mobile, code, scene, label) => {
  const value = String(code === null || code === undefined ? '' : code).trim();
  if (!value) {
    throw businessError('请输入' + label + '验证码', 'CODE_REQUIRED');
  }
  try {
    await smsService.verifyCode(mobile, value, scene);
  } catch (error) {
    const message = (error && error.message) || '';
    if (message.includes('不可用')) {
      throw businessError('短信服务暂不可用，请稍后重试', 'SMS_UNAVAILABLE');
    }
    throw businessError(label + '验证码错误或已过期', 'CODE_INVALID');
  }
};

const changeMobile = async (userId, { newPhone, oldCode, newCode } = {}) => {
  const phone = normalizeNewMobile(newPhone);
  const user = await requireUser(userId);
  const current = readCurrentMobile(user);

  if (!current) {
    throw businessError('当前账号未绑定手机号，暂时无法更换', 'MOBILE_NOT_BOUND');
  }
  if (phone === current) {
    throw businessError('新手机号不能与当前手机号相同', 'SAME_MOBILE');
  }
  // 两个码都通过才落库：旧号证明「本人」，新号证明「新号可用且归属本人」。
  // 占用检查放在双码校验之后，避免发码/校验前就泄露「该号是否已注册」。
  await verifySceneCode(current, oldCode, SCENE_OLD, '原手机号');
  await verifySceneCode(phone, newCode, SCENE_NEW, '新手机号');
  // 双码通过后再做占用检查（不消耗验证码）；事务内还会再查一次兜并发
  await assertMobileAvailable(phone, user.id);

  // 与 resetPassword / changePassword 同一取向：先确认旧会话可被吊销，再写新号。
  // 生产拿不到吊销状态就不换号，避免出现「号已换、旧令牌仍有效」的中间态。
  const revoked = await tokenRevocation.revokeAllUserTokens(user.id);
  if (!revoked.verifiable && tokenRevocation.revocationFailMode() === 'closed') {
    throw businessError('认证服务暂时不可用，请稍后重试', 'REVOCATION_UNAVAILABLE');
  }

  const transaction = await sequelize.transaction();
  try {
    // 事务内复查唯一性：两个账号并发换到同一新号时，给出可读错误而不是裸唯一键冲突
    const conflict = await User.findOne({ where: buildMobileWhere(phone), transaction });
    if (conflict && Number(conflict.id) !== Number(user.id)) {
      throw businessError('该手机号已被其他账号绑定', 'MOBILE_TAKEN');
    }
    // PII：mobile 写密文、mobile_hash 写盲索引（生产缺密钥由 utils/pii 的启动闸门兜底）
    await user.update({ ...mobileFields(phone) }, { transaction });
    await transaction.commit();
  } catch (error) {
    if (transaction.finished !== 'commit') {
      try { await transaction.rollback(); } catch (rollbackError) { /* 已回滚 */ }
    }
    if (!isBusinessError(error) && error && error.name === 'SequelizeUniqueConstraintError') {
      throw businessError('该手机号已被其他账号绑定', 'MOBILE_TAKEN');
    }
    throw error;
  }

  logger.info('[ChangeMobile] 用户 ' + user.id + ' 换绑手机号成功，全部会话已吊销');
  // 最佳努力通知旧号：便于原号主发现异常换绑；通知失败不影响换号结果。
  try {
    await smsService.sendNotification(current, '您的手机号已成功更换，如非本人操作请立即联系客服');
  } catch (error) {
    logger.warn('[ChangeMobile] 旧号变更通知发送失败:', error && error.message);
  }
  return {
    requireRelogin: true,
    devicesRevoked: revoked.ok,
    maskedPhone: maskMobile(phone)
  };
};

module.exports = {
  SCENE_OLD,
  SCENE_NEW,
  isBusinessError,
  sendChangeCode,
  changeMobile
};
