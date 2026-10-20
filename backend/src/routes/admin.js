const express = require('express');
const router = express.Router();
const { 
  adminLogin, 
  refreshAdminToken,
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
  getCardAdminStats,
  getRealNameList,
  getRealNameDetail,
  reviewRealName,
  getNoticeList,
  getNoticeDetail,
  createNotice,
  updateNotice,
  deleteNotice
} = require('../controllers/admin');

const {
  getDownloadList,
  getDownloadDetail,
  createDownload,
  updateDownload,
  updateDownloadStatus,
  deleteDownload
} = require('../controllers/download');
const { adminAuth, requirePermission, adminLoginLimiter, validate, validateQuery, LIMITS } = require('../middlewares');
const { adminLogout } = require('../controllers/adminManage');

// 《未完成事项清单》B-12：管理端列表接口统一分页上下限。
// 各模块自己的过滤字段（status/keyword/role 等）取值语义不同，仍由控制器按模块校验；
// 这里只收口最容易被写成 pageSize=999999 的分页参数。
const paginationQuerySchema = {
  fields: {
    page: { type: 'integer', min: 1, max: 100000 },
    pageSize: { type: 'integer', min: 1, max: 100 }
  }
};

// 《未完成事项清单》B-3：公告管理（权限沿用 splash:read / splash:write，不新增权限键）
const noticeListQuerySchema = {
  fields: {
    status: { type: 'integer', min: 0, max: 1 },
    keyword: { type: 'string', maxLength: 120 },
    page: { type: 'integer', min: 1, max: 100000 },
    pageSize: { type: 'integer', min: 1, max: 100 }
  }
};

const noticeWriteFields = {
  title: { type: 'string', maxLength: 120 },
  content: { type: 'string', maxLength: 5000 },
  type: { type: 'string', enum: ['notice', 'activity', 'system'], maxLength: 20 },
  status: { type: 'integer', min: 0, max: 1 },
  pinned: { type: 'integer', min: 0, max: 1 },
  startTime: { type: 'integer', min: 0, max: LIMITS.ID_MAX },
  endTime: { type: 'integer', min: 0, max: LIMITS.ID_MAX }
};

const createNoticeSchema = {
  required: ['title', 'content'],
  fields: noticeWriteFields
};

// 更新是部分更新：不设 required，未传字段由 service 保留原值
const updateNoticeSchema = { fields: noticeWriteFields };

// 《未完成事项清单》B-2 + B-12：实名审核列表的查询参数在边界归一/夹取
const realNameListQuerySchema = {
  fields: {
    status: { type: 'integer', min: 0, max: 3 },
    keyword: { type: 'string', maxLength: 50 },
    page: { type: 'integer', min: 1, max: 100000 },
    pageSize: { type: 'integer', min: 1, max: 100 }
  }
};

// 审核动作白名单：只接受 approve / reject，避免任意字符串进入业务层
const reviewRealNameSchema = {
  required: ['action'],
  fields: {
    action: { type: 'string', enum: ['approve', 'reject'], maxLength: 16 }
  }
};

// 审计 M-6：管理端建提现单（会直接扣用户余额）统一在边界校验，userId/amount 必须是合法整数/数字。
const createWithdrawSchema = {
  required: ['userId', 'amount'],
  fields: {
    userId: { type: 'integer', min: 1, max: LIMITS.ID_MAX },
    amount: { type: 'number', min: 0.01, max: LIMITS.MONEY_MAX },
    type: { type: 'integer', min: 1, max: 3 },
    account: { type: 'string', maxLength: 255 }
  }
};

// 登录接口不需要认证，但需要限流（审计 H-3：原先只吃全局 apiLimiter，可在线爆破口令）
router.post('/login', adminLoginLimiter, adminLogin);

// 审计 B-5：管理端 refresh 令牌兑换入口（无 access 时调用，不需要 adminAuth）
router.post('/refresh-token', refreshAdminToken);

// 审计 H-5：后台登出——与 /api/admin-manage/logout 共用同一实现（两个入口本就是同一套口令与会话）
router.post('/logout', adminAuth, adminLogout);

// ================ 标准API (RESTful风格) ================
// 用户管理
// 《未完成事项清单》B-2：实名审核（列表/详情/通过或拒绝）；权限沿用 user:read / user:write，不新增权限键
// 《未完成事项清单》B-3/B-4：公告 CRUD（写成功后 socket 全服广播）
router.get('/notices', adminAuth, requirePermission('splash:read'), validateQuery(noticeListQuerySchema), getNoticeList);
router.get('/notices/:id', adminAuth, requirePermission('splash:read'), getNoticeDetail);
router.post('/notices', adminAuth, requirePermission('splash:write'), validate(createNoticeSchema), createNotice);
router.put('/notices/:id', adminAuth, requirePermission('splash:write'), validate(updateNoticeSchema), updateNotice);
router.delete('/notices/:id', adminAuth, requirePermission('splash:write'), deleteNotice);

router.get('/real-names', adminAuth, requirePermission('user:read'), validateQuery(realNameListQuerySchema), getRealNameList);
router.get('/real-names/:id', adminAuth, requirePermission('user:read'), getRealNameDetail);
router.put('/real-names/:id/review', adminAuth, requirePermission('user:write'), validate(reviewRealNameSchema), reviewRealName);

router.get('/users', adminAuth, requirePermission('user:read'), validateQuery(paginationQuerySchema), getUserList);
router.get('/users/:id', adminAuth, requirePermission('user:read'), getUserDetail);
router.post('/users', adminAuth, requirePermission('user:write'), createUser);
router.put('/users/:id', adminAuth, requirePermission('user:write'), updateUser);
router.put('/users/:id/status', adminAuth, requirePermission('user:write'), updateUserStatus);
router.delete('/users/:id', adminAuth, requirePermission('user:write'), deleteUser);

// 订单管理
router.get('/orders', adminAuth, requirePermission('order:read'), validateQuery(paginationQuerySchema), getOrderList);
router.get('/orders/:id', adminAuth, requirePermission('order:read'), getOrderDetail);
router.post('/orders', adminAuth, requirePermission('order:write'), createOrder);
router.put('/orders/:id/status', adminAuth, requirePermission('order:write'), updateOrderStatus);
router.delete('/orders/:id', adminAuth, requirePermission('order:write'), deleteOrder);

// 提现管理
router.get('/withdraws', adminAuth, requirePermission('withdraw:read'), validateQuery(paginationQuerySchema), getWithdrawList);
router.get('/withdraws/:id', adminAuth, requirePermission('withdraw:read'), getWithdrawDetail);
router.post('/withdraws', adminAuth, requirePermission('withdraw:write'), validate(createWithdrawSchema), createWithdraw);
router.post('/withdraws/:id/approve', adminAuth, requirePermission('withdraw:write'), approveWithdraw);
router.post('/withdraws/:id/reject', adminAuth, requirePermission('withdraw:write'), rejectWithdraw);
router.delete('/withdraws/:id', adminAuth, requirePermission('withdraw:write'), deleteWithdraw);

// 帖子管理
router.get('/posts', adminAuth, requirePermission('post:read'), validateQuery(paginationQuerySchema), getPostList);
router.get('/posts/:id', adminAuth, requirePermission('post:read'), getPostDetail);
router.delete('/posts/:id', adminAuth, requirePermission('post:write'), deletePost);

// 举报管理
router.get('/reports', adminAuth, requirePermission('report:read'), validateQuery(paginationQuerySchema), getReportList);
router.get('/reports/:id', adminAuth, requirePermission('report:read'), getReportDetail);
router.post('/reports/:id/handle', adminAuth, requirePermission('report:write'), handleReport);
router.delete('/reports/:id', adminAuth, requirePermission('report:write'), deleteReport);

// Banner管理（归入开屏&轮播权限）
router.get('/banners', adminAuth, requirePermission('splash:read'), validateQuery(paginationQuerySchema), getBannerList);
router.get('/banners/:id', adminAuth, requirePermission('splash:read'), getBannerDetail);
router.post('/banners', adminAuth, requirePermission('splash:write'), createBanner);
router.put('/banners/:id', adminAuth, requirePermission('splash:write'), updateBanner);
router.put('/banners/:id/status', adminAuth, requirePermission('splash:write'), updateBannerStatus);
router.delete('/banners/:id', adminAuth, requirePermission('splash:write'), deleteBanner);

