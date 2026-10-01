const { VirtualUser, VirtualChatHistory, VirtualUserTag, VirtualUserTagRelation } = require('../models');
const { getTimestamp, parseQuery, formatPaginatedResponse } = require('../utils/helper');
const logger = require('../utils/logger');
const config = require('../config');
const sequelize = require('../config/mysql');
const llmService = require('./llmService');

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

// 事务辅助：真实数据库模式下使用 Sequelize 事务；Mock 模式下无事务能力，直接执行
const withTransaction = async (fn) => {
  if (sequelize && typeof sequelize.transaction === 'function') {
    return sequelize.transaction(fn);
  }
  return fn({});
};

const validateRandomOnline = (data) => {
  const start = data.online_time_start;
  const end = data.online_time_end;
  if (start !== undefined && start !== '' && !TIME_PATTERN.test(start)) {
    throw new Error('在线时段开始时间格式应为 HH:mm，例如 09:00');
  }
  if (end !== undefined && end !== '' && !TIME_PATTERN.test(end)) {
    throw new Error('在线时段结束时间格式应为 HH:mm，例如 23:00');
  }
  const min = data.online_duration_min;
  const max = data.online_duration_max;
  if (min !== undefined && (!Number.isInteger(Number(min)) || Number(min) < 1)) {
    throw new Error('随机在线最短时长应为不小于 1 的整数（分钟）');
  }
  if (max !== undefined && (!Number.isInteger(Number(max)) || Number(max) < 1)) {
    throw new Error('随机在线最长时长应为不小于 1 的整数（分钟）');
  }
  if (min !== undefined && max !== undefined && Number(min) > Number(max)) {
    throw new Error('随机在线最短时长不能大于最长时长');
  }
};

const createVirtualUser = async (data) => {
  const {
    name,
    avatar,
    gender = 0,
    age = 0,
    region,
    tags,
    intro,
    price_per_hour = 0,
    online_status = 0,
    random_online = 0,
    online_time_start = '09:00',
    online_time_end = '23:00',
    online_duration_min = 30,
    online_duration_max = 90,
    is_recommend = 0,
    status = 1,
    tagIds = []
  } = data;

  if (!name) {
    throw new Error('姓名不能为空');
  }

  validateRandomOnline(data);

  try {
    const virtualUser = await VirtualUser.create({
      name,
      avatar,
      gender,
      age,
      region,
      tags: typeof tags === 'object' && tags !== null ? JSON.stringify(tags) : tags,
      intro,
      price_per_hour,
      online_status,
      random_online,
      online_time_start,
      online_time_end,
      online_duration_min,
      online_duration_max,
      online_until: 0,
      is_recommend,
      status,
      create_time: getTimestamp(),
      update_time: getTimestamp()
    });

    if (tagIds && tagIds.length > 0) {
      for (const tagId of tagIds) {
        await VirtualUserTagRelation.create({
          virtual_user_id: virtualUser.id,
          tag_id: tagId,
          create_time: getTimestamp()
        });
      }
    }

    logger.info(`虚拟用户创建成功: ${name} (ID: ${virtualUser.id})`);
    return getVirtualUserById(virtualUser.id);
  } catch (dbError) {
    logger.error('虚拟用户数据库操作失败:', dbError.message);
    throw dbError;
  }
};

const getVirtualUserById = async (id) => {
  try {
    const user = await VirtualUser.findByPk(id);
    if (!user) {
      throw new Error('虚拟用户不存在');
    }
    const result = formatVirtualUser(user);
    result.tags = await getUserTagDetails(user.id);
    return result;
  } catch (dbError) {
    logger.error('虚拟用户数据库查询失败:', dbError.message);
    throw dbError;
  }
};

const getUserTagDetails = async (virtualUserId) => {
  const relations = await VirtualUserTagRelation.findAll({
    where: { virtual_user_id: virtualUserId },
    order: [['create_time', 'DESC']]
  });

  const tags = [];
  for (const relation of relations) {
    const tag = await VirtualUserTag.findByPk(relation.tag_id);
    if (tag && tag.status === 1) {
      tags.push({
        id: tag.id,
        name: tag.name,
        icon: tag.icon,
        sort_order: tag.sort_order,
        status: tag.status
      });
    }
  }
  return tags;
};

