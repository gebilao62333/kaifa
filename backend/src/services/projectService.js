const { getTimestamp } = require('../utils/helper');

let projects = []
let projectIdCounter = 1

const getStats = async (userId) => {
  const userProjects = projects.filter(p => p.userId === userId)
  const running = userProjects.filter(p => p.status === 'running').length
  const stopped = userProjects.filter(p => p.status === 'stopped').length

  return {
    total: userProjects.length,
    running,
    stopped,
    thisMonth: userProjects.filter(p => {
      const d = new Date(p.createTime)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length
  }
}

const getList = async (userId, params = {}) => {
  const { status, page = 1, pageSize = 20 } = params
  let filtered = projects.filter(p => p.userId === userId)

  if (status) {
    filtered = filtered.filter(p => p.status === status)
  }

  const total = filtered.length
  const start = (page - 1) * pageSize
  const list = filtered.slice(start, start + pageSize)

  return {
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    list: list.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      type: p.type,
      createTime: p.createTime,
      updateTime: p.updateTime
    }))
  }
}

const getById = async (userId, projectId) => {
  const project = projects.find(p => p.id === projectId && p.userId === userId)

  if (!project) {
    throw new Error('项目不存在')
  }

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    type: project.type,
    config: project.config || {},
    createTime: project.createTime,
    updateTime: project.updateTime
  }
}

const create = async (userId, data) => {
  const project = {
    id: projectIdCounter++,
    userId,
    name: data.name || '未命名项目',
    description: data.description || '',
    status: 'stopped',
    type: data.type || 'general',
    config: data.config || {},
    createTime: Date.now(),
    updateTime: Date.now()
  }

  projects.push(project)
  return { id: project.id }
}

const update = async (userId, projectId, data) => {
  const project = projects.find(p => p.id === projectId && p.userId === userId)

  if (!project) {
    throw new Error('项目不存在')
  }

  if (data.name !== undefined) project.name = data.name
  if (data.description !== undefined) project.description = data.description
  if (data.type !== undefined) project.type = data.type
  if (data.config !== undefined) project.config = data.config
  project.updateTime = Date.now()

  return true
}

const deleteProject = async (userId, projectId) => {
  const index = projects.findIndex(p => p.id === projectId && p.userId === userId)

  if (index === -1) {
    throw new Error('项目不存在')
  }

  projects.splice(index, 1)
  return true
}

const start = async (userId, projectId) => {
  const project = projects.find(p => p.id === projectId && p.userId === userId)

  if (!project) {
    throw new Error('项目不存在')
  }

  if (project.status === 'running') {
    throw new Error('项目已启动')
  }

  project.status = 'running'
  project.updateTime = Date.now()
  return true
}

const stop = async (userId, projectId) => {
  const project = projects.find(p => p.id === projectId && p.userId === userId)

  if (!project) {
    throw new Error('项目不存在')
  }

  if (project.status === 'stopped') {
    throw new Error('项目已停止')
  }

  project.status = 'stopped'
  project.updateTime = Date.now()
  return true
}

const restart = async (userId, projectId) => {
  const project = projects.find(p => p.id === projectId && p.userId === userId)

  if (!project) {
    throw new Error('项目不存在')
  }

  project.status = 'running'
  project.updateTime = Date.now()
  return true
}

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
}
