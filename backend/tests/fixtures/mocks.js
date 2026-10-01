/**
 * 通用测试 mock 数据
 * 与 src/models/mysql 中的模型字段保持一致
 */

const mockGift = {
  id: 1,
  name: '爱心',
  title: '爱心',
  image: '/uploads/gift/heart.png',
  svga: '/uploads/gift/heart.svga',
  money: 10,
  type: 0,
  is_vip: 0,
  tian: 0,
  status: 1,
  sort: 0
};

const mockUser = {
  id: 1,
  username: 'testuser',
  nickname: '测试用户',
  avatar: '/uploads/avatar/default.png',
  money: 100,
  gift_money: 0,
  gift_money_zong: 0,
  vip: 0,
  vip_lv: 0,
  vip_expire_time: null,
  status: 1
};

module.exports = {
  mockGift,
  mockUser
};
