const { Feedback } = require('../models');
const { getTimestamp, parseQuery } = require('../utils/helper');

const VALID_TYPES = ['bug', 'suggest', 'report', 'other'];

const TYPE_TEXT = {
  bug: '功能问题',
  suggest: '意见建议',
  report: '内容举报',
  other: '其他问题'
};
const MAX_CONTENT_LEN = 1000;
const MAX_IMAGES = 6;

const STATUS_TEXT = {
  0: '处理中',
  1: '已处理',
  2: '已关闭'
};

const STATUS_KEY = {
  0: 'pending',
  1: 'done',
  2: 'closed'
};

// 提交反馈
const submitFeedback = async (userId, { type, content, images, contact }) => {
  const text = String(content || '').trim();
  if (!text) {
    throw new Error('反馈内容不能为空');
  }
  if (text.length > MAX_CONTENT_LEN) {
    throw new Error(`反馈内容不能超过${MAX_CONTENT_LEN}字`);
  }

  const feedbackType = VALID_TYPES.includes(type) ? type : 'other';
  const imageList = Array.isArray(images) ? images.filter(Boolean).slice(0, MAX_IMAGES) : [];

  const record = await Feedback.create({
    user_id: userId,
    type: feedbackType,
    content: text,
    images: imageList.join(','),
    contact: String(contact || '').trim().slice(0, 64),
    status: 0,
    create_time: getTimestamp(),
    update_time: getTimestamp()
  });

  return { feedbackId: record.id };
};

// 我的反馈历史
const getMyFeedbacks = async (userId, page, pageSize) => {
  const { offset, limit } = parseQuery({ page, pageSize });

  const { count, rows } = await Feedback.findAndCountAll({
    where: { user_id: userId },
    offset,
    limit,
    order: [['create_time', 'DESC']]
  });

  return {
    total: count,
    list: rows.map(item => ({
      feedbackId: item.id,
      type: item.type,
      typeText: TYPE_TEXT[item.type] || '其他问题',
      content: item.content,
      images: item.images ? item.images.split(',').filter(Boolean) : [],
      contact: item.contact || '',
      status: STATUS_KEY[item.status] || 'pending',
      statusText: STATUS_TEXT[item.status] || '处理中',
      reply: item.reply || '',
      createTime: item.create_time
    }))
  };
};

module.exports = {
  submitFeedback,
  getMyFeedbacks
};