// 批量查询多个虚拟用户的标签（2 次查询替代 N+1）
const getBatchUserTagMap = async (userIds) => {
  const map = {};
  if (!userIds || userIds.length === 0) {
    return map;
  }
  const Op = require('sequelize').Op;

  const relations = await VirtualUserTagRelation.findAll({
    where: { virtual_user_id: { [Op.in]: userIds } },
    order: [['create_time', 'DESC']]
  });
  if (relations.length === 0) {
    return map;
  }

  const tagIds = [...new Set(relations.map(r => r.tag_id))];
  const tags = await VirtualUserTag.findAll({
    where: { id: { [Op.in]: tagIds } }
  });
  const tagMap = new Map(tags.map(t => [t.id, t]));

  for (const relation of relations) {
    const tag = tagMap.get(relation.tag_id);
    if (tag && tag.status === 1) {
      if (!map[relation.virtual_user_id]) {
        map[relation.virtual_user_id] = [];
      }
      map[relation.virtual_user_id].push({
        id: tag.id,
        name: tag.name,
        icon: tag.icon,
        sort_order: tag.sort_order,
        status: tag.status
      });
    }
  }
  return map;
};

const getAllVirtualUsers = async (query) => {
  const { page, pageSize, offset, limit } = parseQuery(query);
  const where = {};
  const Op = require('sequelize').Op;

  if (query.status !== undefined && query.status !== '') {
    where.status = parseInt(query.status);
  }

  if (query.online_status !== undefined && query.online_status !== '') {
    where.online_status = parseInt(query.online_status);
  }

  if (query.is_recommend !== undefined && query.is_recommend !== '') {
    where.is_recommend = parseInt(query.is_recommend);
  }

  if (query.keyword) {
    where[Op.or] = [
      { name: { [Op.like]: `%${query.keyword}%` } },
      { region: { [Op.like]: `%${query.keyword}%` } },
      { intro: { [Op.like]: `%${query.keyword}%` } }
    ];
  }

  let users = [];
  let total = 0;

  try {
    const { count, rows } = await VirtualUser.findAndCountAll({
      where,
      offset,
      limit,
      order: [['create_time', 'DESC']]
    });

    // 批量查询标签，避免逐用户 N+1 查询
    const tagMap = await getBatchUserTagMap(rows.map(u => u.id));
    for (const user of rows) {
      const result = formatVirtualUser(user);
      result.tags = tagMap[user.id] || [];
      users.push(result);
    }
    total = count;
  } catch (dbError) {
    logger.error('虚拟用户数据库查询失败:', dbError.message);
    throw dbError;
  }

  return formatPaginatedResponse(users, total, page, pageSize);
};

const updateVirtualUser = async (id, data) => {
  try {
    const user = await VirtualUser.findByPk(id);
    if (!user) {
      throw new Error('虚拟用户不存在');
    }

    validateRandomOnline(data);

    const updateData = { update_time: getTimestamp() };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.age !== undefined) updateData.age = data.age;
    if (data.region !== undefined) updateData.region = data.region;
    if (data.tags !== undefined) {
      updateData.tags = typeof data.tags === 'object' && data.tags !== null
        ? JSON.stringify(data.tags)
        : data.tags;
    }
    if (data.intro !== undefined) updateData.intro = data.intro;
    if (data.price_per_hour !== undefined) updateData.price_per_hour = data.price_per_hour;
    if (data.online_status !== undefined) updateData.online_status = data.online_status;
    if (data.random_online !== undefined) updateData.random_online = data.random_online;
    if (data.online_time_start !== undefined) updateData.online_time_start = data.online_time_start;
    if (data.online_time_end !== undefined) updateData.online_time_end = data.online_time_end;
    if (data.online_duration_min !== undefined) updateData.online_duration_min = data.online_duration_min;
    if (data.online_duration_max !== undefined) updateData.online_duration_max = data.online_duration_max;

    // 关闭随机在线时，清掉调度器遗留的到期时间，恢复手动管理
    if (data.random_online === 0) {
      updateData.online_until = 0;
    }

    await user.update(updateData);

    if (data.tagIds !== undefined) {
      await VirtualUserTagRelation.destroy({ where: { virtual_user_id: id } });
      for (const tagId of data.tagIds) {
        await VirtualUserTagRelation.create({
          virtual_user_id: id,
          tag_id: tagId,
          create_time: getTimestamp()
        });
      }
    }

    logger.info(`虚拟用户更新成功: ${user.name} (ID: ${user.id})`);
    return getVirtualUserById(id);
  } catch (dbError) {
    logger.error('虚拟用户数据库操作失败:', dbError.message);
    throw dbError;
  }
};

