const mapService = require('../services/mapService');
const logger = require('../utils/logger');
const response = require('../utils/response');

/**
 * 地理编码：地址 → 坐标
 * GET /api/map/geocoder?address=xxx
 */
const geocoder = async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) return response.badRequest(res, '地址参数不能为空');

    const result = await mapService.geocoder(address);
    response.success(res, result);
  } catch (error) {
    logger.error('地图-地理编码错误:', error.message);
    response.error(res, error.message || '地理编码失败');
  }
};

/**
 * 逆地理编码：坐标 → 地址
 * GET /api/map/reverse-geocoder?lat=39.984154&lng=116.307490
 */
const reverseGeocoder = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return response.badRequest(res, '坐标参数不能为空');

    const result = await mapService.reverseGeocoder(parseFloat(lat), parseFloat(lng));
    response.success(res, result);
  } catch (error) {
    logger.error('地图-逆地理编码错误:', error.message);
    response.error(res, error.message || '逆地理编码失败');
  }
};

/**
 * 地点搜索
 * GET /api/map/place-search?keyword=酒店&lat=39.98&lng=116.30&radius=1000
 */
const placeSearch = async (req, res) => {
  try {
    const { keyword, lat, lng, pageIndex, pageSize, radius, region } = req.query;
    if (!keyword) return response.badRequest(res, '搜索关键词不能为空');

    const options = {
      pageIndex: parseInt(pageIndex) || 1,
      pageSize: parseInt(pageSize) || 20,
      radius: parseInt(radius) || 1000,
      region
    };
    if (lat && lng) { options.lat = parseFloat(lat); options.lng = parseFloat(lng); }

    const result = await mapService.placeSearch(keyword, options);
    response.success(res, result);
  } catch (error) {
    logger.error('地图-地点搜索错误:', error.message);
    response.error(res, error.message || '地点搜索失败');
  }
};

/**
 * 输入提示
 * GET /api/map/suggestion?keyword=天安门&region=北京
 */
const suggestion = async (req, res) => {
  try {
    const { keyword, region } = req.query;
    if (!keyword) return response.badRequest(res, '搜索关键词不能为空');

    const result = await mapService.suggestion(keyword, region);
    response.success(res, result);
  } catch (error) {
    logger.error('地图-输入提示错误:', error.message);
    response.error(res, error.message || '输入提示失败');
  }
};

/**
 * 距离计算
 * GET /api/map/distance?from=39.98,116.30&to=39.90,116.40&mode=driving
 */
const distance = async (req, res) => {
  try {
    const { from, to, mode = 'driving' } = req.query;
    if (!from || !to) return response.badRequest(res, '起终点参数不能为空');

    const result = await mapService.distance(from, to, mode);
    response.success(res, result);
  } catch (error) {
    logger.error('地图-距离计算错误:', error.message);
    response.error(res, error.message || '距离计算失败');
  }
};

/**
 * IP定位
 * GET /api/map/ip-location?ip=xxx
 */
const ipLocation = async (req, res) => {
  try {
    const { ip } = req.query;
    const result = await mapService.ipLocation(ip);
    response.success(res, result);
  } catch (error) {
    logger.error('地图-IP定位错误:', error.message);
    response.error(res, error.message || 'IP定位失败');
  }
};

/**
 * 坐标转换
 * GET /api/map/translate-coord?locations=39.98,116.30&type=1
 */
const translateCoord = async (req, res) => {
  try {
    const { locations, type = 1 } = req.query;
    if (!locations) return response.badRequest(res, '坐标参数不能为空');

    const result = await mapService.translateCoord(locations, parseInt(type));
    response.success(res, result);
  } catch (error) {
    logger.error('地图-坐标转换错误:', error.message);
    response.error(res, error.message || '坐标转换失败');
  }
};

module.exports = {
  geocoder,
  reverseGeocoder,
  placeSearch,
  suggestion,
  distance,
  ipLocation,
  translateCoord
};
