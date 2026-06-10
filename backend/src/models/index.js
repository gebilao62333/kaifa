const sequelize = require('../config/mysql');

const User = require('./mysql/User');
const ChatLog = require('./mysql/ChatLog');
const ChatRoom = require('./mysql/ChatRoom');
const Gift = require('./mysql/Gift');
const GiftBag = require('./mysql/GiftBag');
const GiftLog = require('./mysql/GiftLog');
const OrderChong = require('./mysql/OrderChong');
const Game = require('./mysql/Game');
const GameOrder = require('./mysql/GameOrder');
const CompanionProfile = require('./mysql/CompanionProfile');
const Post = require('./mysql/Post');
const PostLike = require('./mysql/PostLike');
const PostComment = require('./mysql/PostComment');
const PostUnlock = require('./mysql/PostUnlock');
const UserFollow = require('./mysql/UserFollow');
const RedPacket = require('./mysql/RedPacket');
const RedPacketLog = require('./mysql/RedPacketLog');
const Report = require('./mysql/Report');
const Reserve = require('./mysql/Reserve');
const ReserveSlot = require('./mysql/ReserveSlot');
const Demand = require('./mysql/Demand')(sequelize);
const CallRecord = require('./mysql/CallRecord');
const CallBilling = require('./mysql/CallBilling');
const Banner = require('./mysql/Banner');
const RechargePackage = require('./mysql/RechargePackage');
const Card = require('./mysql/Card');
const Withdraw = require('./mysql/Withdraw');
const VirtualUser = require('./mysql/VirtualUser');
const VirtualChatHistory = require('./mysql/VirtualChatHistory');
const VirtualUserTag = require('./mysql/VirtualUserTag');
const VirtualUserTagRelation = require('./mysql/VirtualUserTagRelation');
const VipPackage = require('./mysql/VipPackage');
const VipOrder = require('./mysql/VipOrder');
const AlbumPhoto = require('./mysql/AlbumPhoto')(sequelize);
const CircleTag = require('./mysql/CircleTag');
const Admin = require('./mysql/Admin');
const AdminRole = require('./mysql/AdminRole');
const CustomerService = require('./mysql/CustomerService');
const Recommend = require('./mysql/Recommend');
const Setting = require('./mysql/Setting');

const ChatMessage = require('./mongo/ChatMessage');
const UserSession = require('./mongo/UserSession');
const Notification = require('./mongo/Notification');

CompanionProfile.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
  targetKey: 'id'
});

User.hasMany(CompanionProfile, {
  foreignKey: 'user_id',
  as: 'companion_profiles'
});

GameOrder.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
  targetKey: 'id'
});

GameOrder.belongsTo(User, {
  foreignKey: 'companion_id',
  as: 'companion',
  targetKey: 'id'
});

GameOrder.belongsTo(Game, {
  foreignKey: 'game_id',
  as: 'game',
  targetKey: 'id'
});

module.exports = {
  User,
  ChatLog,
  ChatRoom,
  Gift,
  GiftBag,
  GiftLog,
  OrderChong,
  Game,
  GameOrder,
  CompanionProfile,
  Post,
  PostLike,
  PostComment,
  PostUnlock,
  UserFollow,
  RedPacket,
  RedPacketLog,
  Report,
  Reserve,
  ReserveSlot,
  Demand,
  CallRecord,
  CallBilling,
  Banner,
  RechargePackage,
  Card,
  Withdraw,
  VirtualUser,
  VirtualChatHistory,
  VirtualUserTag,
  VirtualUserTagRelation,
  ChatMessage,
  CustomerService,
  UserSession,
  Notification,
  AlbumPhoto,
  VipPackage,
  VipOrder,
  CircleTag,
  Admin,
  AdminRole,
  Recommend,
  Setting
};