const deleteVirtualUser = async (id) => {
  try {
    const user = await VirtualUser.findByPk(id);
    if (!user) {
      throw new Error('虚拟用户不存在');
    }

    await VirtualChatHistory.destroy({ where: { virtual_user_id: id } });
    await VirtualUserTagRelation.destroy({ where: { virtual_user_id: id } });
    await user.destroy();

    logger.info(`虚拟用户删除成功: ${user.name} (ID: ${id})`);
    return true;
  } catch (dbError) {
    logger.error('虚拟用户数据库操作失败:', dbError.message);
    throw dbError;
  }
};

const toggleOnlineStatus = async (id, onlineStatus) => {
  try {
    const user = await VirtualUser.findByPk(id);
    if (!user) {
      throw new Error('虚拟用户不存在');
    }

    await user.update({
      online_status: onlineStatus ? 1 : 0,
      update_time: getTimestamp()
    });
    logger.info(`虚拟用户状态更新: ${user.name} -> ${onlineStatus ? '在线' : '离线'}`);
    return getVirtualUserById(id);
  } catch (dbError) {
    logger.error('虚拟用户数据库操作失败:', dbError.message);
    throw dbError;
  }
};

const getChatHistory = async (virtualUserId, userId, contextId, options = {}) => {
  const where = { virtual_user_id: virtualUserId, user_id: userId };
  if (contextId) {
    where.id = contextId;
  }

  const history = await VirtualChatHistory.findAll({
    where,
    order: [['create_time', 'ASC']],
    ...options
  });

  return history.map(h => ({
    id: h.id,
    content: h.content,
    type: h.type,
    sender: h.sender,
    sort_order: h.sort_order,
    create_time: h.create_time
  }));
};

const addChatRecord = async (virtualUserId, userId, content, type = 0, sender = 0, options = {}) => {
  const record = await VirtualChatHistory.create({
    virtual_user_id: virtualUserId,
    user_id: userId,
    content,
    type,
    sender,
    sort_order: 0,
    create_time: getTimestamp()
  }, options);
  return record;
};

// 裁剪超限的聊天历史，仅保留每个会话最近 chatHistoryLimit 条记录
const trimChatHistory = async (virtualUserId, userId, options = {}) => {
  const limit = config.virtualUser.chatHistoryLimit;
  if (!limit || limit <= 0) {
    return;
  }

  const history = await getChatHistory(virtualUserId, userId, null, options);
  const overflow = history.length - limit;
  if (overflow <= 0) {
    return;
  }

  const oldestIds = history.slice(0, overflow).map(h => h.id);
  await VirtualChatHistory.destroy({
    where: { id: { [require('sequelize').Op.in]: oldestIds } },
    ...options
  });
  logger.info(`虚拟用户聊天历史裁剪: 虚拟用户${virtualUserId}, 用户${userId}, 删除${oldestIds.length}条最旧记录`);
};

const clearContext = async (virtualUserId, userId, contextId) => {
  const where = { virtual_user_id: virtualUserId, user_id: userId };
  if (contextId) {
    where.id = contextId;
  }

  await VirtualChatHistory.destroy({ where });
  logger.info(`虚拟用户内容已清除: 虚拟用户${virtualUserId}, 用户${userId}`);
  return true;
};

const generateAiReply = (virtualUser, userMessage) => {
  const name = (virtualUser && virtualUser.name) || '虚拟人';
  const intro = (virtualUser && virtualUser.intro) || '';
  const msg = String(userMessage || '').trim();

  if (/你好|hello|hi|嗨|哈喽/i.test(msg)) {
    return `你好呀，我是${name}${intro ? '，' + intro : ''}，很高兴认识你！`;
  }
  if (/名字|你是谁|介绍|介绍下你自己/i.test(msg)) {
    return `我叫${name}${intro ? '，' + intro : ''}。有什么可以帮你的吗？`;
  }
  if (/笑话|好玩|有趣/i.test(msg)) {
    return `哈哈，讲个笑话：程序员最讨厌的两种人，一种是写代码不写注释的，另一种是让他写注释还不写的。`;
  }
  if (/歌|音乐|推荐.*听/i.test(msg)) {
    return `说到音乐，我最近很喜欢听轻音乐，能让人放松心情。要不要我给你推荐几首？`;
  }
  if (/做什么|功能|能干什么|擅长/i.test(msg)) {
    return `我可以陪你聊天、分享趣事${intro ? '，也擅长' + intro : ''}。想聊点什么都可以～`;
  }
  return `收到啦！我是${name}${intro ? '，' + intro : ''}。刚刚那句话我还需要再理解一下，不过我们可以先从简单的话题聊起～`;
};

const buildVirtualUserSystemPrompt = (virtualUser) => {
  const name = virtualUser.name || '虚拟人';
  const lines = [];
  lines.push(`你是${name}，一个陪伴型虚拟人。`);

  if (virtualUser.gender === 1) lines.push('你的性别：男');
  else if (virtualUser.gender === 2) lines.push('你的性别：女');

  if (virtualUser.age) lines.push(`你的年龄：${virtualUser.age}岁`);
  if (virtualUser.region) lines.push(`你的所在地：${virtualUser.region}`);
  if (virtualUser.intro) lines.push(`你的个人简介：${virtualUser.intro}`);

  let tags = [];
  if (virtualUser.tags) {
    try {
      const parsed = JSON.parse(virtualUser.tags);
      if (Array.isArray(parsed)) tags = parsed;
      else if (typeof parsed === 'string') tags = [parsed];
    } catch (e) {
      tags = [];
    }
  }
  if (tags.length > 0) lines.push(`你的特点标签：${tags.join('、')}`);

  lines.push('请用自然、口语化、符合人设的口吻和用户聊天，回复尽量简短自然（一般不超过 3 句话），不要暴露你是 AI 模型或机器人。');
  return lines.join('\n');
};

const chatWithVirtualUser = async (virtualUserId, userId, userMessage) => {
  try {
    const user = await VirtualUser.findByPk(virtualUserId);
    if (!user) {
      throw new Error('虚拟用户不存在');
    }
    if (user.status !== 1) {
      throw new Error('该虚拟用户已被禁用');
    }
    if (user.online_status !== 1) {
      throw new Error('对方当前离线，暂时无法回复，请稍后再来');
    }

    // 1) 先持久化用户消息（独立写入，失败即中止，不会产生孤立数据）
    const userRecord = await addChatRecord(virtualUserId, userId, userMessage, 0, 0);

    const history = await getChatHistory(virtualUserId, userId);

    // 2) 优先使用大模型生成回复；未配置或失败时降级为规则回复（网络调用，不进事务）
    const contextMessages = history
      .slice(-config.llm.maxContextMessages)
      .map(h => ({ role: h.sender === 1 ? 'assistant' : 'user', content: h.content }));
    let replyContent = await llmService.generateReply({
      systemPrompt: buildVirtualUserSystemPrompt(user),
      messages: contextMessages
    });
    if (!replyContent) {
      replyContent = generateAiReply(user, userMessage);
    }

    // 3) 事务内写入 AI 回复并裁剪超限历史，保证会话数据一致
    let replyRecord;
    try {
      replyRecord = await withTransaction(async (t) => {
        const record = await addChatRecord(virtualUserId, userId, replyContent, 0, 1, { transaction: t });
        await trimChatHistory(virtualUserId, userId, { transaction: t });
        return record;
      });
    } catch (writeError) {
      // 补偿：回复写入失败时删除孤立的用户消息，避免留下"有问无答"的半截记录
      await VirtualChatHistory.destroy({ where: { id: userRecord.id } }).catch(() => {});
      logger.error('虚拟用户回复写入失败，已回滚用户消息:', writeError.message);
      throw writeError;
    }

    return {
      id: replyRecord.id,
      content: replyContent,
      type: replyRecord.type,
      sender: replyRecord.sender,
      create_time: replyRecord.create_time,
      history
    };
  } catch (dbError) {
    logger.error('虚拟用户聊天失败:', dbError.message);
    throw dbError;
  }
};

const formatVirtualUser = (user) => {
  let parsedTags = user.tags;
  if (user.tags) {
    try {
      parsedTags = JSON.parse(user.tags);
    } catch (e) {
      parsedTags = user.tags;
    }
  }

  return {
    id: user.id,
    name: user.name,
    avatar: user.avatar,
    gender: user.gender,
    age: user.age,
    region: user.region,
    tags: parsedTags,
    intro: user.intro,
    price_per_hour: user.price_per_hour,
    online_status: user.online_status,
    random_online: user.random_online,
    online_time_start: user.online_time_start,
    online_time_end: user.online_time_end,
    online_duration_min: user.online_duration_min,
    online_duration_max: user.online_duration_max,
    is_recommend: user.is_recommend,
    status: user.status,
    create_time: user.create_time,
    update_time: user.update_time
  };
};

module.exports = {
  createVirtualUser,
  getVirtualUserById,
  getAllVirtualUsers,
  updateVirtualUser,
  deleteVirtualUser,
  toggleOnlineStatus,
  getChatHistory,
  addChatRecord,
  chatWithVirtualUser,
  clearContext
};
