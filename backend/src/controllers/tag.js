const tagService = require('../services/tagService');
const response = require('../utils/response');
const logger = require('../utils/logger');

const createTag = async (req, res) => {
  try {
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
      temperature,
      maxTokens,
      priority,
      isDefault
    } = req.body;

    if (!name || !code) {
      return response.badRequest(res, '标签名称和代码不能为空');
    }

    const result = await tagService.createTag({
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
      temperature,
      maxTokens,
      priority,
      isDefault
    });

    response.created(res, result, '标签创建成功');
  } catch (error) {
    logger.error(`创建标签失败: ${error.message}`);
    response.unprocessableEntity(res, error.message);
  }
};

const getTag = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await tagService.getTagById(parseInt(id));
    response.success(res, result);
  } catch (error) {
    logger.error(`获取标签失败: ${error.message}`);
    response.notFound(res, error.message);
  }
};

const getAllTags = async (req, res) => {
  try {
    const result = await tagService.getAllTags(req.query);
    response.success(res, result);
  } catch (error) {
    logger.error(`获取标签列表失败: ${error.message}`);
    response.error(res, error.message);
  }
};

const getTagsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const result = await tagService.getTagsByCategory(category);
    response.success(res, result);
  } catch (error) {
    logger.error(`获取分类标签失败: ${error.message}`);
    response.error(res, error.message);
  }
};

const updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await tagService.updateTag(parseInt(id), req.body);
    response.success(res, result, '标签更新成功');
  } catch (error) {
    logger.error(`更新标签失败: ${error.message}`);
    response.unprocessableEntity(res, error.message);
  }
};

const deleteTag = async (req, res) => {
  try {
    const { id } = req.params;
    await tagService.deleteTag(parseInt(id));
    response.success(res, {}, '标签删除成功');
  } catch (error) {
    logger.error(`删除标签失败: ${error.message}`);
    response.notFound(res, error.message);
  }
};

const assignTag = async (req, res) => {
  try {
    const { virtualUserId, tagId, isPrimary, customConfig } = req.body;

    if (!virtualUserId || !tagId) {
      return response.badRequest(res, '虚拟用户ID和标签ID不能为空');
    }

    await tagService.assignTagToUser(
      parseInt(virtualUserId),
      parseInt(tagId),
      isPrimary,
      customConfig
    );

    response.success(res, {}, '标签分配成功');
  } catch (error) {
    logger.error(`分配标签失败: ${error.message}`);
    response.unprocessableEntity(res, error.message);
  }
};

const removeTag = async (req, res) => {
  try {
    const { virtualUserId, tagId } = req.body;

    if (!virtualUserId || !tagId) {
      return response.badRequest(res, '虚拟用户ID和标签ID不能为空');
    }

    await tagService.removeTagFromUser(parseInt(virtualUserId), parseInt(tagId));
    response.success(res, {}, '标签移除成功');
  } catch (error) {
    logger.error(`移除标签失败: ${error.message}`);
    response.unprocessableEntity(res, error.message);
  }
};

const getUserTags = async (req, res) => {
  try {
    const { virtualUserId } = req.params;
    const result = await tagService.getUserTags(parseInt(virtualUserId));
    response.success(res, result);
  } catch (error) {
    logger.error(`获取用户标签失败: ${error.message}`);
    response.error(res, error.message);
  }
};

const setPrimaryTag = async (req, res) => {
  try {
    const { virtualUserId, tagId } = req.body;

    if (!virtualUserId || !tagId) {
      return response.badRequest(res, '虚拟用户ID和标签ID不能为空');
    }

    await tagService.setPrimaryTag(parseInt(virtualUserId), parseInt(tagId));
    response.success(res, {}, '主要标签设置成功');
  } catch (error) {
    logger.error(`设置主要标签失败: ${error.message}`);
    response.unprocessableEntity(res, error.message);
  }
};

const recommendTags = async (req, res) => {
  try {
    const result = await tagService.recommendTags(req.query);
    response.success(res, result);
  } catch (error) {
    logger.error(`标签推荐失败: ${error.message}`);
    response.error(res, error.message);
  }
};

const getTagUsers = async (req, res) => {
  try {
    const { tagId } = req.params;
    const result = await tagService.getTagsWithUsers(parseInt(tagId));
    response.success(res, result);
  } catch (error) {
    logger.error(`获取标签用户失败: ${error.message}`);
    response.notFound(res, error.message);
  }
};

const getDefaultTags = async (req, res) => {
  try {
    const result = await tagService.getDefaultTags();
    response.success(res, result);
  } catch (error) {
    logger.error(`获取默认标签失败: ${error.message}`);
    response.error(res, error.message);
  }
};

const initDefaultTags = async (req, res) => {
  try {
    await tagService.initializeDefaultTags();
    response.success(res, {}, '默认标签初始化成功');
  } catch (error) {
    logger.error(`初始化默认标签失败: ${error.message}`);
    response.error(res, error.message);
  }
};

module.exports = {
  createTag,
  getTag,
  getAllTags,
  getTagsByCategory,
  updateTag,
  deleteTag,
  assignTag,
  removeTag,
  getUserTags,
  setPrimaryTag,
  recommendTags,
  getTagUsers,
  getDefaultTags,
  initDefaultTags
};
