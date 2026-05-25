<template>
  <div class="edit-profile-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">编辑资料</span>
      <span class="save-btn" @click="saveProfile">保存</span>
    </div>

    <div class="content">
      <div class="profile-completeness">
        <div class="completeness-header">
          <span class="completeness-title">资料完善度</span>
          <span class="completeness-percent">{{ completeness }}%</span>
        </div>
        <div class="completeness-bar">
          <div class="completeness-fill" :style="{ width: completeness + '%' }"></div>
        </div>
        <div class="completeness-tip">完善资料让更多人认识你</div>
      </div>

      <div class="avatar-section">
        <div class="avatar-wrapper">
          <img class="avatar" :src="form.avatar" alt="头像" />
          <div class="avatar-vip" v-if="form.isVip">VIP</div>
        </div>
        <div class="avatar-mask" @click="selectAvatar">
          <span class="upload-icon">📷</span>
          <span class="upload-text">更换头像</span>
        </div>
        <input type="file" ref="avatarInput" accept="image/*" style="display: none" @change="handleAvatarChange" />
      </div>

      <div class="section-title">基本信息</div>
      <div class="form-section">
        <div class="form-item">
          <span class="label">昵称</span>
          <input type="text" class="input" v-model="form.nickname" placeholder="请输入昵称" maxlength="20" />
          <span class="char-count">{{ form.nickname.length }}/20</span>
        </div>

        <div class="form-item">
          <span class="label">性别</span>
          <div class="gender-options">
            <div class="gender-option" :class="{ active: form.gender === 'male' }" @click="form.gender = 'male'">
              <span class="gender-icon">👨</span>
              <span class="gender-text">男</span>
            </div>
            <div class="gender-option" :class="{ active: form.gender === 'female' }" @click="form.gender = 'female'">
              <span class="gender-icon">👩</span>
              <span class="gender-text">女</span>
            </div>
            <div class="gender-option" :class="{ active: form.gender === 'secret' }" @click="form.gender = 'secret'">
              <span class="gender-icon">🙈</span>
              <span class="gender-text">保密</span>
            </div>
          </div>
        </div>

        <div class="form-item">
          <span class="label">生日</span>
          <input type="date" class="input" v-model="form.birthday" />
        </div>

        <div class="form-item">
          <span class="label">所在地区</span>
          <div class="region-display" @click="showRegionPicker = true">
            {{ form.region || '请选择地区' }}
            <span class="arrow">›</span>
          </div>
        </div>

        <div class="form-item">
          <span class="label">身高</span>
          <div class="input-with-unit">
            <input type="number" class="input small" v-model="form.height" placeholder="170" />
            <span class="unit">cm</span>
          </div>
        </div>

        <div class="form-item">
          <span class="label">职业</span>
          <input type="text" class="input" v-model="form.profession" placeholder="请输入职业" />
        </div>
      </div>

      <div class="section-title">个人介绍</div>
      <div class="form-section">
        <div class="form-item">
          <span class="label">个性签名</span>
          <textarea class="textarea" v-model="form.signature" placeholder="说点什么介绍自己..." maxlength="200"></textarea>
          <span class="char-count">{{ form.signature.length }}/200</span>
        </div>

        <div class="form-item">
          <span class="label">兴趣爱好</span>
          <div class="hobby-tags">
            <span class="hobby-tag" v-for="hobby in hobbyOptions" :key="hobby" :class="{ active: form.hobbies.includes(hobby) }" @click="toggleHobby(hobby)">
              {{ hobby }}
            </span>
          </div>
        </div>

        <div class="form-item">
          <span class="label">擅长游戏</span>
          <div class="game-tags">
            <span class="game-tag" v-for="game in gameOptions" :key="game.name" :class="{ active: form.games.includes(game.name) }" @click="toggleGame(game.name)">
              {{ game.name }}
            </span>
            <span class="game-tag add" @click="showGamePicker = true">+ 添加</span>
          </div>
        </div>

        <div class="form-item">
          <span class="label">陪玩价格</span>
          <div class="price-input">
            <span class="price-unit">¥</span>
            <input type="number" class="input price" v-model="form.price" placeholder="88" />
            <span class="price-suffix">/小时</span>
          </div>
        </div>
      </div>

      <div class="section-title">社交信息</div>
      <div class="form-section">
        <div class="form-item">
          <span class="label">微信号</span>
          <input type="text" class="input" v-model="form.wechat" placeholder="请输入微信号" />
        </div>

        <div class="form-item">
          <span class="label">手机号</span>
          <div class="phone-display">
            <span class="phone-value">{{ form.phone || '未绑定' }}</span>
            <span class="phone-btn" @click="showPhoneModal = true">{{ form.phone ? '更换' : '绑定' }}</span>
          </div>
        </div>

        <div class="form-item">
          <span class="label">邮箱</span>
          <input type="email" class="input" v-model="form.email" placeholder="请输入邮箱" />
        </div>
      </div>

      <div class="section-title">主页装扮</div>
      <div class="form-section">
        <div class="form-item">
          <span class="label">主页背景</span>
          <div class="bg-preview" :style="{ backgroundImage: `url(${form.bgImage})` }" @click="selectBg">
            <div class="bg-overlay">
              <span class="bg-icon">📷</span>
              <span class="bg-text">更换背景</span>
            </div>
          </div>
          <input type="file" ref="bgInput" accept="image/*" style="display: none" @change="handleBgChange" />
        </div>

        <div class="form-item">
          <span class="label">个人标签</span>
          <div class="tags-selector">
            <div class="tag-item" v-for="tag in tagOptions" :key="tag.id" :class="{ selected: form.tags.includes(tag.id) }" @click="toggleTag(tag.id)">
              {{ tag.name }}
            </div>
          </div>
          <div class="tag-tip">选择3-8个标签展示你的特点</div>
        </div>
      </div>

      <div class="section-title" v-if="activeServices.length > 0">我的服务</div>
      <div class="form-section" v-if="activeServices.length > 0">
        <div class="services-list">
          <div class="service-item" v-for="service in activeServices" :key="service.id">
            <span class="service-icon">{{ service.icon }}</span>
            <div class="service-info">
              <div class="service-name">{{ service.name }}</div>
              <div class="service-meta">
                <span class="service-game" v-if="service.game">{{ service.game }}</span>
                <span class="service-price" v-if="service.price">¥{{ service.price }}/小时</span>
              </div>
              <div class="service-expire">有效期至 {{ service.expiredAt }}</div>
            </div>
            <span class="service-status active">已开通</span>
          </div>
        </div>
      </div>

      <div class="section-title">认证信息</div>
      <div class="form-section">
        <div class="form-item">
          <span class="label">实名认证</span>
          <div class="verify-status" :class="{ verified: form.isVerified }">
            <span class="verify-icon">{{ form.isVerified ? '✅' : '❌' }}</span>
            <span class="verify-text">{{ form.isVerified ? '已认证' : '未认证' }}</span>
            <span class="verify-btn" v-if="!form.isVerified" @click="goRealName">去认证</span>
          </div>
        </div>

        <div class="form-item">
          <span class="label">VIP会员</span>
          <div class="vip-status" :class="{ active: form.isVip }">
            <span class="vip-icon">{{ form.isVip ? '👑' : '☆' }}</span>
            <span class="vip-text">{{ form.isVip ? 'VIP会员' : '开通VIP' }}</span>
            <span class="vip-btn" v-if="!form.isVip" @click="goVip">立即开通</span>
          </div>
        </div>
      </div>

      <div class="preview-section">
        <button class="preview-btn" @click="showPreview = true">
          <span class="preview-icon">👁️</span>
          预览我的主页
        </button>
      </div>
    </div>

    <div class="region-picker" v-if="showRegionPicker">
      <div class="picker-mask" @click="showRegionPicker = false"></div>
      <div class="picker-content">
        <div class="picker-header">
          <span class="picker-cancel" @click="showRegionPicker = false">取消</span>
          <span class="picker-title">选择地区</span>
          <span class="picker-confirm" @click="confirmRegion">确定</span>
        </div>
        <div class="picker-body">
          <div class="picker-column">
            <div class="picker-item" :class="{ active: regionStep === 'province' && tempRegion.province === province.name }" v-for="province in regionData" :key="province.code" @click="selectProvince(province)">
              {{ province.name }}
            </div>
          </div>
          <div class="picker-column" v-if="regionStep === 'city' || regionStep === 'district'">
            <div class="picker-item" :class="{ active: tempRegion.city === city.name }" v-for="city in currentProvince?.cities" :key="city.code" @click="selectCity(city)">
              {{ city.name }}
            </div>
          </div>
          <div class="picker-column" v-if="regionStep === 'district'">
            <div class="picker-item" :class="{ active: tempRegion.district === district.name }" v-for="district in currentCity?.districts" :key="district.code" @click="selectDistrict(district)">
              {{ district.name }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="modal" v-if="showPhoneModal" @click.self="showPhoneModal = false">
      <div class="modal-content">
        <div class="modal-title">绑定手机号</div>
        <div class="modal-body">
          <input type="tel" class="modal-input" v-model="newPhone" placeholder="请输入手机号" maxlength="11" />
          <div class="code-row">
            <input type="text" class="modal-input code" v-model="verifyCode" placeholder="验证码" maxlength="6" />
            <button class="code-btn" :class="{ disabled: codeCount > 0 }" @click="sendCode">
              {{ codeCount > 0 ? `${codeCount}s` : '获取验证码' }}
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-btn cancel" @click="showPhoneModal = false">取消</button>
          <button class="modal-btn confirm" @click="bindPhone">确定绑定</button>
        </div>
      </div>
    </div>

    <div class="modal" v-if="showPreview" @click.self="showPreview = false">
      <div class="preview-modal">
        <div class="preview-header">
          <span class="preview-title">主页预览</span>
          <span class="preview-close" @click="showPreview = false">×</span>
        </div>
        <div class="preview-content">
          <div class="preview-bg" :style="{ backgroundImage: `url(${form.bgImage})` }"></div>
          <div class="preview-info">
            <img class="preview-avatar" :src="form.avatar" alt="" />
            <div class="preview-name">{{ form.nickname || '未设置昵称' }}</div>
            <div class="preview-signature">{{ form.signature || '这个人很神秘，什么都没留下...' }}</div>
            <div class="preview-stats">
              <div class="preview-stat">
                <div class="stat-num">128</div>
                <div class="stat-label">关注</div>
              </div>
              <div class="preview-stat">
                <div class="stat-num">256</div>
                <div class="stat-label">粉丝</div>
              </div>
              <div class="preview-stat">
                <div class="stat-num">1.2k</div>
                <div class="stat-label">获赞</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const avatarInput = ref(null)
const bgInput = ref(null)

const form = reactive({
  avatar: 'https://picsum.photos/200/200',
  nickname: '多客用户',
  gender: 'male',
  birthday: '2000-01-01',
  region: '北京市朝阳区',
  height: 170,
  profession: '自由职业',
  signature: '这个人很神秘，什么都没留下...',
  hobbies: ['游戏', '音乐'],
  games: ['王者荣耀', '和平精英'],
  price: 88,
  wechat: '',
  phone: '138****8888',
  email: '',
  bgImage: 'https://picsum.photos/800/400',
  tags: [1, 3, 5],
  isVerified: true,
  isVip: false,
  services: [
    { id: 1, name: '王者荣耀陪玩', icon: '🎮', status: 'active', expiredAt: '2026-12-31', game: '王者荣耀', price: 50 },
    { id: 2, name: '和平精英陪玩', icon: '🔫', status: 'active', expiredAt: '2026-12-31', game: '和平精英', price: 60 },
    { id: 3, name: '英雄联盟陪玩', icon: '⚔️', status: 'active', expiredAt: '2026-11-30', game: '英雄联盟', price: 55 },
    { id: 4, name: '绝地求生陪玩', icon: '💀', status: 'active', expiredAt: '2026-10-31', game: '绝地求生', price: 65 },
    { id: 5, name: '语音聊天服务', icon: '🎤', status: 'active', expiredAt: '2026-12-31', game: null, price: 30 },
    { id: 6, name: '游戏教学', icon: '📚', status: 'active', expiredAt: '2026-09-30', game: '通用', price: 80 },
    { id: 7, name: '连麦直播', icon: '📞', status: 'active', expiredAt: '2026-08-31', game: null, price: 40 },
    { id: 8, name: '情感陪聊', icon: '💬', status: 'active', expiredAt: '2026-12-31', game: null, price: 35 },
    { id: 9, name: 'LOL云顶之弈', icon: '♟️', status: 'active', expiredAt: '2026-07-31', game: '云顶之弈', price: 45 },
    { id: 10, name: 'DOTA2陪玩', icon: '🛡️', status: 'active', expiredAt: '2026-06-30', game: 'DOTA2', price: 70 },
    { id: 11, name: 'CSGO陪玩', icon: '🎯', status: 'active', expiredAt: '2026-12-31', game: 'CSGO', price: 55 },
    { id: 12, name: '守望先锋陪玩', icon: '🦸', status: 'active', expiredAt: '2026-05-31', game: '守望先锋', price: 60 },
    { id: 13, name: 'APEX陪玩', icon: '🚀', status: 'active', expiredAt: '2026-04-30', game: 'APEX', price: 65 },
    { id: 14, name: '永劫无间陪玩', icon: '⚔️', status: 'active', expiredAt: '2026-03-31', game: '永劫无间', price: 55 },
    { id: 15, name: '金铲铲之战', icon: '🃏', status: 'active', expiredAt: '2026-12-31', game: '金铲铲之战', price: 40 },
    { id: 16, name: '蛋仔派对陪玩', icon: '🥚', status: 'active', expiredAt: '2026-02-28', game: '蛋仔派对', price: 35 },
    { id: 17, name: '原神陪玩', icon: '✨', status: 'active', expiredAt: '2026-12-31', game: '原神', price: 50 },
    { id: 18, name: '游戏代练', icon: '📈', status: 'active', expiredAt: '2026-01-31', game: '通用', price: 100 },
    { id: 19, name: '陪聊服务', icon: '🗣️', status: 'active', expiredAt: '2026-12-31', game: null, price: 25 },
    { id: 20, name: '声优服务', icon: '🎵', status: 'active', expiredAt: '2026-12-31', game: null, price: 45 }
  ]
})

const hobbyOptions = ['游戏', '音乐', '电影', '美食', '旅行', '运动', '阅读', '摄影', '音乐', '绘画']
const gameOptions = [
  { name: '王者荣耀' },
  { name: '和平精英' },
  { name: '英雄联盟' },
  { name: '绝地求生' },
  { name: '守望先锋' },
  { name: 'DOTA2' },
  { name: '我的世界' },
  { name: '原神' }
]

const tagOptions = [
  { id: 1, name: '游戏达人' },
  { id: 2, name: '技术流' },
  { id: 3, name: '声音好听' },
  { id: 4, name: '脾气好' },
  { id: 5, name: '新手友好' },
  { id: 6, name: '专业指导' },
  { id: 7, name: '段位高' },
  { id: 8, name: '全能型' },
  { id: 9, name: '风趣幽默' },
  { id: 10, name: '认真负责' },
  { id: 11, name: '高颜值' },
  { id: 12, name: '萝莉音' }
]

const showRegionPicker = ref(false)
const showPhoneModal = ref(false)
const showPreview = ref(false)
const regionStep = ref('province')
const tempRegion = reactive({
  province: '',
  city: '',
  district: ''
})
const newPhone = ref('')
const verifyCode = ref('')
const codeCount = ref(0)

const regionData = [
  {
    code: '110000', name: '北京市',
    cities: [{ code: '110100', name: '北京市', districts: [{ code: '110101', name: '东城区' }, { code: '110102', name: '西城区' }, { code: '110105', name: '朝阳区' }, { code: '110106', name: '丰台区' }, { code: '110108', name: '海淀区' }] }]
  },
  {
    code: '310000', name: '上海市',
    cities: [{ code: '310100', name: '上海市', districts: [{ code: '310101', name: '黄浦区' }, { code: '310104', name: '徐汇区' }, { code: '310105', name: '长宁区' }, { code: '310110', name: '杨浦区' }, { code: '310115', name: '浦东新区' }] }]
  },
  {
    code: '440000', name: '广东省',
    cities: [
      { code: '440100', name: '广州市', districts: [{ code: '440103', name: '荔湾区' }, { code: '440104', name: '越秀区' }, { code: '440105', name: '海珠区' }, { code: '440106', name: '天河区' }, { code: '440111', name: '白云区' }] },
      { code: '440300', name: '深圳市', districts: [{ code: '440303', name: '罗湖区' }, { code: '440304', name: '福田区' }, { code: '440305', name: '南山区' }, { code: '440306', name: '宝安区' }, { code: '440307', name: '龙岗区' }] }
    ]
  },
  {
    code: '330000', name: '浙江省',
    cities: [{ code: '330100', name: '杭州市', districts: [{ code: '330102', name: '上城区' }, { code: '330105', name: '拱墅区' }, { code: '330108', name: '滨江区' }, { code: '330109', name: '萧山区' }] }]
  }
]

const currentProvince = ref(null)
const currentCity = ref(null)

const activeServices = computed(() => {
  return form.services?.filter(s => s.status === 'active') || []
})

const completeness = computed(() => {
  let score = 0
  if (form.nickname) score += 10
  if (form.signature) score += 15
  if (form.region) score += 10
  if (form.birthday) score += 10
  if (form.hobbies.length > 0) score += 15
  if (form.games.length > 0) score += 15
  if (form.price) score += 10
  if (form.wechat) score += 15
  return score
})

const goBack = () => { router.back() }

const selectAvatar = () => { avatarInput.value?.click() }

const handleAvatarChange = (e) => {
  const file = e.target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (event) => { form.avatar = event.target?.result || '' }
    reader.readAsDataURL(file)
  }
}

