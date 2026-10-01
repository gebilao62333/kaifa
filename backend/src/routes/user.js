const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const { authMiddleware, smsLimiter, loginLimiter } = require('../middlewares');

router.post('/login', loginLimiter, userController.login);
router.post('/register', loginLimiter, userController.register);
router.post('/reset-password', loginLimiter, userController.resetPassword);
router.get('/get', authMiddleware, userController.getUserInfo);
router.post('/update', authMiddleware, userController.updateUserInfo);
router.post('/follow', authMiddleware, userController.follow);
router.get('/fans', authMiddleware, userController.getFans);
router.get('/follows', authMiddleware, userController.getFollows);
router.get('/check-follow', authMiddleware, userController.checkFollow);
router.post('/send-sms', smsLimiter, userController.sendSms);
router.post('/login-mobile', loginLimiter, userController.loginMobile);
router.post('/login-third', loginLimiter, userController.loginThird);
router.post('/refresh-token', userController.refreshToken);
router.post('/real-name', authMiddleware, userController.submitRealName);
router.get('/real-name', authMiddleware, userController.getRealNameStatus);
router.get('/likes', authMiddleware, userController.getLikes);
router.get('/visitors', authMiddleware, userController.getVisitors);
router.post('/visit', authMiddleware, userController.recordVisit);
router.get('/pref', authMiddleware, userController.getPref);
router.post('/pref', authMiddleware, userController.savePref);

module.exports = router;
