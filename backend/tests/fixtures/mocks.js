const mockUser = {
  id: 1,
  username: 'testuser',
  nickname: '测试用户',
  avatar: 'https://example.com/avatar.jpg',
  mobile: '13800138000',
  email: 'test@example.com',
  open_id: 'test_open_id',
  union_id: 'test_union_id',
  money: 100,
  gift_money: 50,
  gift_money_zong: 50,
  score: 1000,
  lv: 5,
  vip: 0,
  vip_lv: 0,
  sex: 1,
  city: '北京',
  status: 0,
  fans_num: 0,
  create_time: Math.floor(Date.now() / 1000),
  last_login_time: Math.floor(Date.now() / 1000),
  ip: '127.0.0.1',
  platform: 'app',
  dec: '测试简介'
};

const mockCompanion = {
  id: 1,
  user_id: 2,
  game_id: 1,
  price: 50,
  tags: '声优,聊天',
  voice_intro: null,
  order_num: 10,
  income_total: 500,
  pingjia_num: 10,
  star: 4.8,
  status: 2,
  create_time: Math.floor(Date.now() / 1000)
};

const mockGift = {
  id: 1,
  name: '爱心',
  image: 'https://example.com/gift1.jpg',
  svga: null,
  money: 10,
  type: 0,
  is_vip: 0,
  tian: 0,
  status: 1,
  sort: 1
};

const mockGame = {
  id: 1,
  name: '王者荣耀',
  image: 'https://example.com/game1.jpg',
  image_bg: 'https://example.com/game1-bg.jpg',
  status: 1,
  sort: 1,
  create_time: Math.floor(Date.now() / 1000)
};

const mockPost = {
  id: 1,
  user_id: 1,
  content: '测试动态内容',
  images: '["https://example.com/img1.jpg,https://example.com/img2.jpg',
  videos: '',
  thumb_num: 10,
  comment_num: 5,
  share_num: 2,
  tag_id: 0,
  type: 0,
  status: 1,
  create_time: Math.floor(Date.now() / 1000)
};

const mockGameOrder = {
  id: 1,
  order_no: 'DK20240511123456',
  user_id: 1,
  target_user_id: 2,
  game_id: 1,
  game_name: '王者荣耀',
  price: 50,
  num: 1,
  total_price: 50,
  status: 0,
  create_time: Math.floor(Date.now() / 1000)
};

const mockChatMessage = {
  id: 1,
  from_id: 1,
  from_name: '测试用户',
  to_id: 2,
  to_name: '陪玩师A',
  content: '你好',
  type: 0,
  vod_url: '',
  sec: 0,
  time: Math.floor(Date.now() / 1000),
  isread: 0
};

module.exports = {
  mockUser,
  mockCompanion,
  mockGift,
  mockGame,
  mockPost,
  mockGameOrder,
  mockChatMessage
};
