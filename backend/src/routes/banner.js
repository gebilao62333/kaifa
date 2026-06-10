const express = require('express');
const router = express.Router();
const response = require('../utils/response');
const logger = require('../utils/logger');

const mockBanners = [
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

router.get('/list', (req, res) => {
  try {
    const { position, status } = req.query;
    
    let filteredBanners = [...mockBanners];
    
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

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const banner = mockBanners.find(b => b.id === parseInt(id));
    
    if (!banner) {
      return response.notFound(res, 'Banner不存在');
    }
    
    response.success(res, banner);
  } catch (error) {
    logger.error('获取Banner详情失败:', error);
    response.error(res, '服务器错误');
  }
});

router.post('/', (req, res) => {
  try {
    const { title, image, link, position, sort, status } = req.body;
    
    const newBanner = {
      id: mockBanners.length + 1,
      title,
      image,
      link,
      position: position || 'home',
      sort: sort || 0,
      status: status !== undefined ? status : 1,
      create_time: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    
    mockBanners.push(newBanner);
    
    response.created(res, newBanner, '创建成功');
  } catch (error) {
    logger.error('创建Banner失败:', error);
    response.error(res, '服务器错误');
  }
});

router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, image, link, position, sort, status } = req.body;
    
    const banner = mockBanners.find(b => b.id === parseInt(id));
    
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

router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const index = mockBanners.findIndex(b => b.id === parseInt(id));
    
    if (index === -1) {
      return response.notFound(res, 'Banner不存在');
    }
    
    mockBanners.splice(index, 1);
    
    response.success(res, {}, '删除成功');
  } catch (error) {
    logger.error('删除Banner失败:', error);
    response.error(res, '服务器错误');
  }
});

router.put('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const banner = mockBanners.find(b => b.id === parseInt(id));
    
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
