const { VirtualUser, VirtualChatHistory, VirtualUserTag, VirtualUserTagRelation } = require('../models');
const { getTimestamp, generateUUID, parseQuery, formatPaginatedResponse } = require('../utils/helper');
const logger = require('../utils/logger');

let mockVirtualUsers = [
  { id: 1, username: 'xiaoxin', nickname: '小新', avatar: '', role: 'companion', personality: '活泼开朗，喜欢游戏', dialogueStyle: 'friendly', description: '游戏陪玩师，擅长各种游戏', modelConfig: '{}', status: 1, isOnline: 1, contextExpireTime: 3600, maxContextLength: 50, permissions: '[]', createTime: Date.now() - 86400000, updateTime: Date.now() - 86400000 },
  { id: 2, username: 'xiaomei', nickname: '小美', avatar: '', role: 'guide', personality: '温柔体贴，耐心细致', dialogueStyle: 'professional', description: '平台向导，熟悉平台功能', modelConfig: '{}', status: 1, isOnline: 1, contextExpireTime: 3600, maxContextLength: 50, permissions: '[]', createTime: Date.now() - 172800000, updateTime: Date.now() - 172800000 },
  { id: 3, username: 'xiaolong', nickname: '小龙', avatar: '', role: 'assistant', personality: '幽默风趣，热爱运动', dialogueStyle: 'humorous', description: 'AI助手，提供各种服务', modelConfig: '{}', status: 1, isOnline: 0, contextExpireTime: 3600, maxContextLength: 50, permissions: '[]', createTime: Date.now() - 259200000, updateTime: Date.now() - 259200000 },
  { id: 4, username: 'xiaoxue', nickname: '小雪', avatar: '', role: 'default', personality: '可爱甜美，喜欢聊天', dialogueStyle: 'cute', description: '虚拟好友，陪你聊天', modelConfig: '{}', status: 0, isOnline: 0, contextExpireTime: 3600, maxContextLength: 50, permissions: '[]', createTime: Date.now() - 345600000, updateTime: Date.now() - 345600000 }
];

let nextMockId = 5;

const AI_MODELS = {
  OPENAI: 'openai',
  DOUBAO: 'doubao',
  QWEN: 'qwen',
  CLAUDE: 'claude',
  DEEPSEEK: 'deepseek'
};

const createVirtualUser = async (data) => {
  const {
    username,
    nickname,
    avatar,
    role = 'default',
    personality,
    dialogueStyle = 'friendly',
    description,
    modelConfig = {},
    contextExpireTime = 3600,
    maxContextLength = 50,
    permissions = [],
    tagIds = []
  } = data;

  if (!username || !nickname) {
    throw new Error('用户名和昵称不能为空');
  }

  try {
    const existing = await VirtualUser.findOne({ where: { username } });
    if (existing) {
      throw new Error('用户名已存在');
    }

    const virtualUser = await VirtualUser.create({
      username,
      nickname,
      avatar,
      role,
      personality,
      dialogueStyle,
      description,
      modelConfig: typeof modelConfig === 'string' ? modelConfig : JSON.stringify(modelConfig),
      status: 1,
      isOnline: 1,
      contextExpireTime,
      maxContextLength,
      permissions: typeof permissions === 'string' ? permissions : JSON.stringify(permissions),
      createTime: getTimestamp(),
      updateTime: getTimestamp()
    });

    if (tagIds && tagIds.length > 0) {
      for (let i = 0; i < tagIds.length; i++) {
        await VirtualUserTagRelation.create({
          virtualUserId: virtualUser.id,
          tagId: tagIds[i],
          isPrimary: i === 0 ? 1 : 0,
          customConfig: '{}',
          createTime: getTimestamp()
        });
        await VirtualUserTag.increment('usageCount', { where: { id: tagIds[i] } });
      }
    }

    logger.info(`虚拟用户创建成功: ${username} (ID: ${virtualUser.id})`);
    return getVirtualUserById(virtualUser.id);
  } catch (dbError) {
    console.warn('虚拟用户数据库操作失败，使用Mock数据:', dbError.message);
    
    const existing = mockVirtualUsers.find(u => u.username === username);
    if (existing) {
      throw new Error('用户名已存在');
    }

    const newUser = {
      id: nextMockId++,
      username,
      nickname,
      avatar: avatar || '',
      role,
      personality,
      dialogueStyle,
      description,
      modelConfig: typeof modelConfig === 'string' ? modelConfig : JSON.stringify(modelConfig),
      status: 1,
      isOnline: 1,
      contextExpireTime,
      maxContextLength,
      permissions: typeof permissions === 'string' ? permissions : JSON.stringify(permissions),
      createTime: getTimestamp(),
      updateTime: getTimestamp()
    };

    mockVirtualUsers.push(newUser);
    logger.info(`虚拟用户创建成功(Mock): ${username} (ID: ${newUser.id})`);
    
    const result = formatVirtualUser(newUser);
    result.tags = [];
    return result;
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
    console.warn('虚拟用户数据库查询失败，使用Mock数据:', dbError.message);
    const user = mockVirtualUsers.find(u => u.id === parseInt(id));
    if (!user) {
      throw new Error('虚拟用户不存在');
    }
    const result = formatVirtualUser(user);
    result.tags = [];
    return result;
  }
};

