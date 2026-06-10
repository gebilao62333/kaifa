/**
 * 数据库初始化器 - 本地数据源版本
 * 
 * 使用本地种子数据生成器填充数据，不依赖外部数据库。
 */
const models = require('../models/index');
const { generateAllSeedData } = require('../data/seed');

const initializeDatabase = async () => {
  console.log('\n📊 正在检查本地数据源状态...\n');

  try {
    // 检查是否有现有数据
    let needsInit = false;
    const checks = [];

    try {
      const userCount = await models.User.count();
      checks.push({ name: '用户', count: userCount, needsData: userCount === 0 });
      console.log(`👤 用户表现有记录数: ${userCount}`);
      if (userCount === 0) needsInit = true;
    } catch (e) {
      console.warn(`⚠️ 无法检查用户表: ${e.message}`);
      needsInit = true;
    }

    try {
      const gameCount = await models.Game.count();
      checks.push({ name: '游戏', count: gameCount, needsData: gameCount === 0 });
      console.log(`🎮 游戏表现有记录数: ${gameCount}`);
      if (gameCount === 0) needsInit = true;
    } catch (e) {
      console.warn(`⚠️ 无法检查游戏表: ${e.message}`);
    }

    try {
      const giftCount = await models.Gift.count();
      checks.push({ name: '礼物', count: giftCount, needsData: giftCount === 0 });
      console.log(`🎁 礼物表现有记录数: ${giftCount}`);
      if (giftCount === 0) needsInit = true;
    } catch (e) {
      console.warn(`⚠️ 无法检查礼物表: ${e.message}`);
    }

    try {
      const adminCount = await models.Admin.count();
      checks.push({ name: '管理员', count: adminCount, needsData: adminCount === 0 });
      console.log(`🔐 管理员表现有记录数: ${adminCount}`);
      if (adminCount === 0) needsInit = true;
    } catch (e) {
      console.warn(`⚠️ 无法检查管理员表: ${e.message}`);
    }

    if (needsInit) {
      console.log('\n🆕 检测到缺失数据，开始生成种子数据...\n');
      await seedAllData();
      console.log('\n✅ 种子数据初始化完成！\n');
    } else {
      console.log('\n✅ 所有关键表数据完整，跳过初始化\n');
    }

    return { initialized: needsInit, checks };
  } catch (error) {
    console.error('\n❌ 数据检查失败:', error.message);
    return { error: error.message };
  }
};

const seedAllData = async () => {
  try {
    console.log('🌱 正在生成所有种子数据...');

    const seedData = await generateAllSeedData();

    // 表名到模型名的映射
    const tableModelMap = {
      'xn_admin': models.Admin,
      'xn_admin_role': models.AdminRole,
      'xn_user': models.User,
      'xn_virtual_user': models.VirtualUser,
      'xn_game': models.Game,
      'xn_circle_tag': models.CircleTag,
      'virtual_user_tag': models.VirtualUserTag,
      'xn_gift': models.Gift,
      'xn_recharge_package': models.RechargePackage,
      'xn_vip_package': models.VipPackage,
      'xn_card': models.Card,
      'xn_banner': models.Banner,
      'xn_setting': models.Setting,
      'xn_game_order': models.GameOrder,
      'xn_post': models.Post,
      'xn_post_like': models.PostLike,
      'xn_post_comment': models.PostComment,
      'xn_user_follow': models.UserFollow,
      'xn_reserve': models.Reserve,
      'xn_gift_log': models.GiftLog,
      'xn_order_chong': models.OrderChong,
      'xn_companion_profile': models.CompanionProfile,
      'xn_virtual_user_tag_relation': models.VirtualUserTagRelation,
      'xn_report': models.Report,
      'xn_chat_room': models.ChatRoom,
      'xn_chat_log': models.ChatLog,
      'xn_demand': models.Demand,
      'xn_withdraw': models.Withdraw,
      'xn_call_record': models.CallRecord,
      'xn_call_billing': models.CallBilling,
      'xn_vip_order': models.VipOrder,
      'xn_album_photo': models.AlbumPhoto,
      'xn_post_unlock': models.PostUnlock,
      'xn_red_packet': models.RedPacket,
      'xn_red_packet_log': models.RedPacketLog,
      'xn_reserve_slot': models.ReserveSlot,
      'xn_gift_bag': models.GiftBag,
      'xn_recommend': models.Recommend,
      'xn_virtual_chat_history': models.VirtualChatHistory,
      'xn_customer_service': models.CustomerService
    };

    let totalSeeded = 0;
    for (const [tableName, model] of Object.entries(tableModelMap)) {
      const data = seedData[tableName];
      if (data && data.length > 0 && model) {
        try {
          await model.bulkCreate(data, { ignoreDuplicates: true });
          console.log(`  ✅ ${tableName}: ${data.length} 条`);
          totalSeeded += data.length;
        } catch (e) {
          console.warn(`  ⚠️  ${tableName} 写入失败: ${e.message}`);
        }
      }
    }

    console.log(`\n📊 共生成 ${totalSeeded} 条种子数据`);
    console.log('💡 测试账号: mock_user_1 ~ mock_user_50, 密码: 123456');
    console.log('🔑 管理员: admin / admin123');
  } catch (error) {
    console.error('❌ 生成种子数据失败:', error.message);
    console.error(error.stack);
  }
};

module.exports = {
  initializeDatabase,
  seedAllData
};
