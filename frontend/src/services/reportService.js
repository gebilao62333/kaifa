import { request } from '../common/common'
import { validateParams } from '../common/common'

const reportService = {
  async submitReport(params) {
    validateParams(params, {
      type: { required: true, label: '举报类型', type: 'string' },
      targetId: { required: true, label: '目标ID', type: 'number' },
      reason: { required: true, label: '举报原因', type: 'string' }
    })
    return request('/api/report', 'POST', params)
  },

  async getReportList(params = {}) {
    const { status, page = 1, pageSize = 20 } = params
    const data = { page, pageSize }
    if (status !== undefined) data.status = status
    return request('/api/report/list', 'GET', data)
  },

  async getReportDetail(reportId) {
    validateParams({ reportId }, {
      reportId: { required: true, label: '举报ID', type: 'number' }
    })
    return request(`/api/report/detail?reportId=${reportId}`, 'GET')
  }
}

export default reportService
