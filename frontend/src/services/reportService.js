import { request, validateParams } from '../common/common'

// 与后端 xn_report.target_type 枚举一致
export const REPORT_TARGET = {
  USER: 1,
  POST: 2,
  COMMENT: 3
}

const reportService = {
  async submitReport({ targetType, targetId, reason, images = [] }) {
    validateParams({ targetType, targetId, reason }, {
      targetType: { required: true, label: '举报类型', type: 'number' },
      targetId: { required: true, label: '目标ID', type: 'number' },
      reason: { required: true, label: '举报原因', type: 'string', maxLength: 255 }
    })
    return request('/api/report', 'POST', { targetType, targetId, reason, images })
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