const selectBg = () => { bgInput.value?.click() }

const handleBgChange = (e) => {
  const file = e.target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (event) => { form.bgImage = event.target?.result || '' }
    reader.readAsDataURL(file)
  }
}

const toggleTag = (tagId) => {
  const index = form.tags.indexOf(tagId)
  if (index > -1) form.tags.splice(index, 1)
  else form.tags.push(tagId)
}

const toggleHobby = (hobby) => {
  const index = form.hobbies.indexOf(hobby)
  if (index > -1) form.hobbies.splice(index, 1)
  else form.hobbies.push(hobby)
}

const toggleGame = (game) => {
  const index = form.games.indexOf(game)
  if (index > -1) form.games.splice(index, 1)
  else form.games.push(game)
}

const selectProvince = (province) => {
  tempRegion.province = province.name
  tempRegion.city = ''
  tempRegion.district = ''
  currentProvince.value = province
  regionStep.value = 'city'
}

const selectCity = (city) => {
  tempRegion.city = city.name
  tempRegion.district = ''
  currentCity.value = city
  regionStep.value = 'district'
}

const selectDistrict = (district) => { tempRegion.district = district.name }

const confirmRegion = () => {
  form.region = tempRegion.province + (tempRegion.city || '') + (tempRegion.district || '')
  showRegionPicker.value = false
}

