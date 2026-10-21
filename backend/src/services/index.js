const authService = require('./authService');
const chatService = require('./chatService');
const giftService = require('./giftService');
const payService = require('./payService');
const wechatPayService = require('./wechatPayService');
const gamesService = require('./gamesService');
const circleService = require('./circleService');
const reserveService = require('./reserveService');
const reportService = require('./reportService');
const trtcService = require('./trtcService');
const callBillingService = require('./callBillingService');
const uploadService = require('./uploadService');
const mediaAssetService = require('./mediaAssetService');
const cosSignedUrlService = require('./cosSignedUrlService');
const smsService = require('./smsService');
const vipService = require('./vipService');
const virtualUserService = require('./virtualUserService');
const tagService = require('./tagService');
const albumService = require('./albumService');
const demandService = require('./demandService');
const regionService = require('./regionService');
const walletService = require('./walletService');
const feedbackService = require('./feedbackService');
const settingsService = require('./settingsService');
const levelService = require('./levelService');
// 审计 H-6：装扮目录/价格/所有权收归服务端
const skinService = require('./skinService');
// 《未完成事项清单》B-3：平台公告落库
const noticeService = require('./noticeService');
// P1-8：换绑手机号（双场景验证码 + 原子换号 + 全端会话吊销）
const mobileChangeService = require('./mobileChangeService');
// P2-7：资料扩展字段（存 xn_user_pref.data.profileExtra）
const userPrefService = require('./userPrefService');

module.exports = {
  authService,
  chatService,
  giftService,
  payService,
  wechatPayService,
  gamesService,
  circleService,
  reserveService,
  reportService,
  trtcService,
  callBillingService,
  uploadService,
  mediaAssetService,
  cosSignedUrlService,
  smsService,
  vipService,
  virtualUserService,
  tagService,
  albumService,
  demandService,
  regionService,
  walletService,
  feedbackService,
  settingsService,
  levelService,
  skinService,
  noticeService,
  mobileChangeService,
  userPrefService
};