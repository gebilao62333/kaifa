const express = require('express');
const router = express.Router();
const { 
  adminLogin, 
  getUserList, 
  getUserDetail, 
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
  getOrderList,
  getOrderDetail,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  getWithdrawList,
  getWithdrawDetail,
  createWithdraw,
  approveWithdraw,
  rejectWithdraw,
  deleteWithdraw,
  getPostList,
  getPostDetail,
  deletePost,
  getReportList,
  getReportDetail,
  handleReport,
  deleteReport,
  getBannerList,
  getBannerDetail,
  createBanner,
  updateBanner,
  updateBannerStatus,
  deleteBanner,
  getSplashList,
  getSplashDetail,
  createSplash,
  updateSplash,
  updateSplashStatus,
  deleteSplash,
  getVipPackageList,
  getVipPackageDetail,
  createVipPackage,
  updateVipPackage,
  updateVipPackageStatus,
  deleteVipPackage,
  getRechargePackageList,
  getRechargePackageDetail,
  createRechargePackage,
  updateRechargePackage,
  updateRechargePackageStatus,
  deleteRechargePackage,
  getGiftList,
  getGiftDetail,
  createGift,
  updateGift,
  deleteGift,
  getGiftLogList,
  getGiftLogDetail,
  getRechargeRecordList,
  getRechargeRecordDetail,
  deleteRechargeRecord,
  getGameList,
  getGameDetail,
  createGame,
  updateGame,
  updateGameStatus,
  deleteGame,
  getSystemSettings,
  updateSystemSettings,
  getDashboardStats,
  getFinanceStats,
  getCompanionApplicationList,
  getCompanionApplicationDetail,
  approveCompanionApplication,
  rejectCompanionApplication,
  deleteCompanionApplication,
  getVirtualUserList,
  getVirtualUserDetail,
  createVirtualUser,
  updateVirtualUser,
  deleteVirtualUser,
  toggleVirtualUserStatus,
  getVirtualUserChatHistory,
  getCardList,
  createCard,
  deleteCard,
  clearCards,
  getCardAdminOptions,
  getCardAdminStats
} = require('../controllers/admin');

const {
  getDownloadList,
  getDownloadDetail,
  createDownload,
  updateDownload,
  updateDownloadStatus,
  deleteDownload
} = require('../controllers/download');
const { adminAuth, requirePermission } = require('../middlewares');

// 登录接口不需要认证
router.post('/login', adminLogin);

// ================ 标准API (RESTful风格) ================
// 用户管理
router.get('/users', adminAuth, requirePermission('user:read'), getUserList);
router.get('/users/:id', adminAuth, requirePermission('user:read'), getUserDetail);
router.post('/users', adminAuth, requirePermission('user:write'), createUser);
router.put('/users/:id', adminAuth, requirePermission('user:write'), updateUser);
router.put('/users/:id/status', adminAuth, requirePermission('user:write'), updateUserStatus);
router.delete('/users/:id', adminAuth, requirePermission('user:write'), deleteUser);

// 订单管理
router.get('/orders', adminAuth, requirePermission('order:read'), getOrderList);
router.get('/orders/:id', adminAuth, requirePermission('order:read'), getOrderDetail);
router.post('/orders', adminAuth, requirePermission('order:write'), createOrder);
router.put('/orders/:id/status', adminAuth, requirePermission('order:write'), updateOrderStatus);
router.delete('/orders/:id', adminAuth, requirePermission('order:write'), deleteOrder);

// 提现管理
router.get('/withdraws', adminAuth, requirePermission('withdraw:read'), getWithdrawList);
router.get('/withdraws/:id', adminAuth, requirePermission('withdraw:read'), getWithdrawDetail);
router.post('/withdraws', adminAuth, requirePermission('withdraw:write'), createWithdraw);
router.post('/withdraws/:id/approve', adminAuth, requirePermission('withdraw:write'), approveWithdraw);
router.post('/withdraws/:id/reject', adminAuth, requirePermission('withdraw:write'), rejectWithdraw);
router.delete('/withdraws/:id', adminAuth, requirePermission('withdraw:write'), deleteWithdraw);

// 帖子管理
router.get('/posts', adminAuth, requirePermission('post:read'), getPostList);
router.get('/posts/:id', adminAuth, requirePermission('post:read'), getPostDetail);
router.delete('/posts/:id', adminAuth, requirePermission('post:write'), deletePost);

// 举报管理
router.get('/reports', adminAuth, requirePermission('report:read'), getReportList);
router.get('/reports/:id', adminAuth, requirePermission('report:read'), getReportDetail);
router.post('/reports/:id/handle', adminAuth, requirePermission('report:write'), handleReport);
router.delete('/reports/:id', adminAuth, requirePermission('report:write'), deleteReport);

