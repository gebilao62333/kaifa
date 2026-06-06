const projectService = require('../services/projectService');
const logger = require('../utils/logger');
const response = require('../utils/response');

const getStats = async (req, res) => {
  try {
    const result = await projectService.getStats(req.userId);
    response.success(res, result);
  } catch (error) {
    logger.error('获取项目统计错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const getList = async (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    const result = await projectService.getList(req.userId, { status, page, pageSize });
    response.success(res, result);
  } catch (error) {
    logger.error('获取项目列表错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return response.badRequest(res, '项目ID不能为空');
    }

    const result = await projectService.getById(req.userId, parseInt(id));
    response.success(res, result);
  } catch (error) {
    logger.error('获取项目详情错误:', error);
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

const create = async (req, res) => {
  try {
    const { name, description, type, config } = req.body;

    if (!name) {
      return response.badRequest(res, '项目名称不能为空');
    }

    const result = await projectService.create(req.userId, { name, description, type, config });
    response.created(res, result, '创建成功');
  } catch (error) {
    logger.error('创建项目错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, type, config } = req.body;

    if (!id) {
      return response.badRequest(res, '项目ID不能为空');
    }

    await projectService.update(req.userId, parseInt(id), { name, description, type, config });
    response.success(res, {}, '更新成功');
  } catch (error) {
    logger.error('更新项目错误:', error);
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return response.badRequest(res, '项目ID不能为空');
    }

    await projectService.deleteProject(req.userId, parseInt(id));
    response.success(res, {}, '删除成功');
  } catch (error) {
    logger.error('删除项目错误:', error);
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

const start = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return response.badRequest(res, '项目ID不能为空');
    }

    await projectService.start(req.userId, parseInt(id));
    response.success(res, {}, '启动成功');
  } catch (error) {
    logger.error('启动项目错误:', error);
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

const stop = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return response.badRequest(res, '项目ID不能为空');
    }

    await projectService.stop(req.userId, parseInt(id));
    response.success(res, {}, '停止成功');
  } catch (error) {
    logger.error('停止项目错误:', error);
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

const restart = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return response.badRequest(res, '项目ID不能为空');
    }

    await projectService.restart(req.userId, parseInt(id));
    response.success(res, {}, '重启成功');
  } catch (error) {
    logger.error('重启项目错误:', error);
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

module.exports = {
  getStats,
  getList,
  getById,
  create,
  update,
  deleteProject,
  start,
  stop,
  restart
};
