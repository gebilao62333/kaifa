const express = require('express');
const router = express.Router();
const regionController = require('../controllers/region');

router.get('/provinces', regionController.getProvinces);

router.get('/cities/:provinceCode', regionController.getCities);

router.get('/districts/:cityCode', regionController.getDistricts);

router.get('/townships/:districtCode', regionController.getTownships);

router.get('/search', regionController.searchRegions);

module.exports = router;
