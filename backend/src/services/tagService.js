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
    code,
    description,
    category,
    icon,
    color,
    personality,
    expertise,
    communicationStyle,
    knowledgeScope,
    responseStrategy,
    promptTemplate,
    temperature = 0.7,
    maxTokens = 1024,
    priority = 0,
    isDefault = false
  } = data;

  if (!name || !code) {
    throw new Error('标签名称和代码不能为空');
  }

  const existing = await VirtualUserTag.findOne({ where: { code } });
  if (existing) {
    throw new Error('标签代码已存在');
  }

  const tag = await VirtualUserTag.create({
    name,
    code,
    description,
    category: category || TAG_CATEGORIES.PERSONALITY,
    icon,
    color,
    personality: typeof personality === 'string' ? personality : JSON.stringify(personality || []),
    expertise: typeof expertise === 'string' ? expertise : JSON.stringify(expertise || []),
    communicationStyle: communicationStyle || 'friendly',
    knowledgeScope: typeof knowledgeScope === 'string' ? knowledgeScope : JSON.stringify(knowledgeScope || []),
    responseStrategy: typeof responseStrategy === 'string' ? responseStrategy : JSON.stringify(responseStrategy || {}),
    promptTemplate,
    temperature,
    maxTokens,
    priority,
    isDefault: isDefault ? 1 : 0,
    status: 1,
    usageCount: 0,
    createTime: getTimestamp(),
    updateTime: getTimestamp()
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

const getTagByCode = async (code) => {
  const tag = await VirtualUserTag.findOne({ where: { code } });
  if (!tag) {
    throw new Error('标签不存在');
  }
  return formatTag(tag);
};

const getAllTags = async (query) => {
  const { page, pageSize, offset, limit } = parseQuery(query);
  const where = {};

  if (query.status !== undefined) {
    where.status = parseInt(query.status);
  }

  if (query.category) {
    where.category = query.category;
  }

  if (query.isDefault !== undefined) {
    where.isDefault = parseInt(query.isDefault);
  }

  const { count, rows } = await VirtualUserTag.findAndCountAll({
    where,
    offset,
    limit,
    order: [['priority', 'DESC'], ['usageCount', 'DESC'], ['createTime', 'DESC']]
  });

  return formatPaginatedResponse(
    rows.map(formatTag),
    count,
    page,
    pageSize
  );
};

const getTagsByCategory = async (category) => {
  const tags = await VirtualUserTag.findAll({
    where: { category, status: 1 },
    order: [['priority', 'DESC'], ['usageCount', 'DESC']]
  });
  return tags.map(formatTag);
};

const updateTag = async (id, data) => {
  const tag = await VirtualUserTag.findByPk(id);
  if (!tag) {
    throw new Error('标签不存在');
  }

  const updateData = { updateTime: getTimestamp() };

  if (data.code !== undefined && data.code !== tag.code) {
    const existing = await VirtualUserTag.findOne({
      where: { code: data.code, id: { [VirtualUserTag.sequelize.Op.ne]: id } }
    });
    if (existing) {
      throw new Error('标签代码已存在');
    }
    updateData.code = data.code;
  }

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.icon !== undefined) updateData.icon = data.icon;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.personality !== undefined) {
    updateData.personality = typeof data.personality === 'string'
      ? data.personality
      : JSON.stringify(data.personality);
  }
  if (data.expertise !== undefined) {
    updateData.expertise = typeof data.expertise === 'string'
      ? data.expertise
      : JSON.stringify(data.expertise);
  }
  if (data.communicationStyle !== undefined) updateData.communicationStyle = data.communicationStyle;
  if (data.knowledgeScope !== undefined) {
    updateData.knowledgeScope = typeof data.knowledgeScope === 'string'
      ? data.knowledgeScope
      : JSON.stringify(data.knowledgeScope);
  }
  if (data.responseStrategy !== undefined) {
    updateData.responseStrategy = typeof data.responseStrategy === 'string'
      ? data.responseStrategy
      : JSON.stringify(data.responseStrategy);
  }
  if (data.promptTemplate !== undefined) updateData.promptTemplate = data.promptTemplate;
  if (data.temperature !== undefined) updateData.temperature = data.temperature;
  if (data.maxTokens !== undefined) updateData.maxTokens = data.maxTokens;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.isDefault !== undefined) updateData.isDefault = data.isDefault ? 1 : 0;
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

  await VirtualUserTagRelation.destroy({ where: { tagId: id } });
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
    where: { virtualUserId, tagId }
  });

  if (existing) {
    throw new Error('该标签已分配给此虚拟用户');
  }

  if (isPrimary) {
    await VirtualUserTagRelation.update(
      { isPrimary: 0 },
      { where: { virtualUserId, isPrimary: 1 } }
    );
  }

  await VirtualUserTagRelation.create({
    virtualUserId,
    tagId,
    isPrimary: isPrimary ? 1 : 0,
    customConfig: typeof customConfig === 'string' ? customConfig : JSON.stringify(customConfig),
    createTime: getTimestamp()
  });

  await VirtualUserTag.increment('usageCount', { where: { id: tagId } });

  logger.info(`标签分配成功: 虚拟用户${virtualUserId} -> 标签${tagId}`);
  return true;
};

