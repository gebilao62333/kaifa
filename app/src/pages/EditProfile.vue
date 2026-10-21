<template>
  <PageLayout>
    <template #nav>
      <text class="back-btn" @click="goBack">←</text>
      <text class="nav-title">编辑资料</text>
      <text class="save-btn" @click="saveProfile">保存</text>
    </template>

    <view class="content">
      <view class="profile-completeness">
        <view class="completeness-header">
          <text class="completeness-title">资料完善度</text>
          <text class="completeness-percent">{{ completeness }}%</text>
        </view>
        <view class="completeness-bar">
          <view class="completeness-fill" :style="{ width: completeness + '%' }"></view>
        </view>
        <view class="completeness-tip">完善资料让更多人认识你</view>
      </view>

      <view class="section-title">基本信息</view>
      <view class="form-section">
        <view class="basic-header">
          <view class="form-item nickname-item">
            <text class="label">昵称</text>
            <input type="text" class="input" v-model="form.nickname" placeholder="请输入昵称" maxlength="20" />
            <text class="char-count">{{ form.nickname.length }}/20</text>
          </view>
          <view class="avatar-section">
            <view class="avatar-mask" @click="selectAvatar">
              <text class="upload-icon">📷</text>
              <text class="upload-text">更换头像</text>
            </view>
            <view class="avatar-vip" v-if="form.isVip">VIP</view>
            <input type="file" ref="avatarInput" accept="image/*" style="display: none" @change="handleAvatarChange" />
          </view>
        </view>

        <view class="form-item">
          <text class="label">性别</text>
          <view class="gender-options">
            <view class="gender-option" :class="{ active: form.gender === 'male' }" @click="form.gender = 'male'">
              <text class="gender-icon">👨</text>
              <text class="gender-text">男</text>
            </view>
            <view class="gender-option" :class="{ active: form.gender === 'female' }" @click="form.gender = 'female'">
              <text class="gender-icon">👩</text>
              <text class="gender-text">女</text>
            </view>
            <view class="gender-option" :class="{ active: form.gender === 'secret' }" @click="form.gender = 'secret'">
              <text class="gender-icon">🙈</text>
              <text class="gender-text">保密</text>
            </view>
          </view>
        </view>

        <view class="form-item">
          <text class="label">生日</text>
          <!-- H5 用原生 date input；App 没有该 input 类型，改 uni picker 回填同一字段 -->
          <input v-if="!isApp" type="date" class="input" v-model="form.birthday" />
          <picker v-else class="picker-block" mode="date" :value="form.birthday" @change="onBirthdayChange">
            <view class="input app-picker-value" :class="{ placeholder: !form.birthday }">{{ form.birthday || '请选择生日' }}</view>
          </picker>
        </view>

        <view class="form-item">
          <text class="label">所在地区</text>
          <view class="region-display" @click="showRegionPicker = true">
            {{ form.region || '请选择地区' }}
            <text class="arrow">›</text>
          </view>
        </view>

        <view class="form-item">
          <text class="label">身高</text>
          <view class="input-with-unit">
            <input type="number" class="input small" v-model="form.height" placeholder="170" />
            <text class="unit">cm</text>
          </view>
        </view>

        <view class="form-item">
          <text class="label">职业</text>
          <input type="text" class="input" v-model="form.profession" placeholder="请输入职业" />
        </view>
      </view>

      <view class="section-title">个人介绍</view>
      <view class="form-section">
        <view class="form-item">
          <text class="label">个性签名</text>
          <textarea class="textarea" v-model="form.signature" placeholder="说点什么介绍自己..." maxlength="200"></textarea>
          <text class="char-count">{{ form.signature.length }}/200</text>
        </view>

        <view class="form-item">
          <text class="label">兴趣爱好</text>
          <view class="hobby-tags">
            <text class="hobby-tag" v-for="hobby in hobbyOptions" :key="hobby" :class="{ active: form.hobbies.includes(hobby) }" @click="toggleHobby(hobby)">
              {{ hobby }}
            </text>
          </view>
        </view>

        <view class="form-item">
          <text class="label">擅长游戏</text>
          <view class="game-tags">
            <text class="game-tag" v-for="game in gameOptions" :key="game.name" :class="{ active: form.games.includes(game.name) }" @click="toggleGame(game.name)">
              {{ game.name }}
            </text>
            <text class="game-tag add" @click="showGamePicker = true">+ 添加</text>
          </view>
        </view>

        <view class="form-item">
          <text class="label">陪玩价格</text>
          <view class="price-input">
            <text class="price-unit">¥</text>
            <!-- H5 保留浏览器 number input；App 用 digit（带小数点的数字键盘） -->
            <input v-if="!isApp" type="number" class="input price" v-model="form.price" placeholder="88" />
            <input v-else type="digit" class="input price" v-model="form.price" placeholder="88" />
            <text class="price-suffix">/小时</text>
          </view>
        </view>
      </view>

      <view class="section-title">社交信息</view>
      <view class="form-section">
        <view class="form-item">
          <text class="label">微信号</text>
          <input type="text" class="input" v-model="form.wechat" placeholder="请输入微信号" />
        </view>

        <view class="form-item">
          <text class="label">手机号</text>
          <view class="phone-display">
            <text class="phone-value">{{ form.phone || '未绑定' }}</text>
            <!-- 换绑统一在设置页完成（真实双验证码 + 全端会话吊销），这里不再保留本地假绑定弹窗 -->
            <text class="phone-btn" @click="goSettingsPhone">{{ form.phone ? '更换' : '绑定' }}</text>
          </view>
        </view>

        <view class="form-item">
          <text class="label">邮箱</text>
          <!-- H5 用原生 email 类型；App 的 uni input 没有 email 类型，只能退化为文本输入 + 失焦/提交前正则校验 -->
          <input v-if="!isApp" type="email" class="input" v-model="form.email" placeholder="请输入邮箱" />
          <input v-else type="text" class="input" v-model="form.email" placeholder="请输入邮箱，如 name@example.com" @blur="validateEmailFormat" />
        </view>
      </view>

      <view class="section-title">主页装扮</view>
      <view class="form-section">
        <view class="form-item">
          <text class="label">主页背景</text>
          <view class="bg-preview" :style="{ backgroundImage: `url(${form.bgImage})` }" @click="selectBg">
            <view class="bg-overlay">
              <text class="bg-icon">📷</text>
              <text class="bg-text">更换背景</text>
            </view>
          </view>
          <input type="file" ref="bgInput" accept="image/*" style="display: none" @change="handleBgChange" />
        </view>

        <view class="form-item">
          <text class="label">个人标签</text>
          <view class="tags-selector">
            <view class="tag-item" v-for="tag in tagOptions" :key="tag.id" :class="{ selected: form.tags.includes(tag.id) }" @click="toggleTag(tag.id)">
              {{ tag.name }}
            </view>
          </view>
          <view class="tag-tip">选择3-8个标签展示你的特点</view>
        </view>
      </view>

      <view class="section-title" v-if="activeServices.length > 0">我的服务</view>
      <view class="form-section" v-if="activeServices.length > 0">
        <view class="services-list">
          <view class="service-item" v-for="service in activeServices" :key="service.id">
            <image mode="aspectFill" class="service-icon" :src="service.icon" alt="" />
            <view class="service-info">
              <view class="service-name">{{ service.name }}</view>
              <view class="service-meta">
                <text class="service-game" v-if="service.game">{{ service.game }}</text>
                <text class="service-price" v-if="service.price">¥{{ service.price }}/小时</text>
              </view>
              <view class="service-expire">有效期至 {{ service.expiredAt }}</view>
            </view>
            <text class="service-status active">已开通</text>
          </view>
        </view>
      </view>

      <view class="section-title">认证信息</view>
      <view class="form-section">
        <view class="form-item">
          <text class="label">实名认证</text>
          <view class="verify-status" :class="{ verified: form.isVerified }">
            <text class="verify-icon">{{ form.isVerified ? '✅' : '❌' }}</text>
            <text class="verify-text">{{ form.isVerified ? '已认证' : '未认证' }}</text>
            <text class="verify-btn" v-if="!form.isVerified" @click="goRealName">去认证</text>
          </view>
        </view>

        <view class="form-item">
          <text class="label">VIP会员</text>
          <view class="vip-status" :class="{ active: form.isVip }">
            <text class="vip-icon">{{ form.isVip ? '👑' : '☆' }}</text>
            <text class="vip-text">{{ form.isVip ? 'VIP会员' : '开通VIP' }}</text>
            <text class="vip-btn" v-if="!form.isVip" @click="goVip">立即开通</text>
          </view>
        </view>
      </view>

      <view class="preview-section">
        <button class="preview-btn" @click="showPreview = true">
          <text class="preview-icon">👁️</text>
          预览我的主页
        </button>
      </view>
    </view>

    <view class="region-picker" v-if="showRegionPicker">
      <view class="picker-mask" @click="showRegionPicker = false"></view>
      <view class="picker-content">
        <view class="picker-header">
          <text class="picker-cancel" @click="showRegionPicker = false">取消</text>
          <text class="picker-title">选择地区</text>
          <text class="picker-confirm" @click="confirmRegion">确定</text>
        </view>
        <view class="picker-body">
          <view class="picker-column">
            <view class="picker-item" :class="{ active: regionStep === 'province' && tempRegion.province === province.name }" v-for="province in regionData" :key="province.code" @click="selectProvince(province)">
              {{ province.name }}
            </view>
          </view>
          <view class="picker-column" v-if="regionStep === 'city' || regionStep === 'district'">
            <view class="picker-item" :class="{ active: tempRegion.city === city.name }" v-for="city in regionCities" :key="city.code" @click="selectCity(city)">
              {{ city.name }}
            </view>
          </view>
          <view class="picker-column" v-if="regionStep === 'district'">
            <view class="picker-item" :class="{ active: tempRegion.district === district.name }" v-for="district in regionDistricts" :key="district.code" @click="selectDistrict(district)">
              {{ district.name }}
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="modal" v-if="showPreview" @click.self="showPreview = false">
      <view class="preview-modal">
        <view class="preview-header">
          <text class="preview-title">主页预览</text>
          <text class="preview-close" @click="showPreview = false">×</text>
        </view>
        <view class="preview-content">
          <view class="preview-bg" :style="{ backgroundImage: `url(${form.bgImage})` }"></view>
          <view class="preview-info">
            <image mode="aspectFill" class="preview-avatar" :src="form.avatar" alt="" />
            <view class="preview-name">{{ form.nickname || '未设置昵称' }}</view>
            <view class="preview-signature">{{ form.signature || '这个人很神秘，什么都没留下...' }}</view>
            <view class="preview-stats">
              <view class="preview-stat">
                <view class="stat-num">128</view>
                <view class="stat-label">关注</view>
              </view>
              <view class="preview-stat">
                <view class="stat-num">256</view>
                <view class="stat-label">粉丝</view>
              </view>
              <view class="preview-stat">
                <view class="stat-num">1.2k</view>
                <view class="stat-label">获赞</view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </PageLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from '@/common/route'