const getVirtualUserByUsername = async (username) => {
  const user = await VirtualUser.findOne({ where: { username } });
  if (!user) {
    throw new Error('虚拟用户不存在');
  }
  const result = formatVirtualUser(user);
  result.tags = await getUserTagDetails(user.id);
  return result;
};

const getUserTagDetails = async (virtualUserId) => {
  const relations = await VirtualUserTagRelation.findAll({
    where: { virtualUserId },
    order: [['isPrimary', 'DESC'], ['createTime', 'DESC']]
  });

  const tags = [];
  for (const relation of relations) {
    const tag = await VirtualUserTag.findByPk(relation.tagId);
    if (tag && tag.status === 1) {
      tags.push({
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
        isPrimary: relation.isPrimary === 1,
        customConfig: relation.customConfig ? JSON.parse(relation.customConfig) : {}
      });
    }
  }
  return tags;
};

const getAllVirtualUsers = async (query) => {
  const { page, pageSize, offset, limit } = parseQuery(query);
  const where = {};

  if (query.status !== undefined) {
    where.status = parseInt(query.status);
  }

  if (query.isOnline !== undefined) {
    where.isOnline = parseInt(query.isOnline);
  }

  if (query.role) {
    where.role = query.role;
  }

  let users = [];
  let total = 0;

  try {
    const { count, rows } = await VirtualUser.findAndCountAll({
      where,
      offset,
      limit,
      order: [['createTime', 'DESC']]
    });

    for (const user of rows) {
      const result = formatVirtualUser(user);
      result.tags = await getUserTagDetails(user.id);
      users.push(result);
    }
    total = count;
  } catch (dbError) {
    console.warn('虚拟用户数据库查询失败，使用Mock数据:', dbError.message);
    
    let filteredUsers = [...mockVirtualUsers];
    
    if (query.status !== undefined) {
      filteredUsers = filteredUsers.filter(u => u.status === parseInt(query.status));
    }
    
    if (query.isOnline !== undefined) {
      filteredUsers = filteredUsers.filter(u => u.isOnline === parseInt(query.isOnline));
    }
    
    if (query.role) {
      filteredUsers = filteredUsers.filter(u => u.role === query.role);
    }
    
    filteredUsers.sort((a, b) => b.createTime - a.createTime);
    
    users = filteredUsers.slice(offset, offset + parseInt(limit)).map(u => {
      const result = formatVirtualUser(u);
      result.tags = [];
      return result;
    });
    total = filteredUsers.length;
  }

  return formatPaginatedResponse(users, total, page, pageSize);
};

