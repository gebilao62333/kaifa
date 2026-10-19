const { Report, User, Post, PostComment, ChatLog } = require('../models');
const sequelize = require('../config/mysql');
const { getTimestamp, parseQuery } = require('../utils/helper');

const createReport = async (userId, targetType, targetId, reason, images) => {
  let targetUserId = 0;
  
  // 4 = 聊天消息：举报即冻结该消息的自动撤回/已读销毁期限，否则管理员核查时内容已被清掉
  if (targetType === 4) {
    const message = await ChatLog.findByPk(targetId);
    if (!message || message.is_del === 1) throw new Error('消息不存在或已销毁');
    if (message.fromid !== userId && message.toid !== userId) throw new Error('无权举报该消息');
    if (message.fromid === userId) throw new Error('不能举报自己发送的消息');
    if (message.is_revoked === 1) throw new Error('消息已撤回，无法举报');
    const nowSec = getTimestamp();
    if (Number(message.destroy_at) > 0 && Number(message.destroy_at) <= nowSec) throw new Error('消息已销毁，无法举报');
    targetUserId = message.fromid;

    const report = await sequelize.transaction(async (transaction) => {
      const created = await Report.create({
        user_id: userId,
        target_user_id: targetUserId,
        target_type: targetType,
        target_id: targetId,
        reason,
        images: images ? images.join(',') : '',
        status: 0,
        create_time: nowSec
      }, { transaction });
      // 冻结：清掉两类到期时间，消息从此不会被自动撤回/销毁（仍可人工处置）
      await message.update({ destroy_at: 0, expire_at: 0 }, { transaction });
      return created;
    });

    return {
      reportId: report.id
    };
  }

  if (targetType === 1) {
    const user = await User.findByPk(targetId);
    if (!user) throw new Error('用户不存在');
    targetUserId = targetId;
  } else if (targetType === 2) {
    const post = await Post.findByPk(targetId);
    if (!post) throw new Error('帖子不存在');
    targetUserId = post.user_id;
  } else if (targetType === 3) {
    const comment = await PostComment.findByPk(targetId);
    if (!comment) throw new Error('评论不存在');
    targetUserId = comment.user_id;
  }
  
  const report = await Report.create({
    user_id: userId,
    target_user_id: targetUserId,
    target_type: targetType,
    target_id: targetId,
    reason,
    images: images ? images.join(',') : '',
    status: 0,
    create_time: getTimestamp()
  });
  
  return {
    reportId: report.id
  };
};

const getReportList = async (userId, status, page, pageSize) => {
  const { offset, limit } = parseQuery({ page, pageSize });

  // 仅返回当前用户自己提交的举报，避免泄露全站举报数据（全量查询走 /api/admin/reports）
  const where = { user_id: userId };
  if (status !== undefined) {
    where.status = status;
  }
  
  const { count, rows } = await Report.findAndCountAll({
    where,
    offset,
    limit,
    order: [['create_time', 'DESC']]
  });
  
  const reports = await Promise.all(rows.map(async (report) => {
    let reporter = await User.findByPk(report.user_id);
    let targetUser = await User.findByPk(report.target_user_id);
    
    return {
      reportId: report.id,
      reporterId: report.user_id,
      reporterName: reporter?.nickname || '',
      targetType: report.target_type,
      targetId: report.target_id,
      targetUserId: report.target_user_id,
      targetUserName: targetUser?.nickname || '',
      reason: report.reason,
      images: report.images ? report.images.split(',').filter(Boolean) : [],
      status: report.status,
      handleResult: report.handle_result,
      handleTime: report.handle_time,
      createTime: report.create_time
    };
  }));
  
  return {
    total: count,
    list: reports
  };
};

const handleReport = async (handlerId, reportId, action, result) => {
  const report = await Report.findByPk(reportId);
  
  if (!report) {
    throw new Error('举报不存在');
  }
  
  if (report.status !== 0) {
    throw new Error('举报已处理');
  }
  
  await report.update({
    status: 2,
    handle_result: result,
    handle_time: getTimestamp()
  });
  
  return true;
};

const getReportDetail = async (userId, reportId) => {
  const report = await Report.findByPk(reportId);
  if (!report) {
    throw new Error('举报不存在');
  }

  // 用户仅能查看自己提交的举报详情
  if (report.user_id !== userId) {
    throw new Error('无权查看该举报');
  }

  const user = await User.findByPk(report.user_id);
  const targetUser = await User.findByPk(report.target_user_id);

  return {
    reportId: report.id,
    user: {
      userId: user?.id,
      nickname: user?.nickname || '',
      avatar: user?.avatar || ''
    },
    targetType: report.target_type,
    targetId: report.target_id,
    targetUser: {
      userId: targetUser?.id,
      nickname: targetUser?.nickname || '',
      avatar: targetUser?.avatar || ''
    },
    reason: report.reason,
    images: report.images ? report.images.split(',').filter(Boolean) : [],
    status: report.status,
    handleResult: report.handle_result,
    handleTime: report.handle_time,
    createTime: report.create_time
  };
};

module.exports = {
  createReport,
  getReportList,
  getReportDetail,
  handleReport
};