const removeTagFromUser = async (virtualUserId, tagId) => {
  const relation = await VirtualUserTagRelation.findOne({
    where: { virtualUserId, tagId }
  });

  if (!relation) {
    throw new Error('该标签未分配给此虚拟用户');
  }

  await relation.destroy();
  await VirtualUserTag.decrement('usageCount', { where: { id: tagId } });

  logger.info(`标签移除成功: 虚拟用户${virtualUserId} -> 标签${tagId}`);
  return true;
};

const getUserTags = async (virtualUserId) => {
  const relations = await VirtualUserTagRelation.findAll({
    where: { virtualUserId },
    order: [['isPrimary', 'DESC'], ['createTime', 'DESC']]
  });

  const tags = [];
  for (const relation of relations) {
    const tag = await VirtualUserTag.findByPk(relation.tagId);
    if (tag) {
      tags.push({
        ...formatTag(tag),
        isPrimary: relation.isPrimary === 1,
        customConfig: relation.customConfig ? JSON.parse(relation.customConfig) : {}
      });
    }
  }

  return tags;
};

const setPrimaryTag = async (virtualUserId, tagId) => {
  await VirtualUserTagRelation.update(
    { isPrimary: 0 },
    { where: { virtualUserId } }
  );

  await VirtualUserTagRelation.update(
    { isPrimary: 1 },
    { where: { virtualUserId, tagId } }
  );

  logger.info(`设置主要标签: 虚拟用户${virtualUserId} -> 标签${tagId}`);
  return true;
};

