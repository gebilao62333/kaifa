const { VipPackage } = require('./src/models');

const initVipPackages = async () => {
  try {
    console.log('开始初始化VIP套餐数据...');

    const packages = [
      {
        name: 'VIP月卡',
        price: 18.00,
        original_price: 30.00,
        duration: 30,
        level: 1,
        hot: 1,
        sort: 1,
        status: 1,
        create_time: Math.floor(Date.now() / 1000)
      },
      {
        name: 'VIP季卡',
        price: 48.00,
        original_price: 90.00,
        duration: 90,
        level: 1,
        hot: 0,
        sort: 2,
        status: 1,
        create_time: Math.floor(Date.now() / 1000)
      },
      {
        name: 'VIP年卡',
        price: 128.00,
        original_price: 360.00,
        duration: 365,
        level: 2,
        hot: 1,
        sort: 3,
        status: 1,
        create_time: Math.floor(Date.now() / 1000)
      },
      {
        name: 'VIP永久',
        price: 298.00,
        original_price: null,
        duration: 3650,
        level: 3,
        hot: 0,
        sort: 4,
        status: 1,
        create_time: Math.floor(Date.now() / 1000)
      }
    ];

    for (const pkg of packages) {
      await VipPackage.upsert(pkg);
      console.log(`✅ 套餐 "${pkg.name}" 已创建/更新`);
    }

    console.log('✅ VIP套餐数据初始化完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 初始化VIP套餐数据失败:', error);
    process.exit(1);
  }
};

initVipPackages();