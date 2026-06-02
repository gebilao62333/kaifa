<template>
  <div class="edit-profile-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">编辑资料</span>
      <button class="save-btn" @click="saveProfile">保存</button>
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
          <input type="text" id="nickname" name="nickname" class="input" v-model="form.nickname" placeholder="请输入昵称" maxlength="20" autocomplete="off" />
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
          <input type="date" id="birthday" name="birthday" class="input" v-model="form.birthday" autocomplete="off" />
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
            <input type="number" id="height" name="height" class="input small" v-model="form.height" placeholder="170" autocomplete="off" />
            <span class="unit">cm</span>
          </div>
        </div>

        <div class="form-item">
          <span class="label">职业</span>
          <input type="text" id="profession" name="profession" class="input" v-model="form.profession" placeholder="请输入职业" autocomplete="off" />
        </div>
      </div>

      <div class="section-title">个人介绍</div>
      <div class="form-section">
        <div class="form-item">
          <span class="label">个性签名</span>
          <textarea id="signature" name="signature" class="textarea" v-model="form.signature" placeholder="说点什么介绍自己..." maxlength="200" autocomplete="off"></textarea>
          <span class="char-count">{{ form.signature.length }}/200</span>
        </div>

        <div class="form-item">
          <span class="label">兴趣爱好</span>
          <div class="hobby-tags">
            <span class="hobby-tag" v-for="hobby in hobbyOptions" :key="hobby" :class="{ active: form.hobbies.includes(hobby) }" @click="toggleHobby(hobby)">
              {{ hobby }}
            </span>
            <span class="hobby-tag add" @click="showHobbyInput = true">+ 添加</span>
          </div>
        </div>

        <div class="form-item">
          <span class="label">个人标签</span>
          <div class="tags-selector">
            <div class="tag-item" v-for="tag in tagOptions" :key="tag.id" :class="{ selected: form.tags.includes(tag.id) }" @click="toggleTag(tag.id)">
              {{ tag.name }}
            </div>
            <span class="tag-item add" @click="showTagInput = true">+ 添加</span>
          </div>
          <div class="tag-tip">选择3-8个标签展示你的特点</div>
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
            <span class="price-unit">金币</span>
            <input type="number" id="price" name="price" class="input price" v-model="form.price" placeholder="88" autocomplete="off" />
            <span class="price-suffix">/小时</span>
          </div>
        </div>
      </div>

      <div class="section-title">社交信息</div>
      <div class="form-section">
        <div class="form-item">
          <span class="label">微信号</span>
          <input type="text" id="wechat" name="wechat" class="input" v-model="form.wechat" placeholder="请输入微信号" autocomplete="off" />
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
          <input type="email" id="email" name="email" class="input" v-model="form.email" placeholder="请输入邮箱" autocomplete="off" />
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
                <span class="service-price" v-if="service.price">{{ service.price }} 金币/小时</span>
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

    <!-- 添加兴趣爱好的弹窗 -->
    <div class="modal" v-if="showHobbyInput" @click.self="showHobbyInput = false">
      <div class="modal-content">
        <div class="modal-title">添加兴趣爱好</div>
        <div class="modal-body">
          <input type="text" class="modal-input" v-model="newHobby" placeholder="请输入兴趣爱好" maxlength="20" @keyup.enter="confirmAddHobby" />
        </div>
        <div class="modal-footer">
          <button class="modal-btn cancel" @click="showHobbyInput = false">取消</button>
          <button class="modal-btn confirm" @click="confirmAddHobby">确定添加</button>
        </div>
      </div>
    </div>

    <!-- 添加个人标签的弹窗 -->
    <div class="modal" v-if="showTagInput" @click.self="showTagInput = false">
      <div class="modal-content">
        <div class="modal-title">添加个人标签</div>
        <div class="modal-body">
          <input type="text" class="modal-input" v-model="newTag" placeholder="请输入标签名称" maxlength="10" @keyup.enter="confirmAddTag" />
        </div>
        <div class="modal-footer">
          <button class="modal-btn cancel" @click="showTagInput = false">取消</button>
          <button class="modal-btn confirm" @click="confirmAddTag">确定添加</button>
        </div>
      </div>
    </div>

    <!-- 添加擅长游戏的弹窗 -->
    <div class="modal" v-if="showGamePicker" @click.self="showGamePicker = false">
      <div class="modal-content">
        <div class="modal-title">选择擅长游戏</div>
        <div class="modal-body">
          <input type="text" class="modal-input" v-model="newGame" placeholder="搜索或输入游戏名称" maxlength="20" @keyup.enter="confirmAddGame" />
          <div class="game-list">
            <div class="game-list-item" v-for="game in gameOptions" :key="game.name"
                 :class="{ selected: form.games.includes(game.name) }"
                 @click="toggleGame(game.name)">
              <span class="game-list-name">{{ game.name }}</span>
              <span class="game-list-check" v-if="form.games.includes(game.name)">✓</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-btn cancel" @click="showGamePicker = false">完成</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user-info'