const recommendTags = async (query) => {
  const { category, keyword, limit = 5 } = query;
  const where = { status: 1 };

  if (category) {
    where.category = category;
  }

  let tags = await VirtualUserTag.findAll({
    where,
    order: [['priority', 'DESC'], ['usageCount', 'DESC']],
    limit: parseInt(limit)
  });

  if (keyword) {
    const lowerKeyword = keyword.toLowerCase();
    tags = tags.filter(tag =>
      tag.name.toLowerCase().includes(lowerKeyword) ||
      tag.description?.toLowerCase().includes(lowerKeyword) ||
      tag.code.toLowerCase().includes(lowerKeyword)
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
    where: { tagId },
    order: [['createTime', 'DESC']]
  });

  const users = [];
  for (const relation of relations) {
    const user = await VirtualUser.findByPk(relation.virtualUserId);
    if (user) {
      users.push({
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        isPrimary: relation.isPrimary === 1
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
  const tags = await VirtualUserTag.findAll({
    where: { isDefault: 1, status: 1 },
    order: [['priority', 'DESC']]
  });
  return tags.map(formatTag);
};

const initializeDefaultTags = async () => {
  const defaultTags = [
    {
      name: '游戏陪玩',
      code: 'game_companion',
      description: '专业游戏陪玩助手',
      category: TAG_CATEGORIES.SCENARIO,
      color: '#FF6B6B',
      personality: JSON.stringify(['热情', '专业', '耐心']),
      expertise: JSON.stringify(['游戏攻略', '游戏技巧', '游戏推荐']),
      communicationStyle: 'friendly',
      knowledgeScope: JSON.stringify(['游戏', '电竞', '娱乐']),
      responseStrategy: JSON.stringify({ mode: 'enthusiastic', humorLevel: 0.6 }),
      promptTemplate: '你是一位专业的游戏陪玩师，性格热情开朗，专业耐心。',
      temperature: 0.8,
      maxTokens: 1024,
      priority: 100,
      isDefault: true
    },
    {
      name: '情感咨询',
      code: 'emotional_support',
      description: '情感支持与倾听',
      category: TAG_CATEGORIES.SCENARIO,
      color: '#FF69B4',
      personality: JSON.stringify(['温柔', '善解人意', '富有同理心']),
      expertise: JSON.stringify(['情感问题', '心理疏导', '人际关系']),
      communicationStyle: 'friendly',
      knowledgeScope: JSON.stringify(['心理学', '情感', '人际关系']),
      responseStrategy: JSON.stringify({ mode: 'empathetic', humorLevel: 0.2 }),
      promptTemplate: '你是一位温柔善解人意的情感咨询师，富有同理心，善于倾听和疏导。',
      temperature: 0.6,
      maxTokens: 1024,
      priority: 90,
      isDefault: true
    },
    {
      name: '知识问答',
      code: 'knowledge_qa',
      description: '专业知识问答助手',
      category: TAG_CATEGORIES.SCENARIO,
      color: '#4ECDC4',
      personality: JSON.stringify(['严谨', '专业', '逻辑清晰']),
      expertise: JSON.stringify(['科学技术', '历史人文', '生活常识']),
      communicationStyle: 'professional',
      knowledgeScope: JSON.stringify(['科学', '技术', '教育', '百科']),
      responseStrategy: JSON.stringify({ mode: 'professional', humorLevel: 0.3 }),
      promptTemplate: '你是一位知识渊博的问答助手，回答严谨专业，逻辑清晰。',
      temperature: 0.5,
      maxTokens: 1024,
      priority: 80,
      isDefault: true
    },
    {
      name: '休闲聊天',
      code: 'casual_chat',
      description: '轻松休闲聊天伙伴',
      category: TAG_CATEGORIES.SCENARIO,
      color: '#95E1D3',
      personality: JSON.stringify(['活泼', '幽默', '亲切']),
      expertise: JSON.stringify(['日常闲聊', '趣味话题', '轻松娱乐']),
      communicationStyle: 'humorous',
      knowledgeScope: JSON.stringify(['生活', '娱乐', '时尚', '美食']),
      responseStrategy: JSON.stringify({ mode: 'casual', humorLevel: 0.8 }),
      promptTemplate: '你是一位活泼幽默的聊天伙伴，说话亲切有趣，喜欢轻松的话题。',
      temperature: 0.9,
      maxTokens: 1024,
      priority: 70,
      isDefault: true
    },
    {
      name: '编程助手',
      code: 'coding_assistant',
      description: '编程开发辅助',
      category: TAG_CATEGORIES.EXPERTISE,
      color: '#667EEA',
      personality: JSON.stringify(['严谨', '逻辑性强', '乐于助人']),
      expertise: JSON.stringify(['编程开发', '代码调试', '技术架构']),
      communicationStyle: 'professional',
      knowledgeScope: JSON.stringify(['编程', '算法', '架构', '开发']),
      responseStrategy: JSON.stringify({ mode: 'technical', humorLevel: 0.2 }),
      promptTemplate: '你是一位专业的编程助手，严谨逻辑，乐于助人，擅长代码调试和技术架构。',
      temperature: 0.4,
      maxTokens: 2048,
      priority: 95,
      isDefault: true
    }
  ];

  for (const tagData of defaultTags) {
    const existing = await VirtualUserTag.findOne({ where: { code: tagData.code } });
    if (!existing) {
      await VirtualUserTag.create({
        ...tagData,
        status: 1,
        usageCount: 0,
        createTime: getTimestamp(),
        updateTime: getTimestamp()
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
    code: tag.code,
    description: tag.description,
    category: tag.category,
    icon: tag.icon,
    color: tag.color,
    personality: tag.personality ? JSON.parse(tag.personality) : [],
    expertise: tag.expertise ? JSON.parse(tag.expertise) : [],
    communicationStyle: tag.communicationStyle,
    knowledgeScope: tag.knowledgeScope ? JSON.parse(tag.knowledgeScope) : [],
    responseStrategy: tag.responseStrategy ? JSON.parse(tag.responseStrategy) : {},
    promptTemplate: tag.promptTemplate,
    temperature: parseFloat(tag.temperature),
    maxTokens: tag.maxTokens,
    priority: tag.priority,
    isDefault: tag.isDefault === 1,
    status: tag.status,
    usageCount: tag.usageCount,
    createTime: tag.createTime,
    updateTime: tag.updateTime
  };
};

module.exports = {
  TAG_CATEGORIES,
  createTag,
  getTagById,
  getTagByCode,
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