// Banner管理（归入开屏&轮播权限）
router.get('/banners', adminAuth, requirePermission('splash:read'), getBannerList);
router.get('/banners/:id', adminAuth, requirePermission('splash:read'), getBannerDetail);
router.post('/banners', adminAuth, requirePermission('splash:write'), createBanner);
router.put('/banners/:id', adminAuth, requirePermission('splash:write'), updateBanner);
router.put('/banners/:id/status', adminAuth, requirePermission('splash:write'), updateBannerStatus);
router.delete('/banners/:id', adminAuth, requirePermission('splash:write'), deleteBanner);

// 开屏弹窗管理
router.get('/splashes', adminAuth, requirePermission('splash:read'), getSplashList);
router.get('/splashes/:id', adminAuth, requirePermission('splash:read'), getSplashDetail);
router.post('/splashes', adminAuth, requirePermission('splash:write'), createSplash);
router.put('/splashes/:id', adminAuth, requirePermission('splash:write'), updateSplash);
router.put('/splashes/:id/status', adminAuth, requirePermission('splash:write'), updateSplashStatus);
router.delete('/splashes/:id', adminAuth, requirePermission('splash:write'), deleteSplash);

// 下载管理
router.get('/downloads', adminAuth, requirePermission('download:read'), getDownloadList);
router.get('/downloads/:id', adminAuth, requirePermission('download:read'), getDownloadDetail);
router.post('/downloads', adminAuth, requirePermission('download:write'), createDownload);
router.put('/downloads/:id', adminAuth, requirePermission('download:write'), updateDownload);
router.patch('/downloads/:id/status', adminAuth, requirePermission('download:write'), updateDownloadStatus);
router.delete('/downloads/:id', adminAuth, requirePermission('download:write'), deleteDownload);

// VIP套餐管理
router.get('/vip-packages', adminAuth, requirePermission('vip:read'), getVipPackageList);
router.get('/vip-packages/:id', adminAuth, requirePermission('vip:read'), getVipPackageDetail);
router.post('/vip-packages', adminAuth, requirePermission('vip:write'), createVipPackage);
router.put('/vip-packages/:id', adminAuth, requirePermission('vip:write'), updateVipPackage);
router.put('/vip-packages/:id/status', adminAuth, requirePermission('vip:write'), updateVipPackageStatus);
router.delete('/vip-packages/:id', adminAuth, requirePermission('vip:write'), deleteVipPackage);

// 充值金额档位管理
router.get('/recharge-packages', adminAuth, requirePermission('vip:read'), getRechargePackageList);
router.get('/recharge-packages/:id', adminAuth, requirePermission('vip:read'), getRechargePackageDetail);
router.post('/recharge-packages', adminAuth, requirePermission('vip:write'), createRechargePackage);
router.put('/recharge-packages/:id', adminAuth, requirePermission('vip:write'), updateRechargePackage);
router.put('/recharge-packages/:id/status', adminAuth, requirePermission('vip:write'), updateRechargePackageStatus);
router.delete('/recharge-packages/:id', adminAuth, requirePermission('vip:write'), deleteRechargePackage);

// 礼物管理
router.get('/gifts', adminAuth, requirePermission('gift:read'), getGiftList);
router.get('/gifts/:id', adminAuth, requirePermission('gift:read'), getGiftDetail);
router.post('/gifts', adminAuth, requirePermission('gift:write'), createGift);
router.put('/gifts/:id', adminAuth, requirePermission('gift:write'), updateGift);
router.delete('/gifts/:id', adminAuth, requirePermission('gift:write'), deleteGift);

// 礼物记录
router.get('/gift-logs', adminAuth, requirePermission('gift:read'), getGiftLogList);
router.get('/gift-logs/:id', adminAuth, requirePermission('gift:read'), getGiftLogDetail);

// 充值记录
router.get('/recharge-records', adminAuth, requirePermission('recharge:read'), getRechargeRecordList);
router.get('/recharge-records/:id', adminAuth, requirePermission('recharge:read'), getRechargeRecordDetail);
router.delete('/recharge-records/:id', adminAuth, requirePermission('recharge:write'), deleteRechargeRecord);

// 游戏/服务管理
router.get('/games', adminAuth, requirePermission('game:read'), getGameList);
router.get('/games/:id', adminAuth, requirePermission('game:read'), getGameDetail);
router.post('/games', adminAuth, requirePermission('game:write'), createGame);
router.put('/games/:id', adminAuth, requirePermission('game:write'), updateGame);
router.put('/games/:id/status', adminAuth, requirePermission('game:write'), updateGameStatus);
router.delete('/games/:id', adminAuth, requirePermission('game:write'), deleteGame);

