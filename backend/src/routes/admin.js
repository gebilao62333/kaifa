const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload');
const adminUpload = require('../config/upload');
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
  batchDeletePosts,
  updatePostStatus,
  batchUpdatePostStatus,
  getPostStats,
  getReportList,
  getReportDetail,
  handleReport,
  batchHandleReports,
  deleteReport,
  batchDeleteReports,
  getReportStats,
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
  completeRechargeRecord,
  failRechargeRecord,
  getCardList,
  getCardDetail,
  createCard,
  updateCard,
  updateCardStatus,
  batchUpdateCardStatus,
  batchDeleteCards,
  batchUpdateCardTag,
  getCardStats,
  importCards,
  deleteCard,
  clearAllCards,
  recordExport,
  getExportLogs,
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
  getVirtualUserChatHistory,
  getRecommendCandidates,
  getRecommendListByType,
  addRecommend,
  updateRecommend,
  batchUpdateRecommend,
  deleteRecommend,
  checkExpiredRecommend,
  getCustomerServiceList,
  createCustomerService,
  updateCustomerService,
  deleteCustomerService,
  // 系统通知管理
  getNotificationList,
  getNotificationDetail,
  createNotification,
  updateNotification,
  pushNotification,
  getNotificationStats,
  deleteNotification
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
router.get('/posts/stats', adminAuth, getPostStats);
router.get('/posts/:id', adminAuth, getPostDetail);
router.delete('/posts/:id', adminAuth, deletePost);
router.post('/posts/batch-delete', adminAuth, batchDeletePosts);
router.put('/posts/:id/status', adminAuth, updatePostStatus);
router.post('/posts/batch-status', adminAuth, batchUpdatePostStatus);

// 举报管理
router.get('/reports', adminAuth, getReportList);
router.get('/reports/stats', adminAuth, getReportStats);
router.get('/reports/:id', adminAuth, getReportDetail);
router.post('/reports/:id/handle', adminAuth, handleReport);
router.post('/reports/batch-handle', adminAuth, batchHandleReports);
router.delete('/reports/:id', adminAuth, deleteReport);
router.post('/reports/batch-delete', adminAuth, batchDeleteReports);

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
router.put('/recharge-records/:id/complete', adminAuth, completeRechargeRecord);
router.put('/recharge-records/:id/fail', adminAuth, failRechargeRecord);

// 密卡管理
router.get('/cards/stats', adminAuth, getCardStats);
router.get('/cards', adminAuth, getCardList);
router.get('/cards/:id', adminAuth, getCardDetail);
router.post('/cards', adminAuth, createCard);
router.put('/cards/:id', adminAuth, updateCard);
router.put('/cards/:id/status', adminAuth, updateCardStatus);
router.post('/cards/batch-status', adminAuth, batchUpdateCardStatus);
router.post('/cards/batch-delete', adminAuth, batchDeleteCards);
router.post('/cards/batch-tag', adminAuth, batchUpdateCardTag);
router.post('/cards/record-export', adminAuth, recordExport);
router.get('/cards/export-logs', adminAuth, getExportLogs);
router.post('/cards/import', adminAuth, importCards);
router.post('/cards/clear-by-face', adminAuth, clearAllCards);
router.delete('/cards/:id', adminAuth, deleteCard);

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

// 推荐管理
router.get('/recommend-candidates', adminAuth, getRecommendCandidates);
router.get('/recommend-list/:recommendType', adminAuth, getRecommendListByType);
router.post('/recommend/check-expired', adminAuth, checkExpiredRecommend);
router.post('/recommend', adminAuth, addRecommend);
router.put('/recommend/batch', adminAuth, batchUpdateRecommend);
router.put('/recommend/:id', adminAuth, updateRecommend);
router.delete('/recommend/:id', adminAuth, deleteRecommend);

// 客服管理
router.get('/customer-services', adminAuth, getCustomerServiceList);
router.post('/customer-services', adminAuth, createCustomerService);
router.put('/customer-services/:id', adminAuth, updateCustomerService);
router.delete('/customer-services/:id', adminAuth, deleteCustomerService);

// 系统通知管理
router.get('/notifications/stats', adminAuth, getNotificationStats);
router.get('/notifications', adminAuth, getNotificationList);
router.get('/notifications/:id', adminAuth, getNotificationDetail);
router.post('/notifications', adminAuth, createNotification);
router.put('/notifications/:id', adminAuth, updateNotification);
router.post('/notifications/:id/push', adminAuth, pushNotification);
router.delete('/notifications/:id', adminAuth, deleteNotification);

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

// 管理员文件上传
router.post('/upload', adminAuth, adminUpload.single('image'), uploadController.uploadImage);

module.exports = router;