// 开屏弹窗管理
router.get('/splashes', adminAuth, requirePermission('splash:read'), validateQuery(paginationQuerySchema), getSplashList);
router.get('/splashes/:id', adminAuth, requirePermission('splash:read'), getSplashDetail);
router.post('/splashes', adminAuth, requirePermission('splash:write'), createSplash);
router.put('/splashes/:id', adminAuth, requirePermission('splash:write'), updateSplash);
router.put('/splashes/:id/status', adminAuth, requirePermission('splash:write'), updateSplashStatus);
router.delete('/splashes/:id', adminAuth, requirePermission('splash:write'), deleteSplash);

// 下载管理
router.get('/downloads', adminAuth, requirePermission('download:read'), validateQuery(paginationQuerySchema), getDownloadList);
router.get('/downloads/:id', adminAuth, requirePermission('download:read'), getDownloadDetail);
router.post('/downloads', adminAuth, requirePermission('download:write'), createDownload);
router.put('/downloads/:id', adminAuth, requirePermission('download:write'), updateDownload);
router.patch('/downloads/:id/status', adminAuth, requirePermission('download:write'), updateDownloadStatus);
router.delete('/downloads/:id', adminAuth, requirePermission('download:write'), deleteDownload);

// VIP套餐管理
router.get('/vip-packages', adminAuth, requirePermission('vip:read'), validateQuery(paginationQuerySchema), getVipPackageList);
router.get('/vip-packages/:id', adminAuth, requirePermission('vip:read'), getVipPackageDetail);
router.post('/vip-packages', adminAuth, requirePermission('vip:write'), createVipPackage);
router.put('/vip-packages/:id', adminAuth, requirePermission('vip:write'), updateVipPackage);
router.put('/vip-packages/:id/status', adminAuth, requirePermission('vip:write'), updateVipPackageStatus);
router.delete('/vip-packages/:id', adminAuth, requirePermission('vip:write'), deleteVipPackage);

// 充值金额档位管理
router.get('/recharge-packages', adminAuth, requirePermission('vip:read'), validateQuery(paginationQuerySchema), getRechargePackageList);
router.get('/recharge-packages/:id', adminAuth, requirePermission('vip:read'), getRechargePackageDetail);
router.post('/recharge-packages', adminAuth, requirePermission('vip:write'), createRechargePackage);
router.put('/recharge-packages/:id', adminAuth, requirePermission('vip:write'), updateRechargePackage);
router.put('/recharge-packages/:id/status', adminAuth, requirePermission('vip:write'), updateRechargePackageStatus);
router.delete('/recharge-packages/:id', adminAuth, requirePermission('vip:write'), deleteRechargePackage);

// 礼物管理
router.get('/gifts', adminAuth, requirePermission('gift:read'), validateQuery(paginationQuerySchema), getGiftList);
router.get('/gifts/:id', adminAuth, requirePermission('gift:read'), getGiftDetail);
router.post('/gifts', adminAuth, requirePermission('gift:write'), createGift);
router.put('/gifts/:id', adminAuth, requirePermission('gift:write'), updateGift);
router.delete('/gifts/:id', adminAuth, requirePermission('gift:write'), deleteGift);

// 礼物记录
router.get('/gift-logs', adminAuth, requirePermission('gift:read'), validateQuery(paginationQuerySchema), getGiftLogList);
router.get('/gift-logs/:id', adminAuth, requirePermission('gift:read'), getGiftLogDetail);

// 充值记录
router.get('/recharge-records', adminAuth, requirePermission('recharge:read'), validateQuery(paginationQuerySchema), getRechargeRecordList);
router.get('/recharge-records/:id', adminAuth, requirePermission('recharge:read'), getRechargeRecordDetail);
router.delete('/recharge-records/:id', adminAuth, requirePermission('recharge:write'), deleteRechargeRecord);

// 游戏/服务管理
router.get('/games', adminAuth, requirePermission('game:read'), validateQuery(paginationQuerySchema), getGameList);
router.get('/games/:id', adminAuth, requirePermission('game:read'), getGameDetail);
router.post('/games', adminAuth, requirePermission('game:write'), createGame);
router.put('/games/:id', adminAuth, requirePermission('game:write'), updateGame);
router.put('/games/:id/status', adminAuth, requirePermission('game:write'), updateGameStatus);
router.delete('/games/:id', adminAuth, requirePermission('game:write'), deleteGame);