import { toast } from '../composables/useToast'
import authService from '../services/authService'
import { regionData } from '../common/regionData'

const router = useRouter()
const userStore = useUserStore()

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

const hobbyOptions = ref(['游戏', '音乐', '电影', '美食', '旅行', '运动', '阅读', '摄影', '绘画'])
const gameOptions = ref([
  { name: '王者荣耀' },
  { name: '和平精英' },
  { name: '英雄联盟' },
  { name: '绝地求生' },
  { name: '守望先锋' },
  { name: 'DOTA2' },
  { name: '我的世界' },
  { name: '原神' },
  { name: '金铲铲之战' },
  { name: '蛋仔派对' },
  { name: '永劫无间' },
  { name: 'APEX英雄' },
  { name: 'CSGO' },
  { name: '穿越火线' },
  { name: 'QQ飞车' },
  { name: '梦幻西游' }
])

const tagOptions = ref([
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
])

const showRegionPicker = ref(false)
const showPhoneModal = ref(false)
const showPreview = ref(false)
const showGamePicker = ref(false)
const showHobbyInput = ref(false)
const showTagInput = ref(false)
const newHobby = ref('')
const newTag = ref('')
const newGame = ref('')
const nextTagId = ref(13)
const regionStep = ref('province')
const tempRegion = reactive({
  province: '',
  city: '',
  district: ''
})
const newPhone = ref('')
const verifyCode = ref('')
const codeCount = ref(0)



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

const confirmAddHobby = () => {
  const hobby = newHobby.value.trim()
  if (!hobby) {
    alert('请输入兴趣爱好')
    return
  }
  if (hobbyOptions.value.includes(hobby)) {
    alert('该兴趣爱好已存在')
    return
  }
  hobbyOptions.value.push(hobby)
  if (!form.hobbies.includes(hobby)) {
    form.hobbies.push(hobby)
  }
  newHobby.value = ''
  showHobbyInput.value = false
}

const confirmAddTag = () => {
  const tagName = newTag.value.trim()
  if (!tagName) {
    alert('请输入标签名称')
    return
  }
  const exists = tagOptions.value.some(t => t.name === tagName)
  if (exists) {
    alert('该标签已存在')
    return
  }
  const newTagId = nextTagId.value++
  tagOptions.value.push({ id: newTagId, name: tagName })
  if (!form.tags.includes(newTagId)) {
    form.tags.push(newTagId)
  }
  newTag.value = ''
  showTagInput.value = false
}

