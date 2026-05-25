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
  { code: '110000', name: '北京市', cities: [{ code: '110100', name: '北京市', districts: [{ code: '110101', name: '东城区' }, { code: '110102', name: '西城区' }, { code: '110105', name: '朝阳区' }, { code: '110106', name: '丰台区' }, { code: '110107', name: '石景山区' }, { code: '110108', name: '海淀区' }, { code: '110109', name: '门头沟区' }, { code: '110111', name: '房山区' }, { code: '110112', name: '通州区' }, { code: '110113', name: '顺义区' }, { code: '110114', name: '昌平区' }, { code: '110115', name: '大兴区' }, { code: '110116', name: '怀柔区' }, { code: '110117', name: '平谷区' }, { code: '110118', name: '密云区' }, { code: '110119', name: '延庆区' }] }] },
  { code: '310000', name: '上海市', cities: [{ code: '310100', name: '上海市', districts: [{ code: '310101', name: '黄浦区' }, { code: '310104', name: '徐汇区' }, { code: '310105', name: '长宁区' }, { code: '310106', name: '静安区' }, { code: '310107', name: '普陀区' }, { code: '310109', name: '虹口区' }, { code: '310110', name: '杨浦区' }, { code: '310112', name: '闵行区' }, { code: '310113', name: '宝山区' }, { code: '310114', name: '嘉定区' }, { code: '310115', name: '浦东新区' }, { code: '310116', name: '金山区' }, { code: '310117', name: '松江区' }, { code: '310118', name: '青浦区' }, { code: '310120', name: '奉贤区' }, { code: '310151', name: '崇明区' }] }] },
  { code: '120000', name: '天津市', cities: [{ code: '120100', name: '天津市', districts: [{ code: '120101', name: '和平区' }, { code: '120102', name: '河东区' }, { code: '120103', name: '河西区' }, { code: '120104', name: '南开区' }, { code: '120105', name: '河北区' }, { code: '120106', name: '红桥区' }, { code: '120110', name: '东丽区' }, { code: '120111', name: '西青区' }, { code: '120112', name: '津南区' }, { code: '120113', name: '北辰区' }, { code: '120114', name: '武清区' }, { code: '120115', name: '宝坻区' }, { code: '120116', name: '滨海新区' }, { code: '120117', name: '宁河区' }, { code: '120118', name: '静海区' }, { code: '120119', name: '蓟州区' }] }] },
  { code: '500000', name: '重庆市', cities: [{ code: '500100', name: '重庆市', districts: [{ code: '500101', name: '万州区' }, { code: '500102', name: '涪陵区' }, { code: '500103', name: '渝中区' }, { code: '500104', name: '大渡口区' }, { code: '500105', name: '江北区' }, { code: '500106', name: '沙坪坝区' }, { code: '500107', name: '九龙坡区' }, { code: '500108', name: '南岸区' }, { code: '500109', name: '北碚区' }, { code: '500110', name: '綦江区' }, { code: '500111', name: '大足区' }, { code: '500112', name: '渝北区' }, { code: '500113', name: '巴南区' }, { code: '500114', name: '黔江区' }, { code: '500115', name: '长寿区' }, { code: '500116', name: '江津区' }, { code: '500117', name: '合川区' }, { code: '500118', name: '永川区' }, { code: '500119', name: '南川区' }, { code: '500120', name: '璧山区' }, { code: '500151', name: '铜梁区' }, { code: '500152', name: '潼南区' }, { code: '500153', name: '荣昌区' }, { code: '500154', name: '开州区' }, { code: '500155', name: '梁平区' }, { code: '500156', name: '武隆区' }] }] },
  {
    code: '440000', name: '广东省',
    cities: [
      { code: '440100', name: '广州市', districts: [{ code: '440103', name: '荔湾区' }, { code: '440104', name: '越秀区' }, { code: '440105', name: '海珠区' }, { code: '440106', name: '天河区' }, { code: '440111', name: '白云区' }, { code: '440112', name: '黄埔区' }, { code: '440113', name: '番禺区' }, { code: '440114', name: '花都区' }, { code: '440115', name: '南沙区' }, { code: '440117', name: '从化区' }, { code: '440118', name: '增城区' }] },
      { code: '440300', name: '深圳市', districts: [{ code: '440303', name: '罗湖区' }, { code: '440304', name: '福田区' }, { code: '440305', name: '南山区' }, { code: '440306', name: '宝安区' }, { code: '440307', name: '龙岗区' }, { code: '440308', name: '盐田区' }, { code: '440309', name: '龙华区' }, { code: '440310', name: '坪山区' }, { code: '440311', name: '光明区' }] },
      { code: '440400', name: '珠海市', districts: [] }, { code: '440500', name: '汕头市', districts: [] }, { code: '440600', name: '佛山市', districts: [{ code: '440604', name: '禅城区' }, { code: '440605', name: '南海区' }, { code: '440606', name: '顺德区' }, { code: '440607', name: '三水区' }, { code: '440608', name: '高明区' }] },
      { code: '440700', name: '江门市', districts: [] }, { code: '440800', name: '湛江市', districts: [] }, { code: '440900', name: '茂名市', districts: [] }, { code: '441200', name: '肇庆市', districts: [] },
      { code: '441300', name: '惠州市', districts: [{ code: '441302', name: '惠城区' }, { code: '441303', name: '惠阳区' }] },
      { code: '441400', name: '梅州市', districts: [] }, { code: '441500', name: '汕尾市', districts: [] }, { code: '441600', name: '河源市', districts: [] }, { code: '441700', name: '阳江市', districts: [] },
      { code: '441800', name: '清远市', districts: [] }, { code: '441900', name: '东莞市', districts: [] }, { code: '442000', name: '中山市', districts: [] }, { code: '445100', name: '潮州市', districts: [] },
      { code: '445200', name: '揭阳市', districts: [] }, { code: '445300', name: '云浮市', districts: [] }
    ]
  },
  {
    code: '330000', name: '浙江省',
    cities: [
      { code: '330100', name: '杭州市', districts: [{ code: '330102', name: '上城区' }, { code: '330105', name: '拱墅区' }, { code: '330106', name: '西湖区' }, { code: '330108', name: '滨江区' }, { code: '330109', name: '萧山区' }, { code: '330110', name: '余杭区' }, { code: '330111', name: '富阳区' }, { code: '330112', name: '临安区' }, { code: '330113', name: '临平区' }, { code: '330114', name: '钱塘区' }] },
      { code: '330200', name: '宁波市', districts: [] }, { code: '330300', name: '温州市', districts: [] }, { code: '330400', name: '嘉兴市', districts: [] }, { code: '330500', name: '湖州市', districts: [] },
      { code: '330600', name: '绍兴市', districts: [] }, { code: '330700', name: '金华市', districts: [] }, { code: '330800', name: '衢州市', districts: [] }, { code: '330900', name: '舟山市', districts: [] },
      { code: '331000', name: '台州市', districts: [] }, { code: '331100', name: '丽水市', districts: [] }
    ]
  },
  {
    code: '320000', name: '江苏省',
    cities: [
      { code: '320100', name: '南京市', districts: [{ code: '320102', name: '玄武区' }, { code: '320104', name: '秦淮区' }, { code: '320105', name: '建邺区' }, { code: '320106', name: '鼓楼区' }, { code: '320111', name: '浦口区' }, { code: '320113', name: '栖霞区' }, { code: '320114', name: '雨花台区' }, { code: '320115', name: '江宁区' }, { code: '320116', name: '六合区' }, { code: '320117', name: '溧水区' }, { code: '320118', name: '高淳区' }] },
      { code: '320200', name: '无锡市', districts: [] }, { code: '320300', name: '徐州市', districts: [] }, { code: '320400', name: '常州市', districts: [] },
      { code: '320500', name: '苏州市', districts: [{ code: '320505', name: '虎丘区' }, { code: '320506', name: '吴中区' }, { code: '320507', name: '相城区' }, { code: '320508', name: '姑苏区' }, { code: '320509', name: '吴江区' }, { code: '320581', name: '常熟市' }, { code: '320582', name: '张家港市' }, { code: '320583', name: '昆山市' }, { code: '320585', name: '太仓市' }] },
      { code: '320600', name: '南通市', districts: [] }, { code: '320700', name: '连云港市', districts: [] }, { code: '320800', name: '淮安市', districts: [] }, { code: '320900', name: '盐城市', districts: [] },
      { code: '321000', name: '扬州市', districts: [] }, { code: '321100', name: '镇江市', districts: [] }, { code: '321200', name: '泰州市', districts: [] }, { code: '321300', name: '宿迁市', districts: [] }
    ]
  },
  {
    code: '510000', name: '四川省',
    cities: [
      { code: '510100', name: '成都市', districts: [{ code: '510104', name: '锦江区' }, { code: '510105', name: '青羊区' }, { code: '510106', name: '金牛区' }, { code: '510107', name: '武侯区' }, { code: '510108', name: '成华区' }, { code: '510112', name: '龙泉驿区' }, { code: '510113', name: '青白江区' }, { code: '510114', name: '新都区' }, { code: '510115', name: '温江区' }, { code: '510116', name: '双流区' }, { code: '510117', name: '郫都区' }, { code: '510118', name: '新津区' }] },
      { code: '510300', name: '自贡市', districts: [] }, { code: '510400', name: '攀枝花市', districts: [] }, { code: '510500', name: '泸州市', districts: [] }, { code: '510600', name: '德阳市', districts: [] },
      { code: '510700', name: '绵阳市', districts: [] }, { code: '510800', name: '广元市', districts: [] }, { code: '510900', name: '遂宁市', districts: [] }, { code: '511000', name: '内江市', districts: [] },
      { code: '511100', name: '乐山市', districts: [] }, { code: '511300', name: '南充市', districts: [] }, { code: '511400', name: '眉山市', districts: [] }, { code: '511500', name: '宜宾市', districts: [] },
      { code: '511600', name: '广安市', districts: [] }, { code: '511700', name: '达州市', districts: [] }, { code: '511800', name: '雅安市', districts: [] }, { code: '511900', name: '巴中市', districts: [] },
      { code: '512000', name: '资阳市', districts: [] }
    ]
  },
  {
    code: '420000', name: '湖北省',
    cities: [
      { code: '420100', name: '武汉市', districts: [{ code: '420102', name: '江岸区' }, { code: '420103', name: '江汉区' }, { code: '420104', name: '硚口区' }, { code: '420105', name: '汉阳区' }, { code: '420106', name: '武昌区' }, { code: '420107', name: '青山区' }, { code: '420111', name: '洪山区' }, { code: '420112', name: '东西湖区' }, { code: '420113', name: '汉南区' }, { code: '420114', name: '蔡甸区' }, { code: '420115', name: '江夏区' }, { code: '420116', name: '黄陂区' }, { code: '420117', name: '新洲区' }] },
      { code: '420200', name: '黄石市', districts: [] }, { code: '420300', name: '十堰市', districts: [] }, { code: '420500', name: '宜昌市', districts: [] }, { code: '420600', name: '襄阳市', districts: [] },
      { code: '420700', name: '鄂州市', districts: [] }, { code: '420800', name: '荆门市', districts: [] }, { code: '420900', name: '孝感市', districts: [] }, { code: '421000', name: '荆州市', districts: [] },
      { code: '421100', name: '黄冈市', districts: [] }, { code: '421200', name: '咸宁市', districts: [] }, { code: '421300', name: '随州市', districts: [] }, { code: '422800', name: '恩施土家族苗族自治州', districts: [] }
    ]
  },
  {
    code: '430000', name: '湖南省',
    cities: [
      { code: '430100', name: '长沙市', districts: [{ code: '430102', name: '芙蓉区' }, { code: '430103', name: '天心区' }, { code: '430104', name: '岳麓区' }, { code: '430105', name: '开福区' }, { code: '430111', name: '雨花区' }, { code: '430112', name: '望城区' }, { code: '430121', name: '长沙县' }] },
      { code: '430200', name: '株洲市', districts: [] }, { code: '430300', name: '湘潭市', districts: [] }, { code: '430400', name: '衡阳市', districts: [] }, { code: '430500', name: '邵阳市', districts: [] },
      { code: '430600', name: '岳阳市', districts: [] }, { code: '430700', name: '常德市', districts: [] }, { code: '430800', name: '张家界市', districts: [] }, { code: '430900', name: '益阳市', districts: [] },
      { code: '431000', name: '郴州市', districts: [] }, { code: '431100', name: '永州市', districts: [] }, { code: '431200', name: '怀化市', districts: [] }, { code: '431300', name: '娄底市', districts: [] },
      { code: '433100', name: '湘西土家族苗族自治州', districts: [] }
    ]
  },
  {
    code: '350000', name: '福建省',
    cities: [
      { code: '350100', name: '福州市', districts: [{ code: '350102', name: '鼓楼区' }, { code: '350103', name: '台江区' }, { code: '350104', name: '仓山区' }, { code: '350105', name: '马尾区' }, { code: '350111', name: '晋安区' }, { code: '350112', name: '长乐区' }] },
      { code: '350200', name: '厦门市', districts: [{ code: '350203', name: '思明区' }, { code: '350205', name: '海沧区' }, { code: '350206', name: '湖里区' }, { code: '350211', name: '集美区' }, { code: '350212', name: '同安区' }, { code: '350213', name: '翔安区' }] },
      { code: '350300', name: '莆田市', districts: [] }, { code: '350400', name: '三明市', districts: [] }, { code: '350500', name: '泉州市', districts: [] }, { code: '350600', name: '漳州市', districts: [] },
      { code: '350700', name: '南平市', districts: [] }, { code: '350800', name: '龙岩市', districts: [] }, { code: '350900', name: '宁德市', districts: [] }
    ]
  },
  {
    code: '370000', name: '山东省',
    cities: [
      { code: '370100', name: '济南市', districts: [{ code: '370102', name: '历下区' }, { code: '370103', name: '市中区' }, { code: '370104', name: '槐荫区' }, { code: '370105', name: '天桥区' }, { code: '370112', name: '历城区' }, { code: '370113', name: '长清区' }, { code: '370114', name: '章丘区' }, { code: '370115', name: '济阳区' }, { code: '370116', name: '莱芜区' }, { code: '370117', name: '钢城区' }] },
      { code: '370200', name: '青岛市', districts: [{ code: '370202', name: '市南区' }, { code: '370203', name: '市北区' }, { code: '370211', name: '黄岛区' }, { code: '370212', name: '崂山区' }, { code: '370213', name: '李沧区' }, { code: '370214', name: '城阳区' }, { code: '370215', name: '即墨区' }] },
      { code: '370300', name: '淄博市', districts: [] }, { code: '370400', name: '枣庄市', districts: [] }, { code: '370500', name: '东营市', districts: [] }, { code: '370600', name: '烟台市', districts: [] },
      { code: '370700', name: '潍坊市', districts: [] }, { code: '370800', name: '济宁市', districts: [] }, { code: '370900', name: '泰安市', districts: [] }, { code: '371000', name: '威海市', districts: [] },
      { code: '371100', name: '日照市', districts: [] }, { code: '371300', name: '临沂市', districts: [] }, { code: '371400', name: '德州市', districts: [] }, { code: '371500', name: '聊城市', districts: [] },
      { code: '371600', name: '滨州市', districts: [] }, { code: '371700', name: '菏泽市', districts: [] }
    ]
  },
  {
    code: '410000', name: '河南省',
    cities: [
      { code: '410100', name: '郑州市', districts: [{ code: '410102', name: '中原区' }, { code: '410103', name: '二七区' }, { code: '410104', name: '管城回族区' }, { code: '410105', name: '金水区' }, { code: '410106', name: '上街区' }, { code: '410108', name: '惠济区' }, { code: '410122', name: '中牟县' }] },
      { code: '410200', name: '开封市', districts: [] }, { code: '410300', name: '洛阳市', districts: [] }, { code: '410400', name: '平顶山市', districts: [] }, { code: '410500', name: '安阳市', districts: [] },
      { code: '410600', name: '鹤壁市', districts: [] }, { code: '410700', name: '新乡市', districts: [] }, { code: '410800', name: '焦作市', districts: [] }, { code: '410900', name: '濮阳市', districts: [] },
      { code: '411000', name: '许昌市', districts: [] }, { code: '411100', name: '漯河市', districts: [] }, { code: '411200', name: '三门峡市', districts: [] }, { code: '411300', name: '南阳市', districts: [] },
      { code: '411400', name: '商丘市', districts: [] }, { code: '411500', name: '信阳市', districts: [] }, { code: '411600', name: '周口市', districts: [] }, { code: '411700', name: '驻马店市', districts: [] }
    ]
  },
  { code: '130000', name: '河北省', cities: [{ code: '130100', name: '石家庄市', districts: [] }, { code: '130200', name: '唐山市', districts: [] }, { code: '130300', name: '秦皇岛市', districts: [] }, { code: '130400', name: '邯郸市', districts: [] }, { code: '130500', name: '邢台市', districts: [] }, { code: '130600', name: '保定市', districts: [] }, { code: '130700', name: '张家口市', districts: [] }, { code: '130800', name: '承德市', districts: [] }, { code: '130900', name: '沧州市', districts: [] }, { code: '131000', name: '廊坊市', districts: [] }, { code: '131100', name: '衡水市', districts: [] }] },
  { code: '140000', name: '山西省', cities: [{ code: '140100', name: '太原市', districts: [] }, { code: '140200', name: '大同市', districts: [] }, { code: '140300', name: '阳泉市', districts: [] }, { code: '140400', name: '长治市', districts: [] }, { code: '140500', name: '晋城市', districts: [] }, { code: '140600', name: '朔州市', districts: [] }, { code: '140700', name: '晋中市', districts: [] }, { code: '140800', name: '运城市', districts: [] }, { code: '140900', name: '忻州市', districts: [] }, { code: '141000', name: '临汾市', districts: [] }, { code: '141100', name: '吕梁市', districts: [] }] },
  { code: '150000', name: '内蒙古自治区', cities: [{ code: '150100', name: '呼和浩特市', districts: [] }, { code: '150200', name: '包头市', districts: [] }, { code: '150300', name: '乌海市', districts: [] }, { code: '150400', name: '赤峰市', districts: [] }, { code: '150500', name: '通辽市', districts: [] }, { code: '150600', name: '鄂尔多斯市', districts: [] }, { code: '150700', name: '呼伦贝尔市', districts: [] }, { code: '150800', name: '巴彦淖尔市', districts: [] }, { code: '150900', name: '乌兰察布市', districts: [] }] },
  { code: '210000', name: '辽宁省', cities: [{ code: '210100', name: '沈阳市', districts: [] }, { code: '210200', name: '大连市', districts: [] }, { code: '210300', name: '鞍山市', districts: [] }, { code: '210400', name: '抚顺市', districts: [] }, { code: '210500', name: '本溪市', districts: [] }, { code: '210600', name: '丹东市', districts: [] }, { code: '210700', name: '锦州市', districts: [] }, { code: '210800', name: '营口市', districts: [] }, { code: '210900', name: '阜新市', districts: [] }, { code: '211000', name: '辽阳市', districts: [] }, { code: '211100', name: '盘锦市', districts: [] }, { code: '211200', name: '铁岭市', districts: [] }, { code: '211300', name: '朝阳市', districts: [] }, { code: '211400', name: '葫芦岛市', districts: [] }] },
  { code: '220000', name: '吉林省', cities: [{ code: '220100', name: '长春市', districts: [] }, { code: '220200', name: '吉林市', districts: [] }, { code: '220300', name: '四平市', districts: [] }, { code: '220400', name: '辽源市', districts: [] }, { code: '220500', name: '通化市', districts: [] }, { code: '220600', name: '白山市', districts: [] }, { code: '220700', name: '松原市', districts: [] }, { code: '220800', name: '白城市', districts: [] }, { code: '222400', name: '延边朝鲜族自治州', districts: [] }] },
  { code: '230000', name: '黑龙江省', cities: [{ code: '230100', name: '哈尔滨市', districts: [] }, { code: '230200', name: '齐齐哈尔市', districts: [] }, { code: '230300', name: '鸡西市', districts: [] }, { code: '230400', name: '鹤岗市', districts: [] }, { code: '230500', name: '双鸭山市', districts: [] }, { code: '230600', name: '大庆市', districts: [] }, { code: '230700', name: '伊春市', districts: [] }, { code: '230800', name: '佳木斯市', districts: [] }, { code: '230900', name: '七台河市', districts: [] }, { code: '231000', name: '牡丹江市', districts: [] }, { code: '231100', name: '黑河市', districts: [] }, { code: '231200', name: '绥化市', districts: [] }] },
  { code: '340000', name: '安徽省', cities: [{ code: '340100', name: '合肥市', districts: [] }, { code: '340200', name: '芜湖市', districts: [] }, { code: '340300', name: '蚌埠市', districts: [] }, { code: '340400', name: '淮南市', districts: [] }, { code: '340500', name: '马鞍山市', districts: [] }, { code: '340600', name: '淮北市', districts: [] }, { code: '340700', name: '铜陵市', districts: [] }, { code: '340800', name: '安庆市', districts: [] }, { code: '341000', name: '黄山市', districts: [] }, { code: '341100', name: '滁州市', districts: [] }, { code: '341200', name: '阜阳市', districts: [] }, { code: '341300', name: '宿州市', districts: [] }, { code: '341500', name: '六安市', districts: [] }, { code: '341600', name: '亳州市', districts: [] }, { code: '341700', name: '池州市', districts: [] }, { code: '341800', name: '宣城市', districts: [] }] },
  { code: '360000', name: '江西省', cities: [{ code: '360100', name: '南昌市', districts: [] }, { code: '360200', name: '景德镇市', districts: [] }, { code: '360300', name: '萍乡市', districts: [] }, { code: '360400', name: '九江市', districts: [] }, { code: '360500', name: '新余市', districts: [] }, { code: '360600', name: '鹰潭市', districts: [] }, { code: '360700', name: '赣州市', districts: [] }, { code: '360800', name: '吉安市', districts: [] }, { code: '360900', name: '宜春市', districts: [] }, { code: '361000', name: '抚州市', districts: [] }, { code: '361100', name: '上饶市', districts: [] }] },
  { code: '450000', name: '广西壮族自治区', cities: [{ code: '450100', name: '南宁市', districts: [] }, { code: '450200', name: '柳州市', districts: [] }, { code: '450300', name: '桂林市', districts: [] }, { code: '450400', name: '梧州市', districts: [] }, { code: '450500', name: '北海市', districts: [] }, { code: '450600', name: '防城港市', districts: [] }, { code: '450700', name: '钦州市', districts: [] }, { code: '450800', name: '贵港市', districts: [] }, { code: '450900', name: '玉林市', districts: [] }, { code: '451000', name: '百色市', districts: [] }, { code: '451100', name: '贺州市', districts: [] }, { code: '451200', name: '河池市', districts: [] }, { code: '451300', name: '来宾市', districts: [] }, { code: '451400', name: '崇左市', districts: [] }] },
  { code: '460000', name: '海南省', cities: [{ code: '460100', name: '海口市', districts: [] }, { code: '460200', name: '三亚市', districts: [] }, { code: '460300', name: '三沙市', districts: [] }, { code: '460400', name: '儋州市', districts: [] }] },
  { code: '520000', name: '贵州省', cities: [{ code: '520100', name: '贵阳市', districts: [] }, { code: '520200', name: '六盘水市', districts: [] }, { code: '520300', name: '遵义市', districts: [] }, { code: '520400', name: '安顺市', districts: [] }, { code: '520500', name: '毕节市', districts: [] }, { code: '520600', name: '铜仁市', districts: [] }] },
  { code: '530000', name: '云南省', cities: [{ code: '530100', name: '昆明市', districts: [] }, { code: '530300', name: '曲靖市', districts: [] }, { code: '530400', name: '玉溪市', districts: [] }, { code: '530500', name: '保山市', districts: [] }, { code: '530600', name: '昭通市', districts: [] }, { code: '530700', name: '丽江市', districts: [] }, { code: '530800', name: '普洱市', districts: [] }, { code: '530900', name: '临沧市', districts: [] }] },
  { code: '540000', name: '西藏自治区', cities: [{ code: '540100', name: '拉萨市', districts: [] }, { code: '540200', name: '日喀则市', districts: [] }, { code: '540300', name: '昌都市', districts: [] }, { code: '540400', name: '林芝市', districts: [] }, { code: '540500', name: '山南市', districts: [] }, { code: '540600', name: '那曲市', districts: [] }] },
  { code: '610000', name: '陕西省', cities: [{ code: '610100', name: '西安市', districts: [{ code: '610102', name: '新城区' }, { code: '610103', name: '碑林区' }, { code: '610104', name: '莲湖区' }, { code: '610111', name: '灞桥区' }, { code: '610112', name: '未央区' }, { code: '610113', name: '雁塔区' }, { code: '610114', name: '阎良区' }, { code: '610115', name: '临潼区' }, { code: '610116', name: '长安区' }, { code: '610117', name: '高陵区' }, { code: '610118', name: '鄠邑区' }] }, { code: '610200', name: '铜川市', districts: [] }, { code: '610300', name: '宝鸡市', districts: [] }, { code: '610400', name: '咸阳市', districts: [] }, { code: '610500', name: '渭南市', districts: [] }, { code: '610600', name: '延安市', districts: [] }, { code: '610700', name: '汉中市', districts: [] }, { code: '610800', name: '榆林市', districts: [] }, { code: '610900', name: '安康市', districts: [] }, { code: '611000', name: '商洛市', districts: [] }] },
  { code: '620000', name: '甘肃省', cities: [{ code: '620100', name: '兰州市', districts: [] }, { code: '620200', name: '嘉峪关市', districts: [] }, { code: '620300', name: '金昌市', districts: [] }, { code: '620400', name: '白银市', districts: [] }, { code: '620500', name: '天水市', districts: [] }, { code: '620600', name: '武威市', districts: [] }, { code: '620700', name: '张掖市', districts: [] }, { code: '620800', name: '平凉市', districts: [] }, { code: '620900', name: '酒泉市', districts: [] }, { code: '621000', name: '庆阳市', districts: [] }, { code: '621100', name: '定西市', districts: [] }, { code: '621200', name: '陇南市', districts: [] }] },
  { code: '630000', name: '青海省', cities: [{ code: '630100', name: '西宁市', districts: [] }, { code: '630200', name: '海东市', districts: [] }] },
  { code: '640000', name: '宁夏回族自治区', cities: [{ code: '640100', name: '银川市', districts: [] }, { code: '640200', name: '石嘴山市', districts: [] }, { code: '640300', name: '吴忠市', districts: [] }, { code: '640400', name: '固原市', districts: [] }, { code: '640500', name: '中卫市', districts: [] }] },
  { code: '650000', name: '新疆维吾尔自治区', cities: [{ code: '650100', name: '乌鲁木齐市', districts: [] }, { code: '650200', name: '克拉玛依市', districts: [] }, { code: '650400', name: '吐鲁番市', districts: [] }, { code: '650500', name: '哈密市', districts: [] }] },
  { code: '710000', name: '台湾省', cities: [{ code: '710100', name: '台北市', districts: [] }, { code: '710200', name: '高雄市', districts: [] }, { code: '710300', name: '台中市', districts: [] }, { code: '710400', name: '台南市', districts: [] }] },
  { code: '810000', name: '香港特别行政区', cities: [{ code: '810100', name: '香港', districts: [] }] },
  { code: '820000', name: '澳门特别行政区', cities: [{ code: '820100', name: '澳门', districts: [] }] }
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
  padding-bottom: 90px;
  max-width: 650px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30px 20px;
  background: white;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn, .save-btn { font-size: 16px; color: #333; cursor: pointer; background: none; border: none; padding: 0; }
.back-btn { font-size: 24px; width: 40px; text-align: center; }
.title { font-size: 18px; font-weight: bold; color: #333; }
.save-btn { color: #667eea; font-weight: 500; }

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
