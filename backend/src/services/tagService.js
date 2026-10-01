const { VirtualUserTag, VirtualUserTagRelation, VirtualUser } = require('../models');
const { getTimestamp, parseQuery, formatPaginatedResponse } = require('../utils/helper');
const logger = require('../utils/logger');

const TAG_CATEGORIES = {
  PERSONALITY: 'personality',
  EXPERTISE: 'expertise',
  STYLE: 'style',
  SCENARIO: 'scenario'
};

const createTag = async (data) => {
  const {
    name,
    icon,
    sort_order = 0,
    status = 1
  } = data;

  if (!name) {
    throw new Error('标签名称不能为空');
  }

  const tag = await VirtualUserTag.create({
    name,
    icon,
    sort_order,
    status,
    create_time: getTimestamp(),
    update_time: getTimestamp()
  });

  logger.info(`虚拟用户标签创建成功: ${name} (ID: ${tag.id})`);
  return formatTag(tag);
};

const getTagById = async (id) => {
  const tag = await VirtualUserTag.findByPk(id);
  if (!tag) {
    throw new Error('标签不存在');
  }
  return formatTag(tag);
};

const getAllTags = async (query) => {
  const { page, pageSize, offset, limit } = parseQuery(query);
  const where = {};

  if (query.status !== undefined && query.status !== '') {
    where.status = parseInt(query.status);
  }

  if (query.keyword) {
    where.name = { [VirtualUserTag.sequelize.Op.like]: `%${query.keyword}%` };
  }

  const { count, rows } = await VirtualUserTag.findAndCountAll({
    where,
    offset,
    limit,
    order: [['sort_order', 'ASC'], ['create_time', 'DESC']]
  });

  return formatPaginatedResponse(
    rows.map(formatTag),
    count,
    page,
    pageSize
  );
};

const getTagsByCategory = async (category) => {
  // 真实表结构无分类字段，返回全部启用标签
  const tags = await VirtualUserTag.findAll({
    where: { status: 1 },
    order: [['sort_order', 'ASC'], ['create_time', 'DESC']]
  });
  return tags.map(formatTag);
};

const updateTag = async (id, data) => {
  const tag = await VirtualUserTag.findByPk(id);
  if (!tag) {
    throw new Error('标签不存在');
  }

  const updateData = { update_time: getTimestamp() };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.icon !== undefined) updateData.icon = data.icon;
  if (data.sort_order !== undefined) updateData.sort_order = data.sort_order;
  if (data.status !== undefined) updateData.status = data.status;

  await tag.update(updateData);
  logger.info(`标签更新成功: ${tag.name} (ID: ${tag.id})`);
  return formatTag(tag);
};

const deleteTag = async (id) => {
  const tag = await VirtualUserTag.findByPk(id);
  if (!tag) {
    throw new Error('标签不存在');
  }

  await VirtualUserTagRelation.destroy({ where: { tag_id: id } });
  await tag.destroy();

  logger.info(`标签删除成功: ${tag.name} (ID: ${id})`);
  return true;
};

const assignTagToUser = async (virtualUserId, tagId, isPrimary = false, customConfig = {}) => {
  const user = await VirtualUser.findByPk(virtualUserId);
  if (!user) {
    throw new Error('虚拟用户不存在');
  }

  const tag = await VirtualUserTag.findByPk(tagId);
  if (!tag || tag.status !== 1) {
    throw new Error('标签不存在或已禁用');
  }

  const existing = await VirtualUserTagRelation.findOne({
    where: { virtual_user_id: virtualUserId, tag_id: tagId }
  });

  if (existing) {
    throw new Error('该标签已分配给此虚拟用户');
  }

  await VirtualUserTagRelation.create({
    virtual_user_id: virtualUserId,
    tag_id: tagId,
    create_time: getTimestamp()
  });

  logger.info(`标签分配成功: 虚拟用户${virtualUserId} -> 标签${tagId}`);
  return true;
};

