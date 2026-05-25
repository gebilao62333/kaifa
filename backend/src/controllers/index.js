const { Banner } = require('../models');
const response = require('../utils/response');

const getBanners = async (req, res) => {
  try {
    const { type = 1 } = req.query;
    
    const banners = await Banner.findAll({
      where: {
        status: 1,
        type: parseInt(type)
      },
      order: [['sort', 'ASC']]
    });
    
    const result = banners.map(banner => ({
      bannerId: banner.id,
      title: banner.title,
      image: banner.image,
      link: banner.link
    }));
    
    response.success(res, result);
  } catch (error) {
    console.error('获取Banner错误:', error);
    response.error(res, error.message);
  }
};

module.exports = {
  getBanners
};