import PageLayout from '../components/PageLayout.vue'
import { toast } from '../composables/useToast'
import { uploadFile } from '../services/uploadService'
import { chooseImages } from '../services/mediaPicker'
import { isApp } from '../common/platform'
import authService from '../services/authService'
import regionService from '../services/regionService'

const router = useRouter()
const avatarUploading = ref(false)
const bgUploading = ref(false)
const saving = ref(false)
const profileLoaded = ref(false)

const avatarInput = ref(null)
const bgInput = ref(null)

const form = reactive({
  avatar: '',
  nickname: '',
  gender: '',
  birthday: '',
  region: '',
  height: null,
  profession: '',
  signature: '',
  hobbies: [],
  games: [],
  price: null,
  wechat: '',
  phone: '',
  email: '',
  bgImage: '',
  tags: [],
  isVerified: false,
  isVip: false,
  services: []
})

// App 端 uni picker 选完日期后回填 form.birthday（H5 仍由原生 date input 的 v-model 负责）
const onBirthdayChange = (e) => {
  form.birthday = e.detail.value
}

// App 端 uni input 没有 email 类型（只会退化成普通文本键盘，没有邮箱键盘/原生校验），
// 邮箱格式只能靠这个正则兜住；空值视为未填写（邮箱非必填），H5 仍由原生 type="email" 负责
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const validateEmailFormat = () => {
  const value = String(form.email || '').trim()
  if (!value) return true
  if (EMAIL_RE.test(value)) return true
  toast.error('请输入正确的邮箱格式')
  return false
}

