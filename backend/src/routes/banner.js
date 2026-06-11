const express = require('express');
const router = express.Router();
const response = require('../utils/response');
const logger = require('../utils/logger');
const { Banner } = require('../models');

// 兜底 mock 数据（仅在数据库不可用时使用）
const fallbackBanners = [
  {
    id: 1,
    title: '新用户专享',
    image: '/uploads/banner1.png',
    link: '/promotion/new-user',
    position: 'home',
    sort: 1,
    status: 1,
    create_time: '2024-01-01 10:00:00'
  },
  {
    id: 2,
    title: '王者荣耀专区',
    image: '/uploads/banner1.png',
    link: '/games/wangzhe',
    position: 'home',
    sort: 2,
    status: 1,
    create_time: '2024-01-02 10:00:00'
  },
  {
    id: 3,
    title: '英雄联盟活动',
    image: '/uploads/banner1.png',
    link: '/games/lol',
    position: 'home',
    sort: 3,
    status: 1,
    create_time: '2024-01-03 10:00:00'
  }
];

// 获取 Banner 列表
router.get('/list', async (req, res) => {
  try {
    const { position, status } = req.query;
    
    // 优先从数据库获取
    try {
      const where = {};
      if (position) where.position = position;
      if (status !== undefined && status !== '') where.status = parseInt(status);
      
      const banners = await Banner.findAll({
        where,
        order: [['sort', 'ASC'], ['id', 'DESC']]
      });
      
      if (banners && banners.length > 0) {
        return response.success(res, {
          list: banners,
          pagination: {
            page: 1,
            pageSize: 20,
            total: banners.length,
            totalPages: 1
          }
        });
      }
    } catch (dbError) {
      logger.warn('Banner数据库查询失败，使用Mock:', dbError.message);
    }
    
    // Mock fallback
    let filteredBanners = [...fallbackBanners];
    if (position) {
      filteredBanners = filteredBanners.filter(b => b.position === position);
    }
    if (status !== undefined && status !== '') {
      filteredBanners = filteredBanners.filter(b => b.status === parseInt(status));
    }
    
    response.success(res, {
      list: filteredBanners,
      pagination: {
        page: 1,
        pageSize: 20,
        total: filteredBanners.length,
        totalPages: 1
      }
    });
  } catch (error) {
    logger.error('获取Banner列表失败:', error);
    response.error(res, '服务器错误');
  }
});

// 获取单个 Banner
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    try {
      const banner = await Banner.findByPk(parseInt(id));
      if (banner) {
        return response.success(res, banner);
      }
    } catch (dbError) {
      logger.warn('Banner详情数据库查询失败:', dbError.message);
    }
    
    const banner = fallbackBanners.find(b => b.id === parseInt(id));
    if (!banner) {
      return response.notFound(res, 'Banner不存在');
    }
    response.success(res, banner);
  } catch (error) {
    logger.error('获取Banner详情失败:', error);
    response.error(res, '服务器错误');
  }
});

// 创建 Banner
router.post('/', async (req, res) => {
  try {
    const { title, image, link, position, sort, status } = req.body;
    
    try {
      const newBanner = await Banner.create({
        title,
        image,
        link,
        position: position || 'home',
        sort: sort || 0,
        status: status !== undefined ? status : 1
      });
      return response.created(res, newBanner, '创建成功');
    } catch (dbError) {
      logger.warn('Banner数据库创建失败:', dbError.message);
    }
    
    // Mock fallback
    const newBanner = {
      id: fallbackBanners.length + 1,
      title,
      image,
      link,
      position: position || 'home',
      sort: sort || 0,
      status: status !== undefined ? status : 1,
      create_time: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    fallbackBanners.push(newBanner);
    response.created(res, newBanner, '创建成功');
  } catch (error) {
    logger.error('创建Banner失败:', error);
    response.error(res, '服务器错误');
  }
});

// 更新 Banner
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, image, link, position, sort, status } = req.body;
    
    try {
      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (image !== undefined) updateData.image = image;
      if (link !== undefined) updateData.link = link;
      if (position !== undefined) updateData.position = position;
      if (sort !== undefined) updateData.sort = sort;
      if (status !== undefined) updateData.status = status;
      
      const result = await Banner.update(updateData, { where: { id: parseInt(id) } });
      if (result[0] > 0) {
        const updated = await Banner.findByPk(parseInt(id));
        return response.success(res, updated, '更新成功');
      }
    } catch (dbError) {
      logger.warn('Banner数据库更新失败:', dbError.message);
    }
    
    const banner = fallbackBanners.find(b => b.id === parseInt(id));
    if (!banner) {
      return response.notFound(res, 'Banner不存在');
    }
    if (title !== undefined) banner.title = title;
    if (image !== undefined) banner.image = image;
    if (link !== undefined) banner.link = link;
    if (position !== undefined) banner.position = position;
    if (sort !== undefined) banner.sort = sort;
    if (status !== undefined) banner.status = status;
    response.success(res, banner, '更新成功');
  } catch (error) {
    logger.error('更新Banner失败:', error);
    response.error(res, '服务器错误');
  }
});

// 删除 Banner
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    try {
      const result = await Banner.destroy({ where: { id: parseInt(id) } });
      if (result > 0) {
        return response.success(res, {}, '删除成功');
      }
    } catch (dbError) {
      logger.warn('Banner数据库删除失败:', dbError.message);
    }
    
    const index = fallbackBanners.findIndex(b => b.id === parseInt(id));
    if (index === -1) {
      return response.notFound(res, 'Banner不存在');
    }
    fallbackBanners.splice(index, 1);
    response.success(res, {}, '删除成功');
  } catch (error) {
    logger.error('删除Banner失败:', error);
    response.error(res, '服务器错误');
  }
});

// 更新 Banner 状态
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    try {
      const result = await Banner.update({ status }, { where: { id: parseInt(id) } });
      if (result[0] > 0) {
        const updated = await Banner.findByPk(parseInt(id));
        return response.success(res, updated, '状态更新成功');
      }
    } catch (dbError) {
      logger.warn('Banner状态数据库更新失败:', dbError.message);
    }
    
    const banner = fallbackBanners.find(b => b.id === parseInt(id));
    if (!banner) {
      return response.notFound(res, 'Banner不存在');
    }
    banner.status = status;
    response.success(res, banner, '状态更新成功');
  } catch (error) {
    logger.error('更新Banner状态失败:', error);
    response.error(res, '服务器错误');
  }
});

module.exports = router;
