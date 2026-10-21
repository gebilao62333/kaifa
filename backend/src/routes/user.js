const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const { authMiddleware, smsLimiter, loginLimiter } = require('../middlewares');

router.post('/login', loginLimiter, userController.login);
router.post('/register', loginLimiter, userController.register);
router.post('/reset-password', loginLimiter, userController.resetPassword);
// 已登录用户修改密码（旧密码校验；改密后全端令牌作废，需重新登录）
router.post('/change-password', authMiddleware, userController.changePassword);
// P1-8 换绑手机号：一次请求同时给当前号/新号发码（两个独立短信场景，避免两次请求各撞一次 IP 限流）
router.post('/change-mobile/send-code', authMiddleware, smsLimiter, userController.sendChangeMobileCode);
// 换号：旧号+新号验证码双校验、新号唯一（mobile_hash 盲索引），成功后吊销全部会话并需重新登录
router.post('/change-mobile', authMiddleware, userController.changeMobile);
router.get('/get', authMiddleware, userController.getUserInfo);
// 个人中心/主页统计（?userId= 可看他人公开计数）
router.get('/stats', authMiddleware, userController.getUserStats);
// U-22：黑名单
router.post('/block', authMiddleware, userController.blockUser);
router.post('/unblock', authMiddleware, userController.unblockUser);
router.get('/blocks', authMiddleware, userController.getBlockedUsers);
router.post('/update', authMiddleware, userController.updateUserInfo);
router.post('/follow', authMiddleware, userController.follow);
router.get('/fans', authMiddleware, userController.getFans);
router.get('/follows', authMiddleware, userController.getFollows);
router.get('/check-follow', authMiddleware, userController.checkFollow);
router.post('/send-sms', smsLimiter, userController.sendSms);
router.post('/login-mobile', loginLimiter, userController.loginMobile);
router.post('/login-third', loginLimiter, userController.loginThird);
router.post('/refresh-token', userController.refreshToken);
// 审计 H-5：服务端登出——把当前 access 令牌（以及可选随请求提交的本人 refresh 令牌）写进吊销名单
router.post('/logout', authMiddleware, userController.logout);
router.post('/real-name', authMiddleware, userController.submitRealName);
router.get('/real-name', authMiddleware, userController.getRealNameStatus);
router.get('/likes', authMiddleware, userController.getLikes);
router.get('/visitors', authMiddleware, userController.getVisitors);
router.post('/visit', authMiddleware, userController.recordVisit);
router.get('/pref', authMiddleware, userController.getPref);
router.post('/pref', authMiddleware, userController.savePref);
// 审计 H-6：装扮目录/价格/所有权/扣款全部服务端化，客户端只提交 skinId
router.get('/skins', authMiddleware, userController.listSkins);
router.post('/skins/purchase', authMiddleware, userController.purchaseSkin);
router.post('/skins/use', authMiddleware, userController.useSkin);
router.get('/level', authMiddleware, userController.getLevelInfo);
router.post('/level/check-in', authMiddleware, userController.checkIn);

module.exports = router;
