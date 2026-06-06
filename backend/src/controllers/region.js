const regionService = require('../services/regionService');
const logger = require('../utils/logger');
const { success, error, badRequest } = require('../utils/response');

class RegionController {
  async getProvinces(req, res) {
    try {
      const provinces = await regionService.getAllProvinces();
      success(res, provinces, '获取省份列表成功');
    } catch (err) {
      logger.error('获取省份列表失败:', err);
      error(res, '获取省份列表失败');
    }
  }

  async getCities(req, res) {
    try {
      const { provinceCode } = req.params;
      if (!provinceCode) {
        return badRequest(res, '省份代码不能为空');
      }
      const cities = await regionService.getCitiesByProvince(provinceCode);
      success(res, cities, '获取城市列表成功');
    } catch (err) {
      logger.error('获取城市列表失败:', err);
      error(res, '获取城市列表失败');
    }
  }

  async getDistricts(req, res) {
    try {
      const { cityCode } = req.params;
      if (!cityCode) {
        return badRequest(res, '城市代码不能为空');
      }
      const districts = await regionService.getDistrictsByCity(cityCode);
      success(res, districts, '获取区县列表成功');
    } catch (err) {
      logger.error('获取区县列表失败:', err);
      error(res, '获取区县列表失败');
    }
  }

  async getTownships(req, res) {
    try {
      const { districtCode } = req.params;
      if (!districtCode) {
        return badRequest(res, '区县代码不能为空');
      }
      const townships = await regionService.getTownshipsByDistrict(districtCode);
      success(res, townships, '获取乡镇列表成功');
    } catch (err) {
      logger.error('获取乡镇列表失败:', err);
      error(res, '获取乡镇列表失败');
    }
  }

  async searchRegions(req, res) {
    try {
      const { q } = req.query;
      if (!q || q.length < 2) {
        return badRequest(res, '搜索关键词至少2个字符');
      }
      const results = await regionService.searchRegions(q);
      success(res, results, '搜索成功');
    } catch (err) {
      logger.error('搜索失败:', err);
      error(res, '搜索失败');
    }
  }
}

module.exports = new RegionController();