const confirmAddGame = () => {
  const gameName = newGame.value.trim()
  if (!gameName) {
    alert('请输入游戏名称')
    return
  }
  const exists = gameOptions.value.some(g => g.name === gameName)
  if (!exists) {
    gameOptions.value.push({ name: gameName })
  }
  if (!form.games.includes(gameName)) {
    form.games.push(gameName)
  }
  newGame.value = ''
  showGamePicker.value = false
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

const saveProfile = async () => {
  console.log('saveProfile clicked')
  
  if (!userStore.isLogin) {
    toast.warning('请先登录')
    return
  }
  
  if (!form.nickname.trim()) {
    alert('请输入昵称')
    return
  }
  
  try {
    const result = await authService.updateProfile({
      nickname: form.nickname,
      avatar: form.avatar,
      gender: form.gender,
      birthday: form.birthday,
      region: form.region,
      height: form.height,
      profession: form.profession,
      signature: form.signature,
      hobbies: form.hobbies.join(','),
      games: form.games.join(','),
      tags: form.tags.join(','),
      price: form.price,
      wechat: form.wechat,
      email: form.email,
      bgImage: form.bgImage
    })
    console.log('API返回:', result)
    alert(result.message || '保存成功！')
    router.back()
  } catch (error) {
    console.error('保存失败:', error)
    alert(error.message || '保存失败，请稍后重试')
  }
}
</script>

<style scoped>
.edit-profile-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background-color: var(--bg-secondary);
  padding-top: 70px;
  padding-bottom: 80px;
  padding-bottom: calc(80px + constant(safe-area-inset-bottom, 0px));
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: var(--gradient-primary);
  height: 70px;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  box-sizing: border-box;
}

.back-btn, .save-btn { font-size: 16px; color: #fff; cursor: pointer; background: none; border: none; padding: 0; -webkit-tap-highlight-color: transparent; }
.back-btn { font-size: 24px; width: 40px; text-align: center; }
.title { font-size: 18px; font-weight: bold; color: #fff; }
.save-btn { color: #fff; font-weight: 500; }

.content { padding: 16px; max-width: 650px; margin: 0 auto; }

.profile-completeness {
  background: var(--bg-primary);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-light);
}

.completeness-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.completeness-title { font-size: 14px; color: var(--text-primary); }
.completeness-percent { font-size: 16px; font-weight: bold; color: var(--primary-color); }

.completeness-bar {
  height: 8px;
  background: var(--border-light);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.completeness-fill {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: 4px;
  transition: width 0.3s;
  -webkit-transition: width 0.3s;
}

.completeness-tip { font-size: 12px; color: var(--text-muted); }

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
  -webkit-user-select: none;
  user-select: none;
}

.avatar-vip {
  position: absolute;
  bottom: 0;
  right: 0;
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  background: -webkit-linear-gradient(315deg, #ffd700, #ff8c00);
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
  border-radius: 10px;
  background-color: rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s;
  -webkit-transition: opacity 0.3s;
  -webkit-tap-highlight-color: transparent;
}

.avatar-section:hover .avatar-mask { opacity: 1; }
.upload-icon { font-size: 24px; margin-bottom: 2px; }
.upload-text { font-size: 11px; color: white; }

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 20px 0 10px;
  padding-left: 4px;
}

.form-section {
  background: var(--bg-primary);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: var(--shadow-light);
}

.form-item {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-light);
  position: relative;
}

.form-item:last-child { border-bottom: none; }

.label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  display: block;
}

.input, .textarea {
  width: 100%;
  padding: 10px 12px;
  font-size: 15px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.3s;
  -webkit-transition: border-color 0.3s;
  background: var(--bg-secondary);
  -webkit-appearance: none;
  appearance: none;
  color: var(--text-primary);
}

.input:focus, .textarea:focus { border-color: var(--primary-color); background: var(--bg-primary); }
.textarea { resize: none; height: 80px; }

.char-count {
  position: absolute;
  right: 20px;
  bottom: 18px;
  font-size: 12px;
  color: var(--text-muted);
}

.gender-options { display: flex; gap: 10px; }

.gender-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  border: 2px solid var(--border-color);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
  -webkit-transition: all 0.3s;
  -webkit-tap-highlight-color: transparent;
}

.gender-option.active {
  border-color: var(--primary-color);
  background: rgba(255, 107, 129, 0.05);
}

.gender-icon { font-size: 24px; }
.gender-text { font-size: 13px; color: var(--text-secondary); }

.region-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.arrow { color: var(--text-muted); font-size: 18px; }

.input-with-unit { display: flex; align-items: center; gap: 8px; }
.input-with-unit .input { flex: 1; }
.unit { font-size: 14px; color: var(--text-secondary); }

.hobby-tags, .game-tags { display: flex; flex-wrap: wrap; gap: 8px; }

.hobby-tag, .game-tag {
  padding: 6px 14px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 13px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  -webkit-transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
  box-sizing: border-box;
}

.hobby-tag.active, .game-tag.active {
  background: var(--gradient-primary);
  color: white;
}

.game-tag.add {
  border: 1px dashed var(--border-color);
  background: transparent;
}

.hobby-tag.add {
  border: 1px dashed var(--border-color);
  background: transparent;
}

.price-input { display: flex; align-items: center; gap: 8px; }
.price-unit { font-size: 18px; color: var(--primary-color); font-weight: bold; }
.price-input .input { width: 80px; }
.price-suffix { font-size: 14px; color: var(--text-secondary); }

.verify-status, .vip-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.verify-icon, .vip-icon { font-size: 18px; }
.verify-text, .vip-text { flex: 1; font-size: 14px; color: var(--text-secondary); }
.verify-btn, .vip-btn {
  font-size: 13px;
  color: var(--primary-color);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.vip-status.active { background: rgba(255, 215, 0, 0.1); }
.vip-status.active .vip-text { color: #ff8c00; font-weight: 500; }

.phone-display { display: flex; align-items: center; justify-content: space-between; }
.phone-value { font-size: 14px; color: var(--text-secondary); }
.phone-btn { font-size: 14px; color: var(--primary-color); cursor: pointer; -webkit-tap-highlight-color: transparent; }

.bg-preview {
  width: 100%;
  height: 120px;
  border-radius: 10px;
  background-size: cover;
  background-position: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
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
  -webkit-transition: opacity 0.3s;
}

.bg-preview:hover .bg-overlay { opacity: 1; }
.bg-icon { font-size: 24px; margin-bottom: 4px; }
.bg-text { font-size: 13px; color: white; }

.tags-selector { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }

.tag-item {
  padding: 6px 14px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 13px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  -webkit-transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
  box-sizing: border-box;
}

.tag-item.selected {
  background: var(--gradient-primary);
  color: white;
}

.tag-item.add {
  border: 1px dashed var(--border-color);
  background: transparent;
}

.tag-tip { font-size: 12px; color: var(--text-muted); }

.game-list { display: flex; flex-direction: column; gap: 4px; max-height: 300px; overflow-y: auto; margin-top: 12px; -webkit-overflow-scrolling: touch; }
.game-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  -webkit-transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
}
.game-list-item:hover { background: var(--bg-secondary); }
.game-list-item.selected { background: rgba(255, 107, 129, 0.1); color: var(--primary-color); font-weight: 500; }
.game-list-check { color: var(--primary-color); font-weight: bold; font-size: 16px; }

.services-list { display: flex; flex-direction: column; gap: 10px; }

.service-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 10px;
  gap: 12px;
}

.service-icon { font-size: 24px; }

.service-info { flex: 1; min-width: 0; }

.service-name { font-size: 15px; color: var(--text-primary); font-weight: 500; }

.service-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.service-game {
  font-size: 11px;
  color: var(--primary-color);
  background: rgba(255, 107, 129, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.service-price {
  font-size: 12px;
  color: var(--primary-color);
  font-weight: 500;
}

.service-expire { font-size: 12px; color: var(--text-muted); margin-top: 3px; }

.service-status {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 10px;
}

.service-status.active {
  background: var(--gradient-primary);
  color: white;
}

.service-status.expired {
  background: var(--border-light);
  color: var(--text-muted);
}

.preview-section { padding: 20px 0; }
.preview-btn {
  width: 100%;
  padding: 14px;
  background: var(--gradient-primary);
  color: white;
  font-size: 15px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  -webkit-tap-highlight-color: transparent;
  box-shadow: var(--shadow-medium);
}

.region-picker, .modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
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
  background: var(--bg-primary);
  border-radius: 10px 10px 0 0;
}

.picker-header, .modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.picker-cancel, .modal-btn.cancel { color: var(--text-muted); cursor: pointer; }
.picker-confirm, .modal-btn.confirm { color: var(--primary-color); font-weight: 500; cursor: pointer; }
.picker-title, .modal-title { font-size: 16px; font-weight: bold; color: var(--text-primary); }
.modal-close { font-size: 24px; color: var(--text-muted); cursor: pointer; -webkit-tap-highlight-color: transparent; }

.picker-body, .modal-body { display: flex; max-height: 300px; }
.picker-column {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  border-right: 1px solid var(--border-light);
}

.picker-item {
  padding: 14px 16px;
  font-size: 15px;
  color: var(--text-secondary);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.picker-item:hover { background: var(--bg-secondary); }
.picker-item.active { color: var(--primary-color); font-weight: 500; background: rgba(255, 107, 129, 0.05); }

.modal-content { max-width: 360px; margin: auto; border-radius: 10px; position: relative; top: 50%; -webkit-transform: translateY(-50%); transform: translateY(-50%); }
.modal-body { padding: 20px; display: block; }
.modal-input { width: 100%; padding: 12px; font-size: 15px; border: 1px solid var(--border-color); border-radius: 8px; box-sizing: border-box; margin-bottom: 12px; -webkit-appearance: none; appearance: none; background: var(--bg-secondary); color: var(--text-primary); }
.code-row { display: flex; gap: 10px; }
.code { flex: 1; margin-bottom: 0; }
.code-btn { padding: 0 16px; background: var(--primary-color); color: white; font-size: 14px; border: none; border-radius: 8px; white-space: nowrap; -webkit-tap-highlight-color: transparent; }

.modal-footer { display: flex; border-top: 1px solid var(--border-light); }
.modal-btn { flex: 1; padding: 16px; text-align: center; font-size: 16px; border: none; background: none; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.modal-btn.cancel { border-right: 1px solid var(--border-light); color: var(--text-secondary); }
.modal-btn.confirm { color: var(--primary-color); font-weight: 500; }

.preview-modal {
  position: absolute;
  top: 50%;
  left: 50%;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 360px;
  background: var(--bg-primary);
  border-radius: 10px;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-light);
}

.preview-title { font-size: 16px; font-weight: bold; color: var(--text-primary); }
.preview-close { font-size: 24px; color: var(--text-muted); cursor: pointer; -webkit-tap-highlight-color: transparent; }

.preview-content { padding: 0; }

.preview-bg {
  height: 150px;
  background-size: cover;
  background-position: center;
}

.preview-info {
  background: var(--bg-primary);
  padding: 20px;
  text-align: center;
  margin-top: -40px;
  position: relative;
}

.preview-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 4px solid var(--bg-primary);
  object-fit: cover;
  margin-bottom: 12px;
}

.preview-name { font-size: 18px; font-weight: bold; color: var(--text-primary); margin-bottom: 8px; }
.preview-signature { font-size: 14px; color: var(--text-muted); margin-bottom: 16px; }

.preview-stats { display: flex; justify-content: center; gap: 40px; }
.preview-stat { text-align: center; }
.stat-num { font-size: 18px; font-weight: bold; color: var(--text-primary); }
.stat-label { font-size: 12px; color: var(--text-muted); }

@media (min-width: 768px) {
  .edit-profile-page {
    max-width: 650px;
    margin: 0 auto;
  }
  .header {
    max-width: 650px;
    left: 50%;
    transform: translateX(-50%);
  }
}
@media (min-width: 1024px) {
  .edit-profile-page {
    max-width: 720px;
  }
  .header {
    max-width: 720px;
  }
}
</style>
