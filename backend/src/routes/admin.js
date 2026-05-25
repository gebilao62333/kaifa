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
  getVipPackageList,
  getVipPackageDetail,
  createVipPackage,
  updateVipPackage,
  updateVipPackageStatus,
  deleteVipPackage,
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
  getVirtualUserChatHistory
} = require('../controllers/admin');
const { adminAuth } = require('../middlewares');

// 登录接口不需要认证
router.post('/login', adminLogin);

// ================ 标准API (RESTful风格) ================
// 用户管理
router.get('/users', adminAuth, getUserList);
router.get('/users/:id', adminAuth, getUserDetail);
router.post('/users', adminAuth, createUser);
router.put('/users/:id', adminAuth, updateUser);
router.put('/users/:id/status', adminAuth, updateUserStatus);
router.delete('/users/:id', adminAuth, deleteUser);

// 订单管理
router.get('/orders', adminAuth, getOrderList);
router.get('/orders/:id', adminAuth, getOrderDetail);
router.post('/orders', adminAuth, createOrder);
router.put('/orders/:id/status', adminAuth, updateOrderStatus);
router.delete('/orders/:id', adminAuth, deleteOrder);

// 提现管理
router.get('/withdraws', adminAuth, getWithdrawList);
router.get('/withdraws/:id', adminAuth, getWithdrawDetail);
router.post('/withdraws', adminAuth, createWithdraw);
router.post('/withdraws/:id/approve', adminAuth, approveWithdraw);
router.post('/withdraws/:id/reject', adminAuth, rejectWithdraw);
router.delete('/withdraws/:id', adminAuth, deleteWithdraw);

// 帖子管理
router.get('/posts', adminAuth, getPostList);
router.get('/posts/:id', adminAuth, getPostDetail);
router.delete('/posts/:id', adminAuth, deletePost);

// 举报管理
router.get('/reports', adminAuth, getReportList);
router.get('/reports/:id', adminAuth, getReportDetail);
router.post('/reports/:id/handle', adminAuth, handleReport);
router.delete('/reports/:id', adminAuth, deleteReport);

// Banner管理
router.get('/banners', adminAuth, getBannerList);
router.get('/banners/:id', adminAuth, getBannerDetail);
router.post('/banners', adminAuth, createBanner);
router.put('/banners/:id', adminAuth, updateBanner);
router.put('/banners/:id/status', adminAuth, updateBannerStatus);
router.delete('/banners/:id', adminAuth, deleteBanner);

// VIP套餐管理
router.get('/vip-packages', adminAuth, getVipPackageList);
router.get('/vip-packages/:id', adminAuth, getVipPackageDetail);
router.post('/vip-packages', adminAuth, createVipPackage);
router.put('/vip-packages/:id', adminAuth, updateVipPackage);
router.put('/vip-packages/:id/status', adminAuth, updateVipPackageStatus);
router.delete('/vip-packages/:id', adminAuth, deleteVipPackage);

// 礼物管理
router.get('/gifts', adminAuth, getGiftList);
router.get('/gifts/:id', adminAuth, getGiftDetail);
router.post('/gifts', adminAuth, createGift);
router.put('/gifts/:id', adminAuth, updateGift);
router.delete('/gifts/:id', adminAuth, deleteGift);

// 礼物记录
router.get('/gift-logs', adminAuth, getGiftLogList);
router.get('/gift-logs/:id', adminAuth, getGiftLogDetail);

// 充值记录
router.get('/recharge-records', adminAuth, getRechargeRecordList);
router.get('/recharge-records/:id', adminAuth, getRechargeRecordDetail);
router.delete('/recharge-records/:id', adminAuth, deleteRechargeRecord);

// 游戏/服务管理
router.get('/games', adminAuth, getGameList);
router.get('/games/:id', adminAuth, getGameDetail);
router.post('/games', adminAuth, createGame);
router.put('/games/:id', adminAuth, updateGame);
router.put('/games/:id/status', adminAuth, updateGameStatus);
router.delete('/games/:id', adminAuth, deleteGame);

// 陪玩师申请管理
router.get('/companion-applications', adminAuth, getCompanionApplicationList);
router.get('/companion-applications/:id', adminAuth, getCompanionApplicationDetail);
router.put('/companion-applications/:id/approve', adminAuth, approveCompanionApplication);
router.put('/companion-applications/:id/reject', adminAuth, rejectCompanionApplication);
router.delete('/companion-applications/:id', adminAuth, deleteCompanionApplication);

// 虚拟用户管理
router.get('/virtual-users', adminAuth, getVirtualUserList);
router.get('/virtual-users/:id', adminAuth, getVirtualUserDetail);
router.post('/virtual-users', adminAuth, createVirtualUser);
router.put('/virtual-users/:id', adminAuth, updateVirtualUser);
router.delete('/virtual-users/:id', adminAuth, deleteVirtualUser);
router.put('/virtual-users/:id/status', adminAuth, toggleVirtualUserStatus);
router.get('/virtual-users/:id/chat-history', adminAuth, getVirtualUserChatHistory);

// 系统设置
router.get('/settings', adminAuth, getSystemSettings);
router.put('/settings', adminAuth, updateSystemSettings);

// 仪表板
router.get('/dashboard', adminAuth, getDashboardStats);

// ================ 兼容性API (前端旧调用方式) ================
// 统计数据
router.get('/statistics', adminAuth, getDashboardStats);

// 用户状态更新
router.post('/update-user-status', adminAuth, (req, res, next) => {
  // 转换旧API到新API
  if (req.body.userId) {
    req.params.id = req.body.userId;
  }
  updateUserStatus(req, res, next);
});

// 用户详情
router.get('/user-detail', adminAuth, (req, res, next) => {
  if (req.query.userId) {
    req.params.id = req.query.userId;
  }
  getUserDetail(req, res, next);
});

// 提现审核
router.post('/review-withdraw', adminAuth, (req, res, next) => {
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
router.post('/handle-report', adminAuth, (req, res, next) => {
  if (req.body.reportId) {
    req.params.id = req.body.reportId;
  }
  handleReport(req, res, next);
});

// 充值记录兼容性路由
router.get('/recharges', adminAuth, getRechargeRecordList);
router.get('/recharges/:id', adminAuth, getRechargeRecordDetail);
router.delete('/recharges/:id', adminAuth, deleteRechargeRecord);

// 举报更新状态兼容性
router.put('/reports/:id', adminAuth, (req, res, next) => {
  // 把 body 里的 status 传递给 handleReport
  handleReport(req, res, next);
});

// 陪玩师申请POST兼容性
router.post('/companion-applications/:id/approve', adminAuth, (req, res, next) => {
  approveCompanionApplication(req, res, next);
});

router.post('/companion-applications/:id/reject', adminAuth, (req, res, next) => {
  rejectCompanionApplication(req, res, next);
});

module.exports = router;
