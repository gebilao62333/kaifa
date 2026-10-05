// 等级与经验体系（唯一口径）：升级曲线、VIP 加速倍率、经验来源、权益门槛
// 前端 LevelAcceleration 页与后端所有校验都读这里，避免两处对不上。

// 升到下一级所需经验：Lv.n → n*1000 + 500
const expToNextLevel = (lv) => Math.max(1, Number(lv) || 1) * 1000 + 500;

// VIP 等级对应的经验加速倍率
const VIP_BOOST = { 0: 1.0, 1: 1.2, 2: 1.5, 3: 1.8, 4: 2.0 };
const vipBoost = (vipLevel) => VIP_BOOST[Number(vipLevel) || 0] || 1.0;

// 经验来源（点数为未乘倍率的基础值）
const EXP_SOURCES = {
  order_completed: 50,
  post_created: 20,
  daily_check_in: 10,
  real_name_verified: 100
};

// exp 存「当前等级内已积累的经验」，升级时溢出结转到下一级
const applyExp = (lv, exp, amount) => {
  let nextLv = Math.max(1, Number(lv) || 1);
  let nextExp = Math.max(0, Number(exp) || 0) + Math.max(0, Math.round(Number(amount) || 0));
  let leveledUp = false;
  let guard = 0;
  while (nextExp >= expToNextLevel(nextLv) && guard < 1000) {
    nextExp -= expToNextLevel(nextLv);
    nextLv += 1;
    leveledUp = true;
    guard += 1;
  }
  return { lv: nextLv, exp: nextExp, leveledUp };
};

// 7 项等级权益，每一项都对应产品里真实存在的入口，达标即用、不达标服务端 422。
const BENEFITS = [
  { key: 'signature', level: 5, name: '解锁个性签名' },
  { key: 'stealth_visit', level: 10, name: '解锁在线状态隐身' },
  { key: 'post_images', level: 15, name: '解锁动态发布图片' },
  { key: 'identity_badge', level: 20, name: '解锁专属身份标识' },
  { key: 'album_expand', level: 25, name: '解锁相册扩容至50张' },
  { key: 'priority_matching', level: 30, name: '解锁优先匹配' },
  { key: 'skin_shop', level: 45, name: '解锁装扮商城' }
];

const benefitByLevel = (lv) => BENEFITS.filter(b => b.level <= (Number(lv) || 1));
const findBenefit = (key) => BENEFITS.find(b => b.key === key) || null;

// 相册张数上限：Lv.25 以下为基础额度
const ALBUM_LIMIT_BASE = 20;
const ALBUM_LIMIT_EXPANDED = 50;

module.exports = {
  expToNextLevel,
  VIP_BOOST,
  vipBoost,
  EXP_SOURCES,
  applyExp,
  BENEFITS,
  benefitByLevel,
  findBenefit,
  ALBUM_LIMIT_BASE,
  ALBUM_LIMIT_EXPANDED
};