// P2-7：扩展资料字段（生日/身高/职业/爱好/擅长游戏/价格/微信号/邮箱/背景图/标签）
// 存于服务端 xn_user_pref.data.profileExtra（无新表/迁移），随 /api/user/get 回填。
const toSafeString = (value) => (typeof value === 'string' ? value : (value === undefined || value === null ? '' : String(value)))

const toSafeNumber = (value) => {
  const num = Number(value)
  return Number.isFinite(num) && num > 0 ? num : null
}

const toSafeStringArray = (value) => {
  if (!Array.isArray(value)) return []
  return value.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim())
}

const toSafeTagIds = (value) => {
  if (!Array.isArray(value)) return []
  return value.map((item) => Number(item)).filter((id) => Number.isInteger(id) && id > 0)
}

// 回填扩展资料：数组/数字/空值统一兜底，服务端字段缺失或类型异常时不让页面崩
const applyProfileExtra = (raw) => {
  const extra = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  form.birthday = toSafeString(extra.birthday)
  form.height = toSafeNumber(extra.height)
  form.profession = toSafeString(extra.profession)
  form.hobbies = toSafeStringArray(extra.hobbies)
  form.games = toSafeStringArray(extra.games)
  form.price = toSafeNumber(extra.price)
  form.wechat = toSafeString(extra.wechat)
  form.email = toSafeString(extra.email)
  form.bgImage = toSafeString(extra.bgImage)
  form.tags = toSafeTagIds(extra.tags)
}

