import { request } from '../common/common'

export const regionService = {
  // 获取所有省份
  async getProvinces() {
    return request('/api/region/provinces', 'GET')
  },

  // 获取省份下的城市（路径参数）
  async getCities(provinceCode) {
    return request(`/api/region/cities/${provinceCode}`, 'GET')
  },

  // 获取城市下的区县（路径参数）
  async getDistricts(cityCode) {
    return request(`/api/region/districts/${cityCode}`, 'GET')
  },

  // 获取区县下的乡镇
  async getTownships(districtCode) {
    return request(`/api/region/townships/${districtCode}`, 'GET')
  },

  // 搜索地区（q 参数，至少2个字符）
  async searchRegions(q) {
    return request(`/api/region/search?q=${encodeURIComponent(q)}`, 'GET')
  }
}

export default regionService
