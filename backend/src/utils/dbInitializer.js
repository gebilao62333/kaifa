const {
  generateMockUsers,
  generateMockVirtualUsers,
  generateMockPosts,
  generateMockGameOrders,
  generateMockCompanionProfiles,
  generateMockChatLogs,
  generateMockCircleTags,
  generateMockGames,
  generateMockVirtualUserTags,
  generateMockGifts,
  generateMockWithdraws
} = require('../models/mockDataGenerator');

const models = require('../models/index');

const initializeDatabase = async () => {
  console.log('\n📊 正在检查数据库状态...\n');
  
  try {
    // 检查各个关键表
    const checks = [];
    
    // 用户表
    try {
      const userCount = await models.User.count();
      checks.push({ name: '用户', table: 'User', count: userCount, needsData: userCount === 0 });
      console.log(`👤 用户表现有记录数: ${userCount}`);
    } catch (e) {
      console.warn(`⚠️ 无法检查用户表: ${e.message}`);
    }
    
    // 游戏表
    try {
      const gameCount = await models.Game.count();
      checks.push({ name: '游戏', table: 'Game', count: gameCount, needsData: gameCount === 0 });
      console.log(`🎮 游戏表现有记录数: ${gameCount}`);
    } catch (e) {
      console.warn(`⚠️ 无法检查表: ${e.message}`);
    }
    
    // 礼物表
    try {
      const giftCount = await models.Gift.count();
      checks.push({ name: '礼物', table: 'Gift', count: giftCount, needsData: giftCount === 0 });
      console.log(`🎁 礼物表现有记录数: ${giftCount}`);
    } catch (e) {
      console.warn(`⚠️ 无法检查礼物表: ${e.message}`);
    }
    
    // 标签表
    try {
      const tagCount = await models.CircleTag.count();
      checks.push({ name: '圈子标签', table: 'CircleTag', count: tagCount, needsData: tagCount === 0 });
      console.log(`🏷️ 圈子标签表现有记录数: ${tagCount}`);
    } catch (e) {
      console.warn(`⚠️ 无法检查标签表: ${e.message}`);
    }
    
    // 管理员表
    try {
      const adminCount = await models.Admin.count();
      checks.push({ name: '管理员', table: 'Admin', count: adminCount, needsData: adminCount === 0 });
      console.log(`🔐 管理员表现有记录数: ${adminCount}`);
    } catch (e) {
      console.warn(`⚠️ 无法检查管理员表: ${e.message}`);
    }
    
    // 检查是否需要初始化数据
    const needsInit = checks.some(c => c.needsData);
    
    if (needsInit) {
      console.log('\n🆕 检测到缺失数据，开始补充...\n');
      await seedTestData();
      console.log('\n✅ 数据补充完成！\n');
    } else {
      console.log('\n✅ 所有关键表数据完整，跳过初始化\n');
    }
    
    return { initialized: needsInit, checks };
  } catch (error) {
    console.error('\n❌ 数据库检查失败:', error.message);
    return { error: error.message };
  }
};

const seedTestData = async () => {
  const count = 50;
  
  try {
    // 1. 初始化标签和基础数据（检查是否已存在）
    console.log('📝 初始化圈子标签...');
    const existingTags = await models.CircleTag.count();
    if (existingTags === 0) {
      const circleTags = generateMockCircleTags();
      await models.CircleTag.bulkCreate(circleTags, { ignoreDuplicates: true });
    }
    
    console.log('🎮 初始化游戏数据...');
    const existingGames = await models.Game.count();
    if (existingGames === 0) {
      const games = generateMockGames();
      await models.Game.bulkCreate(games, { ignoreDuplicates: true });
    }
    
    console.log('🏷️ 初始化虚拟用户标签...');
    const existingVirtualTags = await models.VirtualUserTag.count();
    if (existingVirtualTags === 0) {
      const virtualTags = generateMockVirtualUserTags();
      await models.VirtualUserTag.bulkCreate(virtualTags, { ignoreDuplicates: true });
    }
    
    console.log('🎁 初始化礼物数据...');
    const existingGifts = await models.Gift.count();
    if (existingGifts === 0) {
      const gifts = generateMockGifts();
      await models.Gift.bulkCreate(gifts, { ignoreDuplicates: true });
    }
    
    // 2. 初始化用户数据（检查是否已存在）
    console.log('👤 初始化用户数据...');
    const existingUsers = await models.User.count();
    if (existingUsers === 0) {
      const users = generateMockUsers(count);
      await models.User.bulkCreate(users, { ignoreDuplicates: true });
    }
    
    // 3. 初始化虚拟用户（检查是否已存在）
    console.log('🤖 初始化虚拟用户...');
    const existingVirtualUsers = await models.VirtualUser.count();
    if (existingVirtualUsers === 0) {
      const virtualUsers = generateMockVirtualUsers(count);
      await models.VirtualUser.bulkCreate(virtualUsers, { ignoreDuplicates: true });
    }
    
    // 9. 初始化默认管理员账号（检查是否已存在）
    console.log('🔐 初始化管理员账号...');
    const existingAdmin = await models.Admin.findOne({ where: { username: 'admin' } });
    if (!existingAdmin) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await models.Admin.create({
        username: 'admin',
        password: hashedPassword,
        role_id: 1,
        status: 1,
        create_time: Math.floor(Date.now() / 1000),
        update_time: Math.floor(Date.now() / 1000)
      });
    }
    
    // 10. 初始化默认角色（检查是否已存在）
    console.log('👑 初始化角色数据...');
    const existingRole = await models.AdminRole.findOne({ where: { name: '超级管理员' } });
    if (!existingRole) {
      await models.AdminRole.create({
        name: '超级管理员',
        permissions: JSON.stringify(['*']),
        status: 1,
        create_time: Math.floor(Date.now() / 1000),
        update_time: Math.floor(Date.now() / 1000)
      });
    }
    
    console.log(`\n✅ 数据检查和补充完成！`);
  } catch (error) {
    console.error('❌ 生成测试数据时出错:', error);
    // 不要抛出错误，让服务继续运行
  }
};

module.exports = {
  initializeDatabase,
  seedTestData
};