const updateVirtualUser = async (id, data) => {
  try {
    const user = await VirtualUser.findByPk(id);
    if (!user) {
      throw new Error('虚拟用户不存在');
    }

    const updateData = { updateTime: getTimestamp() };

    if (data.username !== undefined) {
      const existing = await VirtualUser.findOne({
        where: { username: data.username, id: { [VirtualUser.sequelize.Op.ne]: id } }
      });
      if (existing) {
        throw new Error('用户名已存在');
      }
      updateData.username = data.username;
    }

    if (data.nickname !== undefined) updateData.nickname = data.nickname;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.personality !== undefined) updateData.personality = data.personality;
    if (data.dialogueStyle !== undefined) updateData.dialogueStyle = data.dialogueStyle;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.modelConfig !== undefined) {
      updateData.modelConfig = typeof data.modelConfig === 'string'
        ? data.modelConfig
        : JSON.stringify(data.modelConfig);
    }
    if (data.status !== undefined) updateData.status = data.status;
    if (data.isOnline !== undefined) updateData.isOnline = data.isOnline;
    if (data.contextExpireTime !== undefined) updateData.contextExpireTime = data.contextExpireTime;
    if (data.maxContextLength !== undefined) updateData.maxContextLength = data.maxContextLength;
    if (data.permissions !== undefined) {
      updateData.permissions = typeof data.permissions === 'string'
        ? data.permissions
        : JSON.stringify(data.permissions);
    }

    await user.update(updateData);

    if (data.tagIds !== undefined) {
      await VirtualUserTagRelation.destroy({ where: { virtualUserId: id } });
      for (let i = 0; i < data.tagIds.length; i++) {
        await VirtualUserTagRelation.create({
          virtualUserId: id,
          tagId: data.tagIds[i],
          isPrimary: i === 0 ? 1 : 0,
          customConfig: '{}',
          createTime: getTimestamp()
        });
        await VirtualUserTag.increment('usageCount', { where: { id: data.tagIds[i] } });
      }
    }

    logger.info(`虚拟用户更新成功: ${user.username} (ID: ${user.id})`);
    return getVirtualUserById(id);
  } catch (dbError) {
    console.warn('虚拟用户数据库操作失败，使用Mock数据:', dbError.message);
    
    const userIndex = mockVirtualUsers.findIndex(u => u.id === parseInt(id));
    if (userIndex === -1) {
      throw new Error('虚拟用户不存在');
    }

    const user = mockVirtualUsers[userIndex];

    if (data.username !== undefined) {
      const existing = mockVirtualUsers.find(u => u.username === data.username && u.id !== parseInt(id));
      if (existing) {
        throw new Error('用户名已存在');
      }
      user.username = data.username;
    }

    if (data.nickname !== undefined) user.nickname = data.nickname;
    if (data.avatar !== undefined) user.avatar = data.avatar;
    if (data.role !== undefined) user.role = data.role;
    if (data.personality !== undefined) user.personality = data.personality;
    if (data.dialogueStyle !== undefined) user.dialogueStyle = data.dialogueStyle;
    if (data.description !== undefined) user.description = data.description;
    if (data.modelConfig !== undefined) {
      user.modelConfig = typeof data.modelConfig === 'string' ? data.modelConfig : JSON.stringify(data.modelConfig);
    }
    if (data.status !== undefined) user.status = data.status;
    if (data.isOnline !== undefined) user.isOnline = data.isOnline;
    if (data.contextExpireTime !== undefined) user.contextExpireTime = data.contextExpireTime;
    if (data.maxContextLength !== undefined) user.maxContextLength = data.maxContextLength;
    if (data.permissions !== undefined) {
      user.permissions = typeof data.permissions === 'string' ? data.permissions : JSON.stringify(data.permissions);
    }

    user.updateTime = getTimestamp();

    logger.info(`虚拟用户更新成功(Mock): ${user.username} (ID: ${user.id})`);
    
    const result = formatVirtualUser(user);
    result.tags = [];
    return result;
  }
};

