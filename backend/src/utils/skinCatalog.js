// 装扮目录（唯一事实来源）：价格、VIP 门槛、展示资源都只在服务端定义。
//
// 审计 H-6：改造前「价格」和「所有权」都来自客户端——POST /api/user/pref 的 body.spend 直接当作扣款额，
// body.data.skinShop.owned 原样合并进用户偏好。抓包把 spend 改成 0 就能白拿任意装扮，
// 而且 benefitsRequested() 只在 spend>0 时才把 skin_shop 入列，连 Lv.45 门槛都一起被跳过。
// 目录收归服务端后，客户端只提交 skinId，金额与 VIP 门槛一律由这里解析。

const SKIN_TYPES = ['frame', 'badge', 'bubble', 'theme'];

const SKINS = [
  // ===== 头像框 =====
  { id: 'sf1', type: 'frame', name: '简约白边', price: 0, vipLevel: 0, assets: { style: { border: '3px solid #ddd', borderRadius: '10px', boxShadow: '0 0 6px rgba(0,0,0,0.1)' } } },
  { id: 'sf2', type: 'frame', name: '清新绿边', price: 500, vipLevel: 0, assets: { style: { border: '3px solid #2ecc71', borderRadius: '10px', boxShadow: '0 0 8px rgba(46,204,113,0.3)' } } },
  { id: 'sf3', type: 'frame', name: '活力橙边', price: 800, vipLevel: 0, assets: { style: { border: '3px solid #e67e22', borderRadius: '10px', boxShadow: '0 0 8px rgba(230,126,34,0.3)' } } },
  { id: 'sf4', type: 'frame', name: '梦幻粉边', price: 1200, vipLevel: 0, assets: { style: { border: '3px solid #e84393', borderRadius: '10px', boxShadow: '0 0 10px rgba(232,67,147,0.4)' } } },
  { id: 'sf5', type: 'frame', name: '深邃蓝边', price: 1500, vipLevel: 0, assets: { style: { border: '3px solid #0984e3', borderRadius: '10px', boxShadow: '0 0 10px rgba(9,132,227,0.4)' } } },
  { id: 'sf6', type: 'frame', name: '极光幻彩', price: 3000, vipLevel: 2, assets: { style: { border: '3px solid transparent', borderRadius: '10px', boxShadow: '0 0 14px rgba(102,126,234,0.5)', background: 'linear-gradient(135deg, #667eea, #764ba2, #ffd700) padding-box, linear-gradient(135deg, #667eea, #764ba2, #ffd700) border-box' } } },
  { id: 'sf7', type: 'frame', name: '烈焰金边', price: 5000, vipLevel: 3, assets: { style: { border: '4px solid #ffd700', borderRadius: '10px', boxShadow: '0 0 18px rgba(255,215,0,0.5), 0 0 0 3px #fff' } } },
  { id: 'sf8', type: 'frame', name: '暗夜流光', price: 8888, vipLevel: 4, assets: { style: { border: '4px solid #6c5ce7', borderRadius: '10px', boxShadow: '0 0 20px rgba(108,92,231,0.5), 0 0 0 3px rgba(255,255,255,0.3)' } } },

  // ===== 身份标识 =====
  { id: 'sb1', type: 'badge', name: '人气新星', price: 0, vipLevel: 0, assets: { icon: '🌟', label: '人气新星', style: { background: 'linear-gradient(135deg, #74b9ff, #0984e3)', color: '#fff', borderRadius: '10px', padding: '6px 14px' } } },
  { id: 'sb2', type: 'badge', name: '游戏达人', price: 600, vipLevel: 0, assets: { icon: '🎮', label: '游戏达人', style: { background: 'linear-gradient(135deg, #a29bfe, #6c5ce7)', color: '#fff', borderRadius: '10px', padding: '6px 14px' } } },
  { id: 'sb3', type: 'badge', name: '社交达人', price: 1000, vipLevel: 0, assets: { icon: '💬', label: '社交达人', style: { background: 'linear-gradient(135deg, #fd79a8, #e84393)', color: '#fff', borderRadius: '10px', padding: '6px 14px' } } },
  { id: 'sb4', type: 'badge', name: '上分高手', price: 2000, vipLevel: 0, assets: { icon: '🏆', label: '上分高手', style: { background: 'linear-gradient(135deg, #fdcb6e, #e17055)', color: '#fff', borderRadius: '10px', padding: '6px 14px' } } },
  { id: 'sb5', type: 'badge', name: '神壕', price: 5000, vipLevel: 3, assets: { icon: '💰', label: '神壕', style: { background: 'linear-gradient(135deg, #ffd700, #ff8c00)', color: '#fff', borderRadius: '10px', padding: '6px 14px' } } },
  { id: 'sb6', type: 'badge', name: '全服偶像', price: 9999, vipLevel: 4, assets: { icon: '💎', label: '全服偶像', style: { background: 'linear-gradient(135deg, #ff6b6b, #c0392b, #ffd700)', color: '#fff', borderRadius: '10px', padding: '6px 14px' } } },

  // ===== 聊天气泡 =====
  { id: 'sbbl1', type: 'bubble', name: '默认气泡', price: 0, vipLevel: 0, assets: { preview: '你好呀~', style: { background: '#f0f0f0', color: '#333', borderRadius: '12px 12px 12px 4px', padding: '10px 16px' } } },
  { id: 'sbbl2', type: 'bubble', name: '清新对话', price: 400, vipLevel: 0, assets: { preview: '你好呀~', style: { background: 'linear-gradient(135deg, #dfe6e9, #b2bec3)', color: '#2d3436', borderRadius: '12px 12px 12px 4px', padding: '10px 16px' } } },
  { id: 'sbbl3', type: 'bubble', name: '可爱粉泡', price: 800, vipLevel: 0, assets: { preview: '你好呀~', style: { background: 'linear-gradient(135deg, #fd79a8, #e84393)', color: '#fff', borderRadius: '18px 18px 18px 4px', padding: '10px 18px' } } },
  { id: 'sbbl4', type: 'bubble', name: '星空泡泡', price: 1200, vipLevel: 0, assets: { preview: '你好呀~', style: { background: 'linear-gradient(135deg, #74b9ff, #0984e3)', color: '#fff', borderRadius: '16px 4px 16px 4px', padding: '10px 16px' } } },
  { id: 'sbbl5', type: 'bubble', name: '炫金气泡', price: 2500, vipLevel: 2, assets: { preview: '你好呀~', style: { background: 'linear-gradient(135deg, #ffd700, #ff8c00)', color: '#fff', borderRadius: '20px 20px 4px 20px', padding: '10px 20px', boxShadow: '0 4px 12px rgba(255,215,0,0.3)' } } },
  { id: 'sbbl6', type: 'bubble', name: '暗夜贵族', price: 4000, vipLevel: 3, assets: { preview: '你好呀~', style: { background: 'linear-gradient(135deg, #2d3436, #636e72)', color: '#ffd700', borderRadius: '12px 12px 4px 12px', padding: '10px 16px', border: '1px solid #ffd700' } } },

  // ===== 主题皮肤 =====
  { id: 'sth1', type: 'theme', name: '经典蓝', price: 0, vipLevel: 0, assets: { bg: '#f5f5f5', primary: '#667eea', secondary: '#764ba2' } },
  { id: 'sth2', type: 'theme', name: '少女粉', price: 600, vipLevel: 0, assets: { bg: '#fff5f5', primary: '#fd79a8', secondary: '#e84393' } },
  { id: 'sth3', type: 'theme', name: '森林绿', price: 1000, vipLevel: 0, assets: { bg: '#f0fff4', primary: '#2ecc71', secondary: '#27ae60' } },
  { id: 'sth4', type: 'theme', name: '暗夜黑', price: 2000, vipLevel: 0, assets: { bg: '#1a1a2e', primary: '#6c5ce7', secondary: '#a29bfe' } },
  { id: 'sth5', type: 'theme', name: '土豪金', price: 3500, vipLevel: 2, assets: { bg: '#fff8e1', primary: '#ffd700', secondary: '#ff8c00' } },
  { id: 'sth6', type: 'theme', name: '极光紫', price: 5000, vipLevel: 3, assets: { bg: '#f0e6ff', primary: '#a855f7', secondary: '#d946ef' } }
];

// 状态图里的键统一用 `<type>_<id>`，与改造前前端使用的键一致，历史数据才还能读出来。
const skinKey = (skin) => `${skin.type}_${skin.id}`;

const byId = new Map();
const byKey = new Map();
SKINS.forEach((skin) => {
  const item = { ...skin, key: skinKey(skin), vipOnly: Number(skin.vipLevel) > 0 };
  byId.set(item.id, item);
  byKey.set(item.key, item);
});

// 只接受字符串：Object.keys 出来的一定是字符串，而请求体里的任意对象（带 toString）不该被当成 id。
const findSkin = (id) => (typeof id === 'string' ? byId.get(id) || null : null);
const findSkinByKey = (key) => (typeof key === 'string' ? byKey.get(key) || null : null);

// 免费且非 VIP 专属的装扮不需要购买记录，服务端直接视为已拥有（保持改造前的默认外观口径）。
const isFreeSkin = (skin) => !!skin && Number(skin.price) === 0 && Number(skin.vipLevel) === 0;

module.exports = {
  SKIN_TYPES,
  SKINS,
  skinKey,
  findSkin,
  findSkinByKey,
  isFreeSkin
};
