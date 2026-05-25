const express = require('express');
const router = express.Router();

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
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        list: filteredBanners,
        pagination: {
          page: 1,
          pageSize: 20,
          total: filteredBanners.length,
          totalPages: 1
        }
      }
    });
  } catch (error) {
    console.error('获取Banner列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const banner = mockBanners.find(b => b.id === parseInt(id));
    
    if (!banner) {
      return res.status(404).json({
        code: 404,
        message: 'Banner不存在'
      });
    }
    
    res.json({
      code: 200,
      message: 'success',
      data: banner
    });
  } catch (error) {
    console.error('获取Banner详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
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
    
    res.json({
      code: 200,
      message: '创建成功',
      data: newBanner
    });
  } catch (error) {
    console.error('创建Banner失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, image, link, position, sort, status } = req.body;
    
    const banner = mockBanners.find(b => b.id === parseInt(id));
    
    if (!banner) {
      return res.status(404).json({
        code: 404,
        message: 'Banner不存在'
      });
    }
    
    if (title !== undefined) banner.title = title;
    if (image !== undefined) banner.image = image;
    if (link !== undefined) banner.link = link;
    if (position !== undefined) banner.position = position;
    if (sort !== undefined) banner.sort = sort;
    if (status !== undefined) banner.status = status;
    
    res.json({
      code: 200,
      message: '更新成功',
      data: banner
    });
  } catch (error) {
    console.error('更新Banner失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const index = mockBanners.findIndex(b => b.id === parseInt(id));
    
    if (index === -1) {
      return res.status(404).json({
        code: 404,
        message: 'Banner不存在'
      });
    }
    
    mockBanners.splice(index, 1);
    
    res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除Banner失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
});

router.put('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const banner = mockBanners.find(b => b.id === parseInt(id));
    
    if (!banner) {
      return res.status(404).json({
        code: 404,
        message: 'Banner不存在'
      });
    }
    
    banner.status = status;
    
    res.json({
      code: 200,
      message: '状态更新成功',
      data: banner
    });
  } catch (error) {
    console.error('更新Banner状态失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
});

module.exports = router;