const sendCode = () => {
  if (codeCount.value > 0) return
  codeCount.value = 60
  setInterval(() => { if (codeCount.value > 0) codeCount.value-- }, 1000)
}

const bindPhone = () => {
  if (!newPhone.value || newPhone.value.length !== 11) {
    alert('请输入正确的手机号')
    return
  }
  if (!verifyCode.value) {
    alert('请输入验证码')
    return
  }
  form.phone = newPhone.value.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  showPhoneModal.value = false
  alert('手机号绑定成功！')
}

const goRealName = () => { router.push('/real-name') }
const goVip = () => { router.push('/vip-center') }

const saveProfile = () => {
  if (!form.nickname.trim()) {
    alert('请输入昵称')
    return
  }
  if (form.tags.length < 3) {
    alert('请至少选择3个标签')
    return
  }
  console.log('保存资料:', { ...form })
  alert('保存成功！')
  router.back()
}
</script>

<style scoped>
.edit-profile-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.back-btn, .save-btn { font-size: 16px; color: white; cursor: pointer; }
.title { font-size: 18px; font-weight: bold; color: white; }

.content { padding: 16px; }

.profile-completeness {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.completeness-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.completeness-title { font-size: 14px; color: #333; }
.completeness-percent { font-size: 16px; font-weight: bold; color: #667eea; }

.completeness-bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.completeness-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 4px;
  transition: width 0.3s;
}

.completeness-tip { font-size: 12px; color: #999; }

.avatar-section {
  position: relative;
  width: 100px;
  height: 100px;
  margin: 0 auto 20px;
}

.avatar-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.avatar-vip {
  position: absolute;
  bottom: 0;
  right: 0;
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: bold;
}

.avatar-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s;
}

.avatar-section:hover .avatar-mask { opacity: 1; }
.upload-icon { font-size: 24px; margin-bottom: 2px; }
.upload-text { font-size: 11px; color: white; }

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: #666;
  margin: 20px 0 10px;
  padding-left: 4px;
}

.form-section {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.form-item {
  padding: 14px 16px;
  border-bottom: 1px solid #f5f5f5;
  position: relative;
}

.form-item:last-child { border-bottom: none; }

.label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  display: block;
}

.input, .textarea {
  width: 100%;
  padding: 10px 12px;
  font-size: 15px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.3s;
  background: #fafafa;
}

.input:focus, .textarea:focus { border-color: #667eea; background: white; }
.textarea { resize: none; height: 80px; }

.char-count {
  position: absolute;
  right: 20px;
  bottom: 18px;
  font-size: 12px;
  color: #ccc;
}

.gender-options { display: flex; gap: 10px; }

.gender-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  border: 2px solid #e5e5e5;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.gender-option.active {
  border-color: #667eea;
  background: rgba(102,126,234,0.05);
}

.gender-icon { font-size: 24px; }
.gender-text { font-size: 13px; color: #666; }

.region-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #fafafa;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  color: #666;
  cursor: pointer;
}

.arrow { color: #ccc; font-size: 18px; }

.input-with-unit { display: flex; align-items: center; gap: 8px; }
.input-with-unit .input { flex: 1; }
.unit { font-size: 14px; color: #666; }

.hobby-tags, .game-tags { display: flex; flex-wrap: wrap; gap: 8px; }

.hobby-tag, .game-tag {
  padding: 6px 14px;
  background: #f5f5f5;
  color: #666;
  font-size: 13px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.hobby-tag.active, .game-tag.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.game-tag.add {
  border: 1px dashed #ddd;
  background: transparent;
}

.price-input { display: flex; align-items: center; gap: 8px; }
.price-unit { font-size: 18px; color: #ff6b6b; font-weight: bold; }
.price-input .input { width: 80px; }
.price-suffix { font-size: 14px; color: #666; }

.verify-status, .vip-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #f5f5f5;
  border-radius: 8px;
}

.verify-icon, .vip-icon { font-size: 18px; }
.verify-text, .vip-text { flex: 1; font-size: 14px; color: #666; }
.verify-btn, .vip-btn {
  font-size: 13px;
  color: #667eea;
  cursor: pointer;
}

.vip-status.active { background: rgba(255,215,0,0.1); }
.vip-status.active .vip-text { color: #ff8c00; font-weight: 500; }

.phone-display { display: flex; align-items: center; justify-content: space-between; }
.phone-value { font-size: 14px; color: #666; }
.phone-btn { font-size: 14px; color: #667eea; cursor: pointer; }

.bg-preview {
  width: 100%;
  height: 120px;
  border-radius: 10px;
  background-size: cover;
  background-position: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.bg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.bg-preview:hover .bg-overlay { opacity: 1; }
.bg-icon { font-size: 24px; margin-bottom: 4px; }
.bg-text { font-size: 13px; color: white; }

.tags-selector { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }

.tag-item {
  padding: 6px 14px;
  background: #f5f5f5;
  color: #666;
  font-size: 13px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.tag-item.selected {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.tag-tip { font-size: 12px; color: #999; }

.services-list { display: flex; flex-direction: column; gap: 10px; }

.service-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #fafafa;
  border-radius: 10px;
  gap: 12px;
}

.service-icon { font-size: 24px; }

.service-info { flex: 1; min-width: 0; }

.service-name { font-size: 15px; color: #333; font-weight: 500; }

.service-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.service-game {
  font-size: 11px;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.service-price {
  font-size: 12px;
  color: #ff6b6b;
  font-weight: 500;
}

.service-expire { font-size: 12px; color: #999; margin-top: 3px; }

.service-status {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
}

.service-status.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.service-status.expired {
  background: #f0f0f0;
  color: #999;
}

.preview-section { padding: 20px 0; }
.preview-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-size: 15px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.region-picker, .modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
}

.picker-mask, .modal {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
}

.picker-content, .modal-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-radius: 20px 20px 0 0;
}

.picker-header, .modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.picker-cancel, .modal-btn.cancel { color: #999; cursor: pointer; }
.picker-confirm, .modal-btn.confirm { color: #667eea; font-weight: 500; cursor: pointer; }
.picker-title, .modal-title { font-size: 16px; font-weight: bold; color: #333; }
.modal-close { font-size: 24px; color: #999; cursor: pointer; }

.picker-body, .modal-body { display: flex; max-height: 300px; }
.picker-column {
  flex: 1;
  overflow-y: auto;
  border-right: 1px solid #f0f0f0;
}

.picker-item {
  padding: 14px 16px;
  font-size: 15px;
  color: #666;
  cursor: pointer;
}

.picker-item:hover { background: #f9f9f9; }
.picker-item.active { color: #667eea; font-weight: 500; background: rgba(102,126,234,0.05); }

.modal-content { max-width: 360px; margin: auto; border-radius: 16px; position: relative; top: 50%; transform: translateY(-50%); }
.modal-body { padding: 20px; display: block; }
.modal-input { width: 100%; padding: 12px; font-size: 15px; border: 1px solid #e5e5e5; border-radius: 8px; box-sizing: border-box; margin-bottom: 12px; }
.code-row { display: flex; gap: 10px; }
.code { flex: 1; margin-bottom: 0; }
.code-btn { padding: 0 16px; background: #667eea; color: white; font-size: 14px; border: none; border-radius: 8px; white-space: nowrap; }

.modal-footer { display: flex; border-top: 1px solid #f0f0f0; }
.modal-btn { flex: 1; padding: 16px; text-align: center; font-size: 16px; border: none; background: none; cursor: pointer; }
.modal-btn.cancel { border-right: 1px solid #f0f0f0; color: #666; }
.modal-btn.confirm { color: #667eea; font-weight: 500; }

.preview-modal {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 360px;
  background: white;
  border-radius: 16px;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.preview-title { font-size: 16px; font-weight: bold; }
.preview-close { font-size: 24px; color: #999; cursor: pointer; }

.preview-content { padding: 0; }

.preview-bg {
  height: 150px;
  background-size: cover;
  background-position: center;
}

.preview-info {
  background: white;
  padding: 20px;
  text-align: center;
  margin-top: -40px;
  position: relative;
}

.preview-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 4px solid white;
  object-fit: cover;
  margin-bottom: 12px;
}

.preview-name { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 8px; }
.preview-signature { font-size: 14px; color: #999; margin-bottom: 16px; }

.preview-stats { display: flex; justify-content: center; gap: 40px; }
.preview-stat { text-align: center; }
.stat-num { font-size: 18px; font-weight: bold; color: #333; }
.stat-label { font-size: 12px; color: #999; }
</style>