const deleteVirtualUser = async (id) => {
  try {
    const user = await VirtualUser.findByPk(id);
    if (!user) {
      throw new Error('虚拟用户不存在');
    }

    await VirtualChatHistory.destroy({ where: { virtualUserId: id } });
    await VirtualUserTagRelation.destroy({ where: { virtualUserId: id } });
    await user.destroy();

    logger.info(`虚拟用户删除成功: ${user.username} (ID: ${id})`);
    return true;
  } catch (dbError) {
    console.warn('虚拟用户数据库操作失败，使用Mock数据:', dbError.message);
    
    const userIndex = mockVirtualUsers.findIndex(u => u.id === parseInt(id));
    if (userIndex === -1) {
      throw new Error('虚拟用户不存在');
    }

    const user = mockVirtualUsers[userIndex];
    mockVirtualUsers.splice(userIndex, 1);

    logger.info(`虚拟用户删除成功(Mock): ${user.username} (ID: ${id})`);
    return true;
  }
};

const toggleOnlineStatus = async (id, isOnline) => {
  try {
    const user = await VirtualUser.findByPk(id);
    if (!user) {
      throw new Error('虚拟用户不存在');
    }

    await user.update({ isOnline: isOnline ? 1 : 0, updateTime: getTimestamp() });
    logger.info(`虚拟用户状态更新: ${user.username} -> ${isOnline ? '在线' : '离线'}`);
    return getVirtualUserById(id);
  } catch (dbError) {
    console.warn('虚拟用户数据库操作失败，使用Mock数据:', dbError.message);
    
    const userIndex = mockVirtualUsers.findIndex(u => u.id === parseInt(id));
    if (userIndex === -1) {
      throw new Error('虚拟用户不存在');
    }

    const user = mockVirtualUsers[userIndex];
    user.isOnline = isOnline ? 1 : 0;
    user.updateTime = getTimestamp();

    logger.info(`虚拟用户状态更新(Mock): ${user.username} -> ${isOnline ? '在线' : '离线'}`);
    
    const result = formatVirtualUser(user);
    result.tags = [];
    return result;
  }
};

const generateResponse = async (virtualUserId, userId, message, contextId) => {
  const virtualUser = await VirtualUser.findByPk(virtualUserId);
  if (!virtualUser || virtualUser.status !== 1 || virtualUser.isOnline !== 1) {
    throw new Error('虚拟用户不可用');
  }

  if (!contextId) {
    contextId = generateUUID();
  }

  const modelConfig = JSON.parse(virtualUser.modelConfig || '{}');
  const permissions = JSON.parse(virtualUser.permissions || '[]');

  if (!hasPermission(virtualUser, 'chat')) {
    throw new Error('虚拟用户无聊天权限');
  }

  const context = await getContext(virtualUserId, userId, contextId, virtualUser.maxContextLength);
  const tags = await getUserTagDetails(virtualUserId);
  const systemPrompt = buildSystemPrompt(virtualUser, tags);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...context.map(c => ({ role: c.role, content: c.message })),
    { role: 'user', content: message }
  ];

  const effectiveConfig = applyTagConfig(modelConfig, tags);

  let responseText;
  try {
    responseText = await callAI(effectiveConfig, messages);
  } catch (error) {
    logger.error(`AI调用失败: ${error.message}`);
    responseText = '抱歉，我现在有点忙，稍后再和你聊吧~';
  }

  await saveMessage(virtualUserId, userId, message, 'user', contextId);
  await saveMessage(virtualUserId, userId, responseText, 'assistant', contextId);

  logger.info(`虚拟用户聊天: ${virtualUser.username} -> 用户${userId}`);

  return {
    response: responseText,
    contextId,
    virtualUser: await getVirtualUserById(virtualUserId)
  };
};

const getContext = async (virtualUserId, userId, contextId, maxLength) => {
  const messages = await VirtualChatHistory.findAll({
    where: {
      virtualUserId,
      userId,
      contextId
    },
    order: [['createTime', 'ASC']],
    limit: maxLength
  });

  return messages;
};

const saveMessage = async (virtualUserId, userId, message, role, contextId) => {
  await VirtualChatHistory.create({
    virtualUserId,
    userId,
    message,
    role,
    contextId,
    createTime: getTimestamp()
  });
};

const buildSystemPrompt = (virtualUser, tags) => {
  const roleMap = {
    default: '一个友好的助手',
    companion: '一位专业的游戏陪玩师',
    guide: '一位贴心的向导',
    assistant: '一位智能助手'
  };

  const styleMap = {
    friendly: '友好亲切',
    professional: '专业严谨',
    humorous: '幽默风趣',
    cute: '可爱俏皮'
  };

  let prompt = `你是${roleMap[virtualUser.role] || '一个AI助手'}，`;
  prompt += `性格${styleMap[virtualUser.dialogueStyle] || '友好'}。`;

  const primaryTag = tags.find(t => t.isPrimary) || tags[0];
  if (primaryTag) {
    if (primaryTag.promptTemplate) {
      prompt = primaryTag.promptTemplate;
    }

    if (primaryTag.personality && primaryTag.personality.length > 0) {
      prompt += `你的性格特点：${primaryTag.personality.join('、')}。`;
    }

    if (primaryTag.expertise && primaryTag.expertise.length > 0) {
      prompt += `你的专业领域：${primaryTag.expertise.join('、')}。`;
    }

    if (primaryTag.knowledgeScope && primaryTag.knowledgeScope.length > 0) {
      prompt += `你擅长的知识范围包括：${primaryTag.knowledgeScope.join('、')}。`;
    }
  }

  if (virtualUser.personality) {
    prompt += `你的性格特点：${virtualUser.personality}。`;
  }

  if (virtualUser.description) {
    prompt += `角色描述：${virtualUser.description}。`;
  }

  if (primaryTag && primaryTag.communicationStyle) {
    const styleDesc = styleMap[primaryTag.communicationStyle] || '友好亲切';
    prompt += `沟通风格：${styleDesc}。`;
  } else {
    prompt += '请用自然、友好的语言回复用户的消息。';
  }

  return prompt;
};

const applyTagConfig = (modelConfig, tags) => {
  const effectiveConfig = { ...modelConfig };

  const primaryTag = tags.find(t => t.isPrimary) || tags[0];
  if (primaryTag) {
    if (primaryTag.customConfig && Object.keys(primaryTag.customConfig).length > 0) {
      Object.assign(effectiveConfig, primaryTag.customConfig);
    } else {
      if (primaryTag.temperature) {
        effectiveConfig.temperature = primaryTag.temperature;
      }
      if (primaryTag.maxTokens) {
        effectiveConfig.maxTokens = primaryTag.maxTokens;
      }
    }

    if (primaryTag.responseStrategy && primaryTag.responseStrategy.mode) {
      effectiveConfig.responseMode = primaryTag.responseStrategy.mode;
    }
  }

  return effectiveConfig;
};

const callAI = async (modelConfig, messages) => {
  const modelType = modelConfig.type || AI_MODELS.OPENAI;

  switch (modelType) {
    case AI_MODELS.OPENAI:
      return await callOpenAI(modelConfig, messages);
    case AI_MODELS.DOUBAO:
      return await callDoubao(modelConfig, messages);
    case AI_MODELS.QWEN:
      return await callQwen(modelConfig, messages);
    case AI_MODELS.CLAUDE:
      return await callClaude(modelConfig, messages);
    case AI_MODELS.DEEPSEEK:
      return await callDeepSeek(modelConfig, messages);
    default:
      return await callMockAI(messages);
  }
};

const callOpenAI = async (config, messages) => {
  const { apiKey, model = 'gpt-3.5-turbo', apiBase } = config;

  if (!apiKey) {
    return await callMockAI(messages);
  }

  const response = await fetch(`${apiBase || 'https://api.openai.com'}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: config.temperature || 0.7,
      max_tokens: config.maxTokens || 1024
    })
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '未获取到响应';
};

const callDoubao = async (config, messages) => {
  const { apiKey, secretKey, model = 'doubao-3' } = config;

  if (!apiKey || !secretKey) {
    return await callMockAI(messages);
  }

  const response = await fetch('https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await getDoubaoAccessToken(apiKey, secretKey)}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: config.temperature || 0.7
    })
  });

  const data = await response.json();
  return data.result || '未获取到响应';
};

const getDoubaoAccessToken = async (apiKey, secretKey) => {
  const response = await fetch(`https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`, {
    method: 'POST'
  });
  const data = await response.json();
  return data.access_token;
};

const callQwen = async (config, messages) => {
  const { apiKey, model = 'qwen-turbo', apiBase } = config;

  if (!apiKey) {
    return await callMockAI(messages);
  }

  const response = await fetch(`${apiBase || 'https://dashscope.aliyuncs.com'}/api/text/v1/generation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      input: { messages },
      parameters: {
        temperature: config.temperature || 0.7,
        max_tokens: config.maxTokens || 1024
      }
    })
  });

  const data = await response.json();
  return data.output?.text || '未获取到响应';
};

