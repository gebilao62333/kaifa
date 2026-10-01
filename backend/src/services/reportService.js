const { Report, User, Post, PostComment } = require('../models');
const { getTimestamp, parseQuery } = require('../utils/helper');

const createReport = async (userId, targetType, targetId, reason, images) => {
  let targetUserId = 0;
  
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