// 提交时只回传 10 个白名单字段；空值用 '' / null / [] 表达，便于用户清空已有内容
const buildProfileExtra = () => ({
  birthday: form.birthday || '',
  height: form.height === '' ? null : toSafeNumber(form.height),
  profession: form.profession || '',
  hobbies: toSafeStringArray(form.hobbies),
  games: toSafeStringArray(form.games),
  price: form.price === '' ? null : toSafeNumber(form.price),
  wechat: form.wechat || '',
  email: form.email || '',
  bgImage: form.bgImage || '',
  tags: toSafeTagIds(form.tags)
})

// 进入页面先回填服务端已有资料：避免「只改昵称保存」时把头像/城市/签名以空串覆盖。
// 基础字段（nickname/avatar/sex/city/dec）在 xn_user，扩展字段在 profileExtra。
const loadProfile = async () => {
  try {
    const res = await authService.getUserInfo()
    const data = (res && (res.data?.user || res.data)) || {}
    if (!data || typeof data !== 'object') return
    form.nickname = data.nickname || data.nickName || form.nickname
    form.avatar = data.avatar || form.avatar
    if (data.gender) form.gender = data.gender
    else if (data.sex === 1) form.gender = 'male'
    else if (data.sex === 2) form.gender = 'female'
    form.region = data.city || data.region || form.region
    form.signature = data.signature || data.dec || form.signature
    // 本人资料返回脱敏 mobile，用于展示；换绑入口跳设置页（真实接口）
    if (data.mobile) form.phone = data.mobile
    // 扩展字段：服务端按查看者身份裁剪，本人可拿到 wechat/email
    applyProfileExtra(data.profileExtra)
    profileLoaded.value = true
  } catch (error) {
    console.error('加载个人资料失败:', error)
  }
}

