const express = require('express');
const router = express.Router();
const mapController = require('../controllers/map');
const { authMiddleware, optionalAuth } = require('../middlewares');

// 地理编码：地址 → 坐标
router.get('/geocoder', optionalAuth, mapController.geocoder);

// 逆地理编码：坐标 → 地址
router.get('/reverse-geocoder', optionalAuth, mapController.reverseGeocoder);

// 地点搜索
router.get('/place-search', optionalAuth, mapController.placeSearch);

// 输入提示/自动补全
router.get('/suggestion', optionalAuth, mapController.suggestion);

// 距离计算
router.get('/distance', optionalAuth, mapController.distance);

// IP定位
router.get('/ip-location', optionalAuth, mapController.ipLocation);

// 坐标转换
router.get('/translate-coord', optionalAuth, mapController.translateCoord);

module.exports = router;
