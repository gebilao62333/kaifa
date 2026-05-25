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

const getReportList = async (status, page, pageSize) => {
  const { offset, limit } = parseQuery({ page, pageSize });
  
  const where = {};
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

module.exports = {
  createReport,
  getReportList,
  handleReport
};