// 陪玩师申请管理
router.get('/companion-applications', adminAuth, requirePermission('companion:read'), validateQuery(paginationQuerySchema), getCompanionApplicationList);
router.get('/companion-applications/:id', adminAuth, requirePermission('companion:read'), getCompanionApplicationDetail);
router.put('/companion-applications/:id/approve', adminAuth, requirePermission('companion:write'), approveCompanionApplication);
router.put('/companion-applications/:id/reject', adminAuth, requirePermission('companion:write'), rejectCompanionApplication);
router.delete('/companion-applications/:id', adminAuth, requirePermission('companion:write'), deleteCompanionApplication);

// 虚拟用户管理
router.get('/virtual-users', adminAuth, requirePermission('virtual:read'), validateQuery(paginationQuerySchema), getVirtualUserList);
router.get('/virtual-users/:id', adminAuth, requirePermission('virtual:read'), getVirtualUserDetail);
router.post('/virtual-users', adminAuth, requirePermission('virtual:write'), createVirtualUser);
router.put('/virtual-users/:id', adminAuth, requirePermission('virtual:write'), updateVirtualUser);
router.delete('/virtual-users/:id', adminAuth, requirePermission('virtual:write'), deleteVirtualUser);
router.put('/virtual-users/:id/status', adminAuth, requirePermission('virtual:write'), toggleVirtualUserStatus);
router.get('/virtual-users/:id/chat-history', adminAuth, requirePermission('virtual:read'), validateQuery(paginationQuerySchema), getVirtualUserChatHistory);

// 卡密管理
router.get('/cards', adminAuth, requirePermission('card:read'), validateQuery(paginationQuerySchema), getCardList);
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

// ================ 兼容性 API（@deprecated，2026-10-20 盘点） ================
// 保留给仓外旧后台 / 旧脚本；仓内 admin-frontend 已全部改走上方 RESTful 新端点。
// 决策：**不删除、不改行为**，仅在此标注废弃与替代端点；新调用一律使用替代端点。
// 删除条件：确认无仓外旧客户端后再整体移除，并同步删 API 文档 22.21 对应行。
// @deprecated → GET /api/admin/dashboard（兼容别名）
router.get('/statistics', adminAuth, requirePermission('dashboard:read'), getDashboardStats);

// @deprecated → PUT /api/admin/users/:id/status（兼容别名）
router.post('/update-user-status', adminAuth, requirePermission('user:write'), (req, res, next) => {
  // 转换旧API到新API
  if (req.body.userId) {
    req.params.id = req.body.userId;
  }
  updateUserStatus(req, res, next);
});

// @deprecated → GET /api/admin/users/:id（兼容别名）
router.get('/user-detail', adminAuth, requirePermission('user:read'), (req, res, next) => {
  if (req.query.userId) {
    req.params.id = req.query.userId;
  }
  getUserDetail(req, res, next);
});

// @deprecated → POST /api/admin/withdraws/:id/approve|reject（兼容别名）
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

// @deprecated → POST /api/admin/reports/:id/handle（兼容别名）
router.post('/handle-report', adminAuth, requirePermission('report:write'), (req, res, next) => {
  if (req.body.reportId) {
    req.params.id = req.body.reportId;
  }
  handleReport(req, res, next);
});

// @deprecated → GET/DELETE /api/admin/recharge-records（兼容别名）
router.get('/recharges', adminAuth, requirePermission('recharge:read'), validateQuery(paginationQuerySchema), getRechargeRecordList);
router.get('/recharges/:id', adminAuth, requirePermission('recharge:read'), getRechargeRecordDetail);
router.delete('/recharges/:id', adminAuth, requirePermission('recharge:write'), deleteRechargeRecord);

// @deprecated → POST /api/admin/reports/:id/handle（兼容别名）
router.put('/reports/:id', adminAuth, requirePermission('report:write'), (req, res, next) => {
  // 把 body 里的 status 传递给 handleReport
  handleReport(req, res, next);
});

// @deprecated → PUT /api/admin/companion-applications/:id/approve|reject（兼容别名）
router.post('/companion-applications/:id/approve', adminAuth, requirePermission('companion:write'), (req, res, next) => {
  approveCompanionApplication(req, res, next);
});

router.post('/companion-applications/:id/reject', adminAuth, requirePermission('companion:write'), (req, res, next) => {
  rejectCompanionApplication(req, res, next);
});

module.exports = router;