// 陪玩师申请管理
router.get('/companion-applications', adminAuth, requirePermission('companion:read'), getCompanionApplicationList);
router.get('/companion-applications/:id', adminAuth, requirePermission('companion:read'), getCompanionApplicationDetail);
router.put('/companion-applications/:id/approve', adminAuth, requirePermission('companion:write'), approveCompanionApplication);
router.put('/companion-applications/:id/reject', adminAuth, requirePermission('companion:write'), rejectCompanionApplication);
router.delete('/companion-applications/:id', adminAuth, requirePermission('companion:write'), deleteCompanionApplication);

// 虚拟用户管理
router.get('/virtual-users', adminAuth, requirePermission('virtual:read'), getVirtualUserList);
router.get('/virtual-users/:id', adminAuth, requirePermission('virtual:read'), getVirtualUserDetail);
router.post('/virtual-users', adminAuth, requirePermission('virtual:write'), createVirtualUser);
router.put('/virtual-users/:id', adminAuth, requirePermission('virtual:write'), updateVirtualUser);
router.delete('/virtual-users/:id', adminAuth, requirePermission('virtual:write'), deleteVirtualUser);
router.put('/virtual-users/:id/status', adminAuth, requirePermission('virtual:write'), toggleVirtualUserStatus);
router.get('/virtual-users/:id/chat-history', adminAuth, requirePermission('virtual:read'), getVirtualUserChatHistory);

// 卡密管理
router.get('/cards', adminAuth, requirePermission('card:read'), getCardList);
router.post('/cards', adminAuth, requirePermission('card:write'), createCard);
router.delete('/cards/:id', adminAuth, requirePermission('card:write'), deleteCard);
router.post('/cards/clear', adminAuth, requirePermission('card:write'), clearCards);
router.get('/card-admins', adminAuth, requirePermission('card:read'), getCardAdminOptions);
router.get('/card-admin-stats', adminAuth, requirePermission('card:read'), getCardAdminStats);

// 系统设置
router.get('/settings', adminAuth, requirePermission('settings:read'), getSystemSettings);
router.put('/settings', adminAuth, requirePermission('settings:write'), updateSystemSettings);

// 仪表板
router.get('/dashboard', adminAuth, requirePermission('dashboard:read'), getDashboardStats);

// 财务管理
router.get('/finance/stats', adminAuth, requirePermission('finance:read'), getFinanceStats);

// ================ 兼容性API (前端旧调用方式) ================
// 统计数据
router.get('/statistics', adminAuth, requirePermission('dashboard:read'), getDashboardStats);

// 用户状态更新
router.post('/update-user-status', adminAuth, requirePermission('user:write'), (req, res, next) => {
  // 转换旧API到新API
  if (req.body.userId) {
    req.params.id = req.body.userId;
  }
  updateUserStatus(req, res, next);
});

// 用户详情
router.get('/user-detail', adminAuth, requirePermission('user:read'), (req, res, next) => {
  if (req.query.userId) {
    req.params.id = req.query.userId;
  }
  getUserDetail(req, res, next);
});

// 提现审核
router.post('/review-withdraw', adminAuth, requirePermission('withdraw:write'), (req, res, next) => {
  if (req.body.withdrawId) {
    req.params.id = req.body.withdrawId;
  }
  if (req.body.status === 1) {
    approveWithdraw(req, res, next);
  } else {
    rejectWithdraw(req, res, next);
  }
});

// 举报处理
router.post('/handle-report', adminAuth, requirePermission('report:write'), (req, res, next) => {
  if (req.body.reportId) {
    req.params.id = req.body.reportId;
  }
  handleReport(req, res, next);
});

// 充值记录兼容性路由
router.get('/recharges', adminAuth, requirePermission('recharge:read'), getRechargeRecordList);
router.get('/recharges/:id', adminAuth, requirePermission('recharge:read'), getRechargeRecordDetail);
router.delete('/recharges/:id', adminAuth, requirePermission('recharge:write'), deleteRechargeRecord);

// 举报更新状态兼容性
router.put('/reports/:id', adminAuth, requirePermission('report:write'), (req, res, next) => {
  // 把 body 里的 status 传递给 handleReport
  handleReport(req, res, next);
});

// 陪玩师申请POST兼容性
router.post('/companion-applications/:id/approve', adminAuth, requirePermission('companion:write'), (req, res, next) => {
  approveCompanionApplication(req, res, next);
});

router.post('/companion-applications/:id/reject', adminAuth, requirePermission('companion:write'), (req, res, next) => {
  rejectCompanionApplication(req, res, next);
});

module.exports = router;