const callClaude = async (config, messages) => {
  const { apiKey, model = 'claude-3-sonnet', apiBase } = config;

  if (!apiKey) {
    return await callMockAI(messages);
  }

  const anthropicMessages = messages.map(m => ({
    role: m.role === 'assistant' ? 'assistant' : m.role,
    content: m.content
  }));

  const response = await fetch(`${apiBase || 'https://api.anthropic.com'}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      messages: anthropicMessages,
      temperature: config.temperature || 0.7,
      max_tokens: config.maxTokens || 1024
    })
  });

  const data = await response.json();
  return data.content?.[0]?.text || '未获取到响应';
};

const callDeepSeek = async (config, messages) => {
  const { apiKey, model = 'deepseek-chat', apiBase } = config;

  if (!apiKey) {
    return await callMockAI(messages);
  }

  const response = await fetch(`${apiBase || 'https://api.deepseek.com'}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: config.temperature || 0.7,
      max_tokens: config.maxTokens || 1024
    })
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'DeepSeek API调用失败');
  }

  return data.choices?.[0]?.message?.content || '未获取到响应';
};

const callMockAI = async (messages) => {
  const userMessage = messages[messages.length - 1]?.content || '';

  const responses = [
    `我收到了你的消息："${userMessage}"。很高兴能和你聊天！`,
    `你说的是：${userMessage}，这很有趣呢~`,
    `好的，我理解了。关于"${userMessage}"，我觉得...`,
    `嗯嗯，${userMessage}，让我想想...`,
    `谢谢你的分享！${userMessage}确实值得探讨。`
  ];

  return responses[Math.floor(Math.random() * responses.length)];
};

const getChatHistory = async (virtualUserId, userId, contextId) => {
  const where = { virtualUserId, userId };
  if (contextId) {
    where.contextId = contextId;
  }

  const history = await VirtualChatHistory.findAll({
    where,
    order: [['createTime', 'ASC']]
  });

  return history.map(h => ({
    id: h.id,
    message: h.message,
    role: h.role,
    createTime: h.createTime
  }));
};

const clearContext = async (virtualUserId, userId, contextId) => {
  const where = { virtualUserId, userId };
  if (contextId) {
    where.contextId = contextId;
  }

  await VirtualChatHistory.destroy({ where });
  logger.info(`上下文已清除: 虚拟用户${virtualUserId} -> 用户${userId}`);
  return true;
};

const hasPermission = (virtualUser, permission) => {
  const permissions = JSON.parse(virtualUser.permissions || '[]');
  return permissions.includes(permission);
};

const formatVirtualUser = (user) => {
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    avatar: user.avatar,
    role: user.role,
    personality: user.personality,
    dialogueStyle: user.dialogueStyle,
    description: user.description,
    modelConfig: user.modelConfig ? JSON.parse(user.modelConfig) : {},
    status: user.status,
    isOnline: user.isOnline,
    contextExpireTime: user.contextExpireTime,
    maxContextLength: user.maxContextLength,
    permissions: user.permissions ? JSON.parse(user.permissions) : [],
    createTime: user.createTime,
    updateTime: user.updateTime
  };
};

module.exports = {
  AI_MODELS,
  createVirtualUser,
  getVirtualUserById,
  getVirtualUserByUsername,
  getAllVirtualUsers,
  updateVirtualUser,
  deleteVirtualUser,
  toggleOnlineStatus,
  generateResponse,
  getChatHistory,
  clearContext,
  hasPermission
};
