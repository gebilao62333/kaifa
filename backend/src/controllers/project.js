const projectService = require('../services/projectService');
const response = require('../utils/response');

const getStats = async (req, res) => {
  try {
    const result = await projectService.getStats(req.userId);
    response.success(res, result);
  } catch (error) {
    console.error('获取项目统计错误:', error);
    response.error(res, error.message);
  }
};

const getList = async (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    const result = await projectService.getList(req.userId, { status, page, pageSize });
    response.success(res, result);
  } catch (error) {
    console.error('获取项目列表错误:', error);
    response.error(res, error.message);
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
    console.error('获取项目详情错误:', error);
    response.unprocessableEntity(res, error.message);
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
    console.error('创建项目错误:', error);
    response.error(res, error.message);
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
    console.error('更新项目错误:', error);
    response.unprocessableEntity(res, error.message);
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
    console.error('删除项目错误:', error);
    response.unprocessableEntity(res, error.message);
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
    console.error('启动项目错误:', error);
    response.unprocessableEntity(res, error.message);
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
    console.error('停止项目错误:', error);
    response.unprocessableEntity(res, error.message);
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
    console.error('重启项目错误:', error);
    response.unprocessableEntity(res, error.message);
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
