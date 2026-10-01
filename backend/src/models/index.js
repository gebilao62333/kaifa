// ==================== MySQL 模型 ====================
const User = require('./mysql/User');
const ChatLog = require('./mysql/ChatLog');
const ChatSession = require('./mysql/ChatSession');
const Gift = require('./mysql/Gift');
const GiftBag = require('./mysql/GiftBag');
const GiftLog = require('./mysql/GiftLog');
const OrderChong = require('./mysql/OrderChong');
const Game = require('./mysql/Game');
const GameOrder = require('./mysql/GameOrder');
const CompanionProfile = require('./mysql/CompanionProfile');
const Post = require('./mysql/Post');
const PostLike = require('./mysql/PostLike');
const UserVisit = require('./mysql/UserVisit');
const UserPref = require('./mysql/UserPref');
const PostComment = require('./mysql/PostComment');
const PostUnlock = require('./mysql/PostUnlock');
const UserFollow = require('./mysql/UserFollow');
const RedPacket = require('./mysql/RedPacket');
const RedPacketLog = require('./mysql/RedPacketLog');
const Report = require('./mysql/Report');
const Reserve = require('./mysql/Reserve');
const ReserveSlot = require('./mysql/ReserveSlot');
const Demand = require('./mysql/Demand');
const CallRecord = require('./mysql/CallRecord');
const CallBilling = require('./mysql/CallBilling');
const Banner = require('./mysql/Banner');
const SplashScreen = require('./mysql/SplashScreen');
const RechargePackage = require('./mysql/RechargePackage');
const Card = require('./mysql/Card');
const Withdraw = require('./mysql/Withdraw');
const IncomeRecord = require('./mysql/IncomeRecord');
const ExpenseRecord = require('./mysql/ExpenseRecord');
const VirtualUser = require('./mysql/VirtualUser');
const VirtualChatHistory = require('./mysql/VirtualChatHistory');
const VirtualUserTag = require('./mysql/VirtualUserTag');
const VirtualUserTagRelation = require('./mysql/VirtualUserTagRelation');
const VipPackage = require('./mysql/VipPackage');
const VipOrder = require('./mysql/VipOrder');
const AlbumPhoto = require('./mysql/AlbumPhoto');
const AlbumLike = require('./mysql/AlbumLike');
const MediaAsset = require('./mysql/MediaAsset');
const Feedback = require('./mysql/Feedback');
const Admin = require('./mysql/Admin');
const AdminRole = require('./mysql/AdminRole');
const SystemSettings = require('./mysql/SystemSettings');

// ==================== MongoDB 模型 ====================
const ChatMessage = require('./mongo/ChatMessage');
const UserSession = require('./mongo/UserSession');
const Notification = require('./mongo/Notification');

module.exports = {
  User,
  ChatLog,
  ChatSession,
  Gift,
  GiftBag,
  GiftLog,
  OrderChong,
  Game,
  GameOrder,
  CompanionProfile,
  Post,
  PostLike,
  UserVisit,
  UserPref,
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
  SplashScreen,
  RechargePackage,
  Card,
  Withdraw,
  IncomeRecord,
  ExpenseRecord,
  VirtualUser,
  VirtualChatHistory,
  VirtualUserTag,
  VirtualUserTagRelation,
  ChatMessage,
  UserSession,
  Notification,
  AlbumPhoto,
  AlbumLike,
  MediaAsset,
  Feedback,
  SystemSettings,
  VipPackage,
  VipOrder,
  Admin,
  AdminRole
};
