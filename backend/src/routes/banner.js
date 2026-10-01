const express = require('express');
const router = express.Router();
const response = require('../utils/response');
const { Banner } = require('../models');

// 获取 Banner 列表
router.get('/list', async (req, res) => {
  try {
    const banners = await Banner.findAll({
      where: { status: 1 },
      order: [['sort_order', 'ASC'], ['id', 'DESC']],
      attributes: ['id', 'title', 'image', 'link_url', 'sort_order']
    });
    response.success(res, {
      list: banners.map(b => ({
        id: b.id,
        title: b.title,
        image: b.image,
        link: b.link_url || '',
        sort: b.sort_order
      }))
    });
  } catch (error) {
    response.error(res, error.message);
  }
});

// 获取所有 Banner（管理后台用）
router.get('/all', async (req, res) => {
  try {
    const banners = await Banner.findAll({
      order: [['sort_order', 'ASC'], ['id', 'DESC']]
    });
    response.success(res, {
      list: banners.map(b => ({
        id: b.id,
        title: b.title,
        image: b.image,
        link: b.link_url || '',
        sort: b.sort_order,
        status: b.status,
        create_time: b.create_time
      }))
    });
  } catch (error) {
    response.error(res, error.message);
  }
});

module.exports = router;