onMounted(loadProfile)

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
const showPreview = ref(false)
const regionStep = ref('province')
const tempRegion = reactive({
  province: '',
  city: '',
  district: ''
})
const regionData = ref([]) // 从 API 动态加载省份数据
const regionCities = ref([])
const regionDistricts = ref([])
const regionLoading = ref(false)

// 初始化加载省份
const loadProvinces = async () => {
  regionLoading.value = true
  try {
    const res = await regionService.getProvinces()
    if (res.code === 0 || res.code === 200) {
      regionData.value = res.data || res.list || []
    }
  } catch (e) {
    console.error('加载省份失败:', e)
  } finally {
    regionLoading.value = false
  }
}

loadProvinces()

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

const selectAvatar = async () => {
  // App 端没有可点击的 <input type=file>，统一走 mediaPicker（相册/相机）
  if (!isApp) { avatarInput.value?.click(); return }
  try {
    const { supported, files } = await chooseImages(1)
    if (supported && files.length) await applyAvatarFile(files[0])
  } catch (err) {
    toast.error(err.message || '选择图片失败')
  }
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024

// 选图后立即上传（直传COS，失败自动回退后端中转），表单只保存返回的URL
const uploadImageAndGetUrl = async (file) => {
  if (!file.type?.startsWith('image/')) {
    toast.error('请选择图片文件')
    return null
  }
  if (file.size > MAX_IMAGE_SIZE) {
    toast.error('图片不能超过10MB')
    return null
  }
  const res = await uploadFile(file, 'image')
  if (res?.code === 200 && res.data?.url) return res.data.url
  throw new Error(res?.message || '上传失败')
}

// H5 与 App 共用：H5 传 File，App 传 mediaPicker 的 { path, name, type, size }
const applyAvatarFile = async (file) => {
  if (!file || avatarUploading.value) return

  const preview = isApp ? file.path : URL.createObjectURL(file)
  const prev = form.avatar
  form.avatar = preview
  avatarUploading.value = true
  try {
    const url = await uploadImageAndGetUrl(file)
    if (url) {
      form.avatar = url
      toast.success('头像上传成功')
    } else {
      form.avatar = prev
    }
  } catch (err) {
    form.avatar = prev
    toast.error(err.message || '头像上传失败')
  } finally {
    avatarUploading.value = false
    if (!isApp) URL.revokeObjectURL(preview)
  }
}

const handleAvatarChange = async (e) => {
  const file = e.target.files?.[0]
  e.target.value = ''
  await applyAvatarFile(file)
}

const selectBg = async () => {
  if (!isApp) { bgInput.value?.click(); return }
  try {
    const { supported, files } = await chooseImages(1)
    if (supported && files.length) await applyBgFile(files[0])
  } catch (err) {
    toast.error(err.message || '选择图片失败')
  }
}

const applyBgFile = async (file) => {
  if (!file || bgUploading.value) return

  const preview = isApp ? file.path : URL.createObjectURL(file)
  const prev = form.bgImage
  form.bgImage = preview
  bgUploading.value = true
  try {
    const url = await uploadImageAndGetUrl(file)
    if (url) {
      form.bgImage = url
      toast.success('背景图上传成功')
    } else {
      form.bgImage = prev
    }
  } catch (err) {
    form.bgImage = prev
    toast.error(err.message || '背景图上传失败')
  } finally {
    bgUploading.value = false
    if (!isApp) URL.revokeObjectURL(preview)
  }
}

const handleBgChange = async (e) => {
  const file = e.target.files?.[0]
  e.target.value = ''
  await applyBgFile(file)
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

const selectProvince = async (province) => {
  tempRegion.province = province.name
  tempRegion.city = ''
  tempRegion.district = ''
  currentProvince.value = province
  regionStep.value = 'city'
  regionLoading.value = true
  try {
    const res = await regionService.getCities(province.code)
    if (res.code === 0 || res.code === 200) {
      regionCities.value = res.data || res.list || []
    }
  } finally {
    regionLoading.value = false
  }
}

const selectCity = async (city) => {
  tempRegion.city = city.name
  tempRegion.district = ''
  currentCity.value = city
  regionStep.value = 'district'
  regionLoading.value = true
  try {
    const res = await regionService.getDistricts(city.code)
    if (res.code === 0 || res.code === 200) {
      regionDistricts.value = res.data || res.list || []
    }
  } finally {
    regionLoading.value = false
  }
}

const selectDistrict = (district) => { tempRegion.district = district.name }

const confirmRegion = () => {
  form.region = tempRegion.province + (tempRegion.city || '') + (tempRegion.district || '')
  showRegionPicker.value = false
}

const goRealName = () => { router.push('/real-name') }
// 换绑手机号统一走设置页：双验证码、盲索引查重、全端会话吊销都在服务端完成。
const goSettingsPhone = () => { router.push('/settings') }
const goVip = () => { router.push('/vip-center') }

const saveProfile = async () => {
  if (saving.value) return

  if (!form.nickname.trim()) {
    toast.error('请输入昵称')
    return
  }
  if (form.tags.length < 3) {
    toast.error('请至少选择3个标签')
    return
  }
  if (!validateEmailFormat()) return
  if (avatarUploading.value || bgUploading.value) {
    toast.error('图片上传中，请稍候')
    return
  }
  // blob: 为本地预览地址，未成功上传不可提交
  if (form.avatar?.startsWith('blob:') || form.bgImage?.startsWith('blob:')) {
    toast.error('图片尚未上传完成，请重试')
    return
  }

  saving.value = true
  try {
    // 基础字段（nickname/avatar/sex/city/dec）只提交「有值/已加载」项，避免未回填时用空串覆盖；
    // 扩展字段整体走 profileExtra，由后端存 xn_user_pref.data.profileExtra（P2-7）。
    const payload = { nickname: form.nickname.trim() }
    if (form.avatar && !form.avatar.startsWith('blob:')) payload.avatar = form.avatar
    if (form.gender === 'male' || form.gender === 'female') {
      payload.sex = form.gender === 'male' ? 1 : 2
    }
    if (profileLoaded.value || form.region) payload.city = form.region
    if (profileLoaded.value || form.signature) payload.dec = form.signature
    payload.profileExtra = buildProfileExtra()
    const res = await authService.updateUserInfo(payload)

    if (res?.code === 200) {
      toast.success('保存成功！')
      router.back()
    } else {
      toast.error(res?.message || '保存失败')
    }
  } catch (err) {
    toast.error(err.message || '保存失败，请稍后重试')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.back-btn, .save-btn { font-size: 16px; color: white; cursor: pointer; background: none; border: none; padding: 0; }
.back-btn { font-size: 24px; width: 40px; text-align: center; }
.nav-title { flex: 1; text-align: center; font-size: 18px; font-weight: bold; color: white; }
.save-btn { font-weight: 500; }

.content { padding: 16px; }

.profile-completeness {
  background: white;
  border-radius: 0px;
  padding: 16px;
  /* 负 margin 抵消 .content 的 16px padding，让卡片左右铺满页面限制框 */
  margin: 12px -16px 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.completeness-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.completeness-title { font-size: 14px; color: #333; }
.completeness-percent { font-size: 16px; font-weight: bold; color: var(--color-primary); }

.completeness-bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.completeness-fill {
  height: 100%;
  background: var(--gradient-primary-90);
  border-radius: 4px;
  transition: width 0.3s;
}

.completeness-tip { font-size: 12px; color: #999; }

.basic-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 14px 16px;
  border-bottom: 1px solid #f5f5f5;
}

.basic-header .nickname-item {
  flex: 1;
  padding: 0;
  border-bottom: none;
}

.basic-header .nickname-item .char-count {
  position: static;
  display: block;
  text-align: right;
  margin-top: 4px;
}

.avatar-section {
  position: relative;
  width: 88px;
  height: 88px;
  margin: 0;
  flex-shrink: 0;
}

.avatar-mask {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  background: var(--gradient-primary);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 4px solid white;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.35);
  transition: transform 0.2s, box-shadow 0.2s;
}

.avatar-mask:active { transform: scale(0.94); }

.avatar-vip {
  position: absolute;
  top: -4px;
  right: -4px;
  z-index: 2;
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  color: white;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: bold;
  box-shadow: 0 2px 6px rgba(255, 165, 0, 0.4);
}

.upload-icon {
  font-size: 24px;
  margin-bottom: 4px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
}

.upload-text {
  font-size: 12px;
  color: white;
  font-weight: 500;
  letter-spacing: 2px;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: #666;
  margin: 20px 0 10px;
  padding-left: 4px;
}

.form-section {
  background: white;
  border-radius: 0px;
  overflow: hidden;
  /* 与资料完善度卡片一致，抵消 .content 的 16px padding，铺满页面限制框 */
  margin: 12px -16px 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
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

.input:focus, .textarea:focus { border-color: var(--color-primary); background: white; }

/* App 端 uni picker 默认不是块级占满，补成与 .input 同宽 */
.picker-block {
  display: block;
  width: 100%;
}

/* App 端 uni picker 的展示区沿用 .input 外观，文字需垂直居中 */
.app-picker-value {
  display: flex;
  align-items: center;
  color: #333;
}

.app-picker-value.placeholder {
  color: #999;
}
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
  border-color: var(--color-primary);
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
  background: var(--gradient-primary);
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
  color: var(--color-primary);
  cursor: pointer;
}

.vip-status.active { background: rgba(255,215,0,0.1); }
.vip-status.active .vip-text { color: #ff8c00; font-weight: 500; }

.phone-display { display: flex; align-items: center; justify-content: space-between; }
.phone-value { font-size: 14px; color: #666; }
.phone-btn { font-size: 14px; color: var(--color-primary); cursor: pointer; }

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
  background: var(--gradient-primary);
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

.service-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

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
  color: var(--color-primary);
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
  background: var(--gradient-primary);
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
.picker-confirm, .modal-btn.confirm { color: var(--color-primary); font-weight: 500; cursor: pointer; }
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
.picker-item.active { color: var(--color-primary); font-weight: 500; background: rgba(102,126,234,0.05); }

.modal-content { max-width: 360px; margin: auto; border-radius: 16px; position: relative; top: 50%; transform: translateY(-50%); }
.modal-body { padding: 20px; display: block; }
.modal-input { width: 100%; padding: 12px; font-size: 15px; border: 1px solid #e5e5e5; border-radius: 8px; box-sizing: border-box; margin-bottom: 12px; }
.code-row { display: flex; gap: 10px; }
.code { flex: 1; margin-bottom: 0; }
.code-btn { padding: 0 16px; background: var(--color-primary); color: white; font-size: 14px; border: none; border-radius: 8px; white-space: nowrap; }

.modal-footer { display: flex; border-top: 1px solid #f0f0f0; }
.modal-btn { flex: 1; padding: 16px; text-align: center; font-size: 16px; border: none; background: none; cursor: pointer; }
.modal-btn.cancel { border-right: 1px solid #f0f0f0; color: #666; }
.modal-btn.confirm { color: var(--color-primary); font-weight: 500; }

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
