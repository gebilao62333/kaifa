import { request } from '../common/common'
import { validateParams } from '../common/common'

const projectService = {
  async getProjectList(params = {}) {
    const { status, page = 1, pageSize = 20 } = params
    const data = { page, pageSize }
    if (status !== undefined) data.status = status
    return request('/api/project/list', 'GET', data)
  },

  async getProjectDetail(projectId) {
    validateParams({ projectId }, {
      projectId: { required: true, label: '项目ID', type: 'number' }
    })
    return request(`/api/project/detail?projectId=${projectId}`, 'GET')
  },

  async createProject(params) {
    validateParams(params, {
      title: { required: true, label: '项目标题', type: 'string', maxLength: 100 },
      description: { required: true, label: '项目描述', type: 'string', maxLength: 500 },
      category: { required: true, label: '项目分类', type: 'string' },
      price: { required: true, label: '项目价格', type: 'number' },
      duration: { required: true, label: '服务时长', type: 'number' }
    })
    return request('/api/project/create', 'POST', params)
  },

  async updateProject(projectId, params) {
    validateParams({ projectId }, {
      projectId: { required: true, label: '项目ID', type: 'number' }
    })
    return request('/api/project/update', 'POST', { projectId, ...params })
  },

  async deleteProject(projectId) {
    validateParams({ projectId }, {
      projectId: { required: true, label: '项目ID', type: 'number' }
    })
    return request('/api/project/delete', 'POST', { projectId })
  },

  async toggleProjectStatus(projectId) {
    validateParams({ projectId }, {
      projectId: { required: true, label: '项目ID', type: 'number' }
    })
    return request('/api/project/toggle-status', 'POST', { projectId })
  },

  async getProjectOrders(projectId, params = {}) {
    validateParams({ projectId }, {
      projectId: { required: true, label: '项目ID', type: 'number' }
    })
    const { status, page = 1, pageSize = 20 } = params
    return request('/api/project/orders', 'GET', { projectId, status, page, pageSize })
  },

  async getProjectStats() {
    return request('/api/project/stats', 'GET')
  }
}

export default projectService
