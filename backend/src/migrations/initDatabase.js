require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const sequelize = require('../config/mysql');
const config = require('../config/index');

const initDatabase = async () => {
  console.log('========== 开始初始化数据库 ==========');

  try {
    console.log('\n1. 连接数据库...');
    await sequelize.authenticateWithRetry();
    console.log('✅ 数据库连接成功');

    console.log('\n2. 同步所有表结构...');
    
    const modelsPath = require('path').join(__dirname, '../models/mysql');
    const fs = require('fs');
    
    const modelFiles = fs.readdirSync(modelsPath)
      .filter(file => file.endsWith('.js'));
    
    for (const file of modelFiles) {
      const model = require(modelsPath + '/' + file);
      if (model.sync) {
        await model.sync({ alter: config.nodeEnv === 'development' });
        console.log(`   ✅ ${file} 表同步完成`);
      }
    }

    console.log('\n3. 创建默认管理员用户...');
    const User = require('../models/mysql/User');
    
    const hashedPassword = bcrypt.hashSync('123456', 10);
    const now = Math.floor(Date.now() / 1000);
    
    const [admin, created] = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        username: 'admin',
        nickname: '管理员',
        mobile: '13800138000',
        password: hashedPassword,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        status: 1,
        is_dav: 1,
        is_manage_normal: 1,
        money: 99999.99,
        vip: 1,
        vip_lv: 5,
        create_time: now,
        last_login_time: now,
        dec: '系统管理员账号'
      }
    });

    if (created) {
      console.log('   ✅ 管理员用户创建成功');
      console.log('      用户名: admin');
      console.log('      密码: 123456');
    } else {
      console.log('   ℹ️  管理员用户已存在');
    }

    console.log('\n========== 数据库初始化完成 ==========');
    console.log('\n现在可以正常使用系统了！');
    console.log('登录账号: admin');
    console.log('登录密码: 123456\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n========== 数据库初始化失败 ==========');
    console.error(error);
    process.exit(1);
  }
};

initDatabase();