const removeTagFromUser = async (virtualUserId, tagId) => {
  const relation = await VirtualUserTagRelation.findOne({
    where: { virtual_user_id: virtualUserId, tag_id: tagId }
  });

  if (!relation) {
    throw new Error('该标签未分配给此虚拟用户');
  }

  await relation.destroy();

  logger.info(`标签移除成功: 虚拟用户${virtualUserId} -> 标签${tagId}`);
  return true;
};

const getUserTags = async (virtualUserId) => {
  const relations = await VirtualUserTagRelation.findAll({
    where: { virtual_user_id: virtualUserId },
    order: [['create_time', 'DESC']]
  });

  const tags = [];
  for (const relation of relations) {
    const tag = await VirtualUserTag.findByPk(relation.tag_id);
    if (tag) {
      tags.push(formatTag(tag));
    }
  }

  return tags;
};

const setPrimaryTag = async (virtualUserId, tagId) => {
  const relation = await VirtualUserTagRelation.findOne({
    where: { virtual_user_id: virtualUserId, tag_id: tagId }
  });

  if (!relation) {
    throw new Error('该标签未分配给此虚拟用户');
  }

  logger.info(`设置主要标签: 虚拟用户${virtualUserId} -> 标签${tagId}`);
  return true;
};

const recommendTags = async (query) => {
  const { keyword, limit = 5 } = query;
  const where = { status: 1 };

  let tags = await VirtualUserTag.findAll({
    where,
    order: [['sort_order', 'ASC'], ['create_time', 'DESC']],
    limit: parseInt(limit)
  });

  if (keyword) {
    const lowerKeyword = keyword.toLowerCase();
    tags = tags.filter(tag =>
      tag.name.toLowerCase().includes(lowerKeyword)
    );
  }

  return tags.slice(0, parseInt(limit)).map(formatTag);
};

const getTagsWithUsers = async (tagId) => {
  const tag = await VirtualUserTag.findByPk(tagId);
  if (!tag) {
    throw new Error('标签不存在');
  }

  const relations = await VirtualUserTagRelation.findAll({
    where: { tag_id: tagId },
    order: [['create_time', 'DESC']]
  });

  const users = [];
  for (const relation of relations) {
    const user = await VirtualUser.findByPk(relation.virtual_user_id);
    if (user) {
      users.push({
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        gender: user.gender,
        age: user.age,
        region: user.region
      });
    }
  }

  return {
    tag: formatTag(tag),
    users,
    userCount: users.length
  };
};

const getDefaultTags = async () => {
  // 真实表结构无 is_default 字段，返回全部启用标签
  const tags = await VirtualUserTag.findAll({
    where: { status: 1 },
    order: [['sort_order', 'ASC'], ['create_time', 'DESC']]
  });
  return tags.map(formatTag);
};

const initializeDefaultTags = async () => {
  const defaultTags = [
    { name: '游戏陪玩', icon: '', sort_order: 1 },
    { name: '情感咨询', icon: '', sort_order: 2 },
    { name: '知识问答', icon: '', sort_order: 3 },
    { name: '休闲聊天', icon: '', sort_order: 4 },
    { name: '健身教练', icon: '', sort_order: 5 },
    { name: '音乐陪伴', icon: '', sort_order: 6 }
  ];

  for (const tagData of defaultTags) {
    const existing = await VirtualUserTag.findOne({ where: { name: tagData.name } });
    if (!existing) {
      await VirtualUserTag.create({
        ...tagData,
        status: 1,
        create_time: getTimestamp(),
        update_time: getTimestamp()
      });
    }
  }

  logger.info('默认标签初始化完成');
  return true;
};

const formatTag = (tag) => {
  return {
    id: tag.id,
    name: tag.name,
    icon: tag.icon,
    sort_order: tag.sort_order,
    status: tag.status,
    create_time: tag.create_time,
    update_time: tag.update_time
  };
};

module.exports = {
  TAG_CATEGORIES,
  createTag,
  getTagById,
  getAllTags,
  getTagsByCategory,
  updateTag,
  deleteTag,
  assignTagToUser,
  removeTagFromUser,
  getUserTags,
  setPrimaryTag,
  recommendTags,
  getTagsWithUsers,
  getDefaultTags,
  initializeDefaultTags
};
