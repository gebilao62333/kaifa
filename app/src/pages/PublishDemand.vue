<template>
  <PageLayout>
    <template #nav>
      <text class="back-btn" @click="goBack">←</text>
      <text class="nav-title">发布需求</text>
      <text class="placeholder"></text>
    </template>

    <view class="content">
      <view class="form-section">
        <view class="section-title">服务类型</view>
        <view class="type-options">
          <view
            class="type-item"
            :class="{ active: formData.serviceType === 'online' }"
            @click="formData.serviceType = 'online'"
          >
            <text class="type-icon">💻</text>
            <text class="type-name">线上陪玩</text>
          </view>
          <view
            class="type-item"
            :class="{ active: formData.serviceType === 'offline' }"
            @click="formData.serviceType = 'offline'"
          >
            <text class="type-icon">📍</text>
            <text class="type-name">线下陪玩</text>
          </view>
        </view>
        <view class="offline-warning" v-if="formData.serviceType === 'offline'">
          <text class="warning-icon">⚠️</text>
          <text class="warning-text">线下陪玩需要双方确认服务地点，请注意安全</text>
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">选择游戏</view>
        <view class="game-options">
          <view
            class="game-item"
            :class="{ active: formData.game === game.name }"
            v-for="game in currentGames"
            :key="game.name"
            @click="formData.game = game.name"
          >
            <text class="game-icon">{{ game.icon }}</text>
            <text class="game-name">{{ game.name }}</text>
          </view>
        </view>
      </view>

      <view class="form-section" v-if="formData.serviceType === 'offline'">
        <view class="section-title">选择服务地点</view>
        <view class="offline-location">
          <view class="location-header">
            <text class="location-icon">📍</text>
            <text class="location-title">服务地点</text>
          </view>
          <view class="location-actions">
            <button class="location-btn locate-btn" @click="getCurrentLocation">
              <text class="btn-icon">📍</text>
              <text class="btn-text">{{ locating ? '定位中...' : '定位当前位置' }}</text>
            </button>
          </view>
          <view class="location-detail">
            <view class="detail-label">详细地址</view>
            <view class="detail-input-wrapper" :class="{ active: isCustomLocation }">
              <input
                type="text"
                v-model="customLocation"
                placeholder="输入详细地址..."
                class="detail-input"
                @input="onCustomLocationInput"
                @focus="isCustomLocation = true"
              />
            </view>
          </view>
          <view class="location-summary" v-if="formData.offlineLocation">
            <text class="summary-icon">✓</text>
            <text class="summary-text">{{ formData.offlineLocation }}</text>
            <button class="summary-clear" @click="clearLocation">
              <text class="clear-icon">×</text>
            </button>
          </view>
        </view>
      </view>

      <view class="form-section">
        <view class="section-header">
          <view class="section-title">选择日期</view>
        </view>
        <view class="calendar-container">
          <view class="calendar-nav">
            <button class="nav-arrow" @click="changeMonth(-1)">‹</button>
            <view class="nav-date">{{ currentYear }}年{{ currentMonth + 1 }}月</view>
            <button class="nav-arrow" @click="changeMonth(1)">›</button>
          </view>
          <view class="calendar-header">
            <view class="calendar-weekday" v-for="day in weekDays" :key="day">{{ day }}</view>
          </view>
          <view class="calendar-grid">
            <view
              class="calendar-cell"
              :class="{ active: formData.date === date.value, disabled: date.disabled, other: date.showMonth === false && date.monthLabel === '' }"
              v-for="date in availableDates"
              :key="date.value"
              @click="!date.disabled && (formData.date = date.value)"
            >
              <view class="calendar-day">{{ date.day }}</view>
              <view class="calendar-month" v-if="date.showMonth">{{ date.monthLabel }}</view>
            </view>
          </view>
        </view>
      </view>

      <view class="form-section">
        <view class="section-header">
          <view class="section-title">选择时间</view>
        </view>
        <view class="time-wheel-picker">
          <view class="wheel-column">
            <view class="wheel-label">开始时间</view>
            <view
              class="wheel-container"
              ref="startWheelRef"
              @touchstart="onWheelTouchStart($event, 'start')"
              @touchmove="onWheelTouchMove($event, 'start')"
              @touchend="onWheelTouchEnd($event, 'start')"
              @mousedown="onWheelMouseDown($event, 'start')"
            >
              <view class="wheel-scroll" :style="{ transform: `translateY(${startWheelOffset}px)` }">
                <view class="wheel-item empty"></view>
                <view
                  class="wheel-item"
                  v-for="(time, index) in timeSlots"
                  :key="'start-' + time"
                  :class="{
                    disabled: !isTimeAvailable(time),
                    selected: formData.startTime === time
                  }"
                  @click="selectStartTime(time)"
                >
                  {{ time }}
                </view>
                <view class="wheel-item empty"></view>
              </view>
              <view class="wheel-indicator"></view>
            </view>
          </view>

          <view class="wheel-separator">
            <text class="separator-line"></text>
            <text class="separator-text">至</text>
            <text class="separator-line"></text>
          </view>

          <view class="wheel-column">
            <view class="wheel-label">结束时间</view>
            <view
              class="wheel-container"
              ref="endWheelRef"
              @touchstart="onWheelTouchStart($event, 'end')"
              @touchmove="onWheelTouchMove($event, 'end')"
              @touchend="onWheelTouchEnd($event, 'end')"
              @mousedown="onWheelMouseDown($event, 'end')"
            >
              <view class="wheel-scroll" :style="{ transform: `translateY(${endWheelOffset}px)` }">
                <view class="wheel-item empty"></view>
                <view
                  class="wheel-item"
                  v-for="(time, index) in timeSlots"
                  :key="'end-' + time"
                  :class="{
                    disabled: !isEndTimeAvailable(time),
                    selected: formData.endTime === time
                  }"
                  @click="selectEndTime(time)"
                >
                  {{ time }}
                </view>
                <view class="wheel-item empty"></view>
              </view>
              <view class="wheel-indicator"></view>
            </view>
          </view>
        </view>

        <view class="time-summary" v-if="formData.startTime && formData.endTime">
          <text class="summary-icon">⏱️</text>
          <text class="summary-text">
            已选择 {{ formData.startTime }} - {{ formData.endTime }}，
            共 {{ calculatedDuration }} 小时
          </text>
        </view>
      </view>

      <view class="form-section">
        <view class="section-header">
          <view class="section-title">服务时长</view>
          <view class="section-subtitle">可自定义时长和预算</view>
        </view>
        <view class="custom-row">
          <view class="custom-field">
            <label class="field-label">服务时长</label>
            <view class="input-wrapper">
              <input
                type="number"
                class="custom-input"
                v-model.number="customDuration"
                placeholder="2"
                min="0.5"
                max="12"
                step="0.5"
                @input="onCustomDurationInput"
              />
              <text class="input-suffix">小时</text>
            </view>
          </view>
          <view class="custom-divider"></view>
          <view class="custom-field">
            <label class="field-label">预算金额</label>
            <view class="input-wrapper price-input-wrapper">
              <text class="input-prefix">¥</text>
              <input
                type="number"
                class="custom-input"
                v-model.number="customPrice"
                placeholder="100"
                min="1"
                max="9999"
                @input="onCustomPriceInput"
              />
            </view>
          </view>
        </view>
        <view class="budget-hint">
          <text class="hint-icon">💡</text>
          <text class="hint-text">建议：线上陪玩约50金币/小时，线下陪玩约125金币/小时</text>
        </view>
      </view>

      <view class="form-section">
        <view class="section-header">
          <view class="section-title">备注信息</view>
          <view class="section-subtitle">选填，最多200字</view>
        </view>
        <textarea
          class="remark-input"
          v-model="formData.remark"
          placeholder="请输入备注信息，如：需要女生、声音好听、技术好等..."
          maxlength="200"
        ></textarea>
        <view class="remark-counter">{{ formData.remark.length }}/200</view>
      </view>

      <view class="footer">
        <view class="terms-checkbox" v-if="formData.serviceType === 'offline'">
          <label class="checkbox-label">
            <input type="checkbox" v-model="agreeTerms" />
            <text class="checkbox-check"></text>
            <text class="checkbox-text">我已阅读并同意<a href="#" class="terms-link" @click.prevent="showTerms">服务条款</a>和<a href="#" class="terms-link" @click.prevent="showPrivacy">隐私政策</a></text>
          </label>
        </view>
        <view class="footer-content">
          <view class="price-info">
            <text class="price-label">预算金额</text>
            <text class="price-value">¥{{ totalPrice }}</text>
          </view>
          <button class="submit-btn" :disabled="!canSubmit || submitting" @click="submitDemand">
            <text v-if="submitting" class="loading-icon">⏳</text>
            {{ submitting ? '发布中...' : '发布需求' }}
          </button>
        </view>
      </view>
    </view>
  </PageLayout>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from '@/common/route'
import { demandService } from '@/services/demandService'
import PageLayout from '../components/PageLayout.vue'
import { toast } from '../composables/useToast'
import { isApp, isH5 } from '../common/platform'

const router = useRouter()

const onlineGames = [
  { name: '王者荣耀', icon: '🎮' },
  { name: '和平精英', icon: '🔫' },
  { name: '英雄联盟', icon: '⚔️' },
  { name: '永劫无间', icon: '🗡️' },
  { name: '原神', icon: '✨' },
  { name: '云顶之弈', icon: '♟️' },
  { name: '穿越火线', icon: '🔫' },
  { name: 'CS2', icon: '🎯' }
]

const offlineGames = [
  { name: '狼人杀', icon: '🐺' },
  { name: '剧本杀', icon: '🎭' },
  { name: '棋牌', icon: '🀄' },
  { name: '桌游', icon: '🎲' },
  { name: '密室逃脱', icon: '🔐' },
  { name: '真人CS', icon: '🎖️' }
]

const currentGames = computed(() => {
  return formData.serviceType === 'offline' ? offlineGames : onlineGames
})

const timeSlots = [
  '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00',
  '17:00', '18:00', '19:00', '20:00',
  '21:00', '22:00', '23:00'
]

const WHEEL_ITEM_HEIGHT = 44

const formData = reactive({
  serviceType: 'online',
  game: '王者荣耀',
  date: '',
  startTime: '',
  endTime: '',
  offlineLocation: '',
  budget: null,
  remark: ''
})

const customLocation = ref('')
const isCustomLocation = ref(false)
const locating = ref(false)
const agreeTerms = ref(false)

const customDuration = ref(null)
const customPrice = ref(null)
const isCustomDuration = ref(false)
const isCustomPrice = ref(false)

const startWheelRef = ref(null)
const endWheelRef = ref(null)
const startWheelOffset = ref(0)
const endWheelOffset = ref(0)
const startTouchState = ref({ startY: 0, startOffset: 0 })
const endTouchState = ref({ startY: 0, startOffset: 0 })
const isScrolling = ref({ start: false, end: false })
const isDragging = ref(false)
const dragType = ref(null)

const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const monthLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth())

const changeMonth = (delta) => {
  currentMonth.value += delta
  if (currentMonth.value > 11) {
    currentMonth.value = 0
    currentYear.value++
  } else if (currentMonth.value < 0) {
    currentMonth.value = 11
    currentYear.value--
  }
  generateDates()
}

const generateDates = () => {
  const dates = []
  const year = currentYear.value
  const month = currentMonth.value
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startDayOfWeek = firstDay.getDay()
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  const todayStr = new Date().toISOString().split('T')[0]
  let lastMonthLabel = -1
  for (let i = 0; i < startDayOfWeek; i++) {
    const day = prevMonthLastDay - startDayOfWeek + 1 + i
    const date = new Date(year, month - 1, day)
    dates.push({
      value: date.toISOString().split('T')[0],
      day: day,
      week: weekDays[date.getDay()],
      disabled: true,
      showMonth: false,
      monthLabel: ''
    })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    const dateStr = date.toISOString().split('T')[0]
    dates.push({
      value: dateStr,
      day: d,
      week: weekDays[date.getDay()],
      disabled: dateStr < todayStr,
      showMonth: month !== lastMonthLabel,
      monthLabel: monthLabels[month]
    })
    lastMonthLabel = month
  }
  if (dates.length < 42) {
    const remaining = 42 - dates.length
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i)
      dates.push({
        value: date.toISOString().split('T')[0],
        day: i,
        week: weekDays[date.getDay()],
        disabled: true,
        showMonth: false,
        monthLabel: ''
      })
    }
  }
  return dates
}

const calendarStartOffset = computed(() => {
  if (availableDates.value.length === 0) return 0
  const firstDate = new Date(availableDates.value[0].value)
  return firstDate.getDay()
})

const availableDates = ref(generateDates())

const calculatedDuration = computed(() => {
  if (!formData.startTime || !formData.endTime) return 0
  const startIndex = timeSlots.indexOf(formData.startTime)
  const endIndex = timeSlots.indexOf(formData.endTime)
  if (startIndex < 0 || endIndex < 0 || endIndex <= startIndex) return 0
  return endIndex - startIndex
})

const totalPrice = computed(() => {
  if (customPrice.value && customPrice.value > 0) {
    return customPrice.value
  }
  if (calculatedDuration.value > 0) {
    const basePrice = calculatedDuration.value * 50
    return formData.serviceType === 'online' ? basePrice : Math.floor(basePrice * 2.5)
  }
  return formData.budget || 0
})

const timeToIndex = (time) => {
  return timeSlots.indexOf(time)
}

const indexToTime = (index) => {
  if (index < 0 || index >= timeSlots.length) return ''
  return timeSlots[index]
}

const snapToItem = (offset, type) => {
  const index = Math.round(-offset / WHEEL_ITEM_HEIGHT)
  const clampedIndex = Math.max(0, Math.min(timeSlots.length - 1, index))
  const snappedOffset = -clampedIndex * WHEEL_ITEM_HEIGHT

  if (type === 'start') {
    startWheelOffset.value = snappedOffset
    formData.startTime = indexToTime(clampedIndex)
  } else {
    endWheelOffset.value = snappedOffset
    formData.endTime = indexToTime(clampedIndex)
  }
}

const onWheelTouchStart = (event, type) => {
  const touch = event.touches[0]
  event.preventDefault()

  if (type === 'start') {
    startTouchState.value = { startY: touch.clientY, startOffset: startWheelOffset.value }
    isScrolling.value.start = true
  } else {
    endTouchState.value = { startY: touch.clientY, startOffset: endWheelOffset.value }
    isScrolling.value.end = true
  }
}

const onWheelTouchMove = (event, type) => {
  const touch = event.touches[0]
  event.preventDefault()

  const deltaY = touch.clientY - (type === 'start' ? startTouchState.value.startY : endTouchState.value.startY)
  const startOffset = type === 'start' ? startTouchState.value.startOffset : endTouchState.value.startOffset
  const newOffset = startOffset + deltaY

  const maxOffset = 0
  const minOffset = -(timeSlots.length - 1) * WHEEL_ITEM_HEIGHT
  const clampedOffset = Math.max(minOffset, Math.min(maxOffset, newOffset))

  if (type === 'start') {
    startWheelOffset.value = clampedOffset
  } else {
    endWheelOffset.value = clampedOffset
  }
}

const onWheelTouchEnd = (event, type) => {
  event.preventDefault()
  isScrolling.value[type] = false

  const currentOffset = type === 'start' ? startWheelOffset.value : endWheelOffset.value
  snapToItem(currentOffset, type)
}

const onWheelMouseDown = (event, type) => {
  // PC 鼠标拖拽是 H5 专属交互：App 端不注册 DOM 监听，触摸拖动仍走 touch 分支
  if (!isH5) return
  event.preventDefault()
  isDragging.value = true
  dragType.value = type

  if (type === 'start') {
    startTouchState.value = { startY: event.clientY, startOffset: startWheelOffset.value }
  } else {
    endTouchState.value = { startY: event.clientY, startOffset: endWheelOffset.value }
  }

  document.addEventListener('mousemove', onWheelMouseMove)
  document.addEventListener('mouseup', onWheelMouseUp)
}

const onWheelMouseMove = (event) => {
  if (!isDragging.value || !dragType.value) return

  const deltaY = event.clientY - (dragType.value === 'start' ? startTouchState.value.startY : endTouchState.value.startY)
  const startOffset = dragType.value === 'start' ? startTouchState.value.startOffset : endTouchState.value.startOffset
  const newOffset = startOffset + deltaY

  const maxOffset = 0
  const minOffset = -(timeSlots.length - 1) * WHEEL_ITEM_HEIGHT
  const clampedOffset = Math.max(minOffset, Math.min(maxOffset, newOffset))

  if (dragType.value === 'start') {
    startWheelOffset.value = clampedOffset
  } else {
    endWheelOffset.value = clampedOffset
  }
}

const onWheelMouseUp = (event) => {
  if (!isDragging.value || !dragType.value) return

  event.preventDefault()
  isDragging.value = false

  const currentOffset = dragType.value === 'start' ? startWheelOffset.value : endWheelOffset.value
  snapToItem(currentOffset, dragType.value)
  dragType.value = null

  // App 端没有注册 mousemove/mouseup，触摸分支不需要退订 DOM 监听
  if (isH5) {
    document.removeEventListener('mousemove', onWheelMouseMove)
    document.removeEventListener('mouseup', onWheelMouseUp)
  }
}

const isTimeAvailable = (time) => {
  if (!formData.date) return true
  // 仅当天需要排除已过去的时间点，其它日期全部可选
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  if (formData.date === todayStr) {
    const [h, m] = time.split(':').map(Number)
    const slot = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m)
    return slot.getTime() > now.getTime()
  }
  return true
}

const isEndTimeAvailable = (time) => {
  if (!formData.startTime) return true
  const startIndex = timeToIndex(formData.startTime)
  const endIndex = timeToIndex(time)
  if (endIndex <= startIndex) return false
  for (let i = startIndex + 1; i <= endIndex; i++) {
    if (!isTimeAvailable(timeSlots[i])) return false
  }
  return true
}

const selectStartTime = (time) => {
  if (!isTimeAvailable(time)) return
  const index = timeToIndex(time)
  startWheelOffset.value = -index * WHEEL_ITEM_HEIGHT
  formData.startTime = time
}

const selectEndTime = (time) => {
  if (!isEndTimeAvailable(time)) return
  const index = timeToIndex(time)
  endWheelOffset.value = -index * WHEEL_ITEM_HEIGHT
  formData.endTime = time
}

watch(() => formData.startTime, (newVal) => {
  if (newVal && formData.endTime) {
    const startIndex = timeToIndex(newVal)
    const endIndex = timeToIndex(formData.endTime)
    if (endIndex <= startIndex) {
      const newEndIndex = startIndex + 1
      if (newEndIndex < timeSlots.length) {
        selectEndTime(timeSlots[newEndIndex])
      }
    }
  }
})

const onCustomDurationInput = () => {
  if (customDuration.value && customDuration.value > 0) {
    isCustomDuration.value = true
    if (!isCustomPrice.value) {
      const basePrice = Math.floor(customDuration.value * 50)
      formData.budget = formData.serviceType === 'online' ? basePrice : Math.floor(basePrice * 2.5)
    }
  }
}

const onCustomPriceInput = () => {
  if (customPrice.value && customPrice.value > 0) {
    isCustomPrice.value = true
    formData.budget = customPrice.value
  }
}

watch(() => formData.serviceType, () => {
  if (isCustomDuration.value && !isCustomPrice.value) {
    const basePrice = Math.floor(formData.duration * 50)
    formData.budget = formData.serviceType === 'online' ? basePrice : Math.floor(basePrice * 2.5)
  }
})

// uni.getLocation 是回调式 API：Promise 化并把用户拒绝授权收口成 reject，不产生未捕获异常
const getUniLocation = () => new Promise((resolve, reject) => {
  if (typeof uni === 'undefined' || typeof uni.getLocation !== 'function') {
    reject(new Error('not_supported'))
    return
  }
  try {
    uni.getLocation({
      type: 'gcj02',
      success: (res) => resolve(res || {}),
      fail: (err) => reject(new Error((err && err.errMsg) || '定位失败'))
    })
  } catch (e) {
    reject(e)
  }
})

const locateByApp = async () => {
  locating.value = true
  try {
    const { latitude, longitude } = await getUniLocation()
    formData.offlineLocation = `当前位置 (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
    isCustomLocation.value = false
    customLocation.value = ''
  } catch (error) {
    const message = String((error && error.message) || '')
    if (message === 'not_supported') {
      toast.error('当前环境不支持定位功能')
    } else if (/deny|denied|auth|拒绝/i.test(message)) {
      toast.error('定位权限被拒绝，请在系统设置中开启定位权限')
    } else if (/timeout|超时/i.test(message)) {
      toast.error('定位请求超时')
    } else {
      toast.error('定位失败')
    }
  } finally {
    locating.value = false
  }
}

const getCurrentLocation = () => {
  // App 原生端没有 navigator.geolocation，走 uni 定位；H5 保持浏览器定位逻辑
  if (isApp) {
    locateByApp()
    return
  }

  if (!navigator.geolocation) {
    toast.error('您的浏览器不支持定位功能')
    return
  }

  locating.value = true

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords
      formData.offlineLocation = `当前位置 (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
      isCustomLocation.value = false
      customLocation.value = ''
      locating.value = false
    },
    (error) => {
      console.error('定位失败:', error)
      locating.value = false
      let errorMsg = '定位失败'
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMsg = '定位权限被拒绝'
          break
        case error.POSITION_UNAVAILABLE:
          errorMsg = '位置信息不可用'
          break
        case error.TIMEOUT:
          errorMsg = '定位请求超时'
          break
      }
      toast.error(errorMsg)
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }
  )
}

const onCustomLocationInput = () => {
  if (customLocation.value && customLocation.value.trim()) {
    isCustomLocation.value = true
    formData.offlineLocation = customLocation.value.trim()
  } else {
    isCustomLocation.value = false
    formData.offlineLocation = ''
  }
}

const clearLocation = () => {
  formData.offlineLocation = ''
  customLocation.value = ''
  isCustomLocation.value = false
}

const canSubmit = computed(() => {
  const hasServiceType = !!formData.serviceType
  const hasGame = !!formData.game
  const hasDate = !!formData.date
  const hasStartTime = !!formData.startTime && isTimeAvailable(formData.startTime)
  const hasEndTime = !!formData.endTime && isEndTimeAvailable(formData.endTime)
  const hasValidDuration = calculatedDuration.value > 0
  const hasBudget = totalPrice.value && totalPrice.value > 0
  const hasLocation = formData.serviceType === 'offline' ? !!formData.offlineLocation : true
  const hasAgreedTerms = formData.serviceType === 'offline' ? agreeTerms.value : true
  return hasServiceType && hasGame && hasDate && hasStartTime && hasEndTime && hasValidDuration && hasBudget && hasLocation && hasAgreedTerms
})

const goBack = () => {
  router.back()
}

const showTerms = () => {
  toast.info('服务条款：\n1. 用户需遵守平台规则\n2. 禁止违法违规行为\n3. 保护个人隐私信息')
}

const showPrivacy = () => {
  toast.info('隐私政策：\n1. 我们保护您的个人信息\n2. 不会泄露给第三方\n3. 仅用于服务匹配')
}

const submitting = ref(false)

const submitDemand = async () => {
  if (!canSubmit.value || submitting.value) return

  submitting.value = true

  const demandData = {
    serviceType: formData.serviceType,
    game: formData.game,
    date: formData.date,
    startTime: formData.startTime,
    endTime: formData.endTime,
    duration: calculatedDuration.value,
    budget: totalPrice.value,
    remark: formData.remark,
    offlineLocation: formData.serviceType === 'offline' ? formData.offlineLocation : ''
  }

  if (import.meta.env.DEV) console.log('发布需求:', demandData)

  try {
    const result = await demandService.createDemand(demandData)
    
    if (result.code === 0) {
      toast.success('需求发布成功！')
      router.back()
    } else {
      toast.error(result.message || '发布失败，请重试')
    }
  } catch (error) {
    console.error('发布需求异常:', error)
    toast.error('发布失败，请重试')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  const defaultStartIndex = 0
  const defaultEndIndex = 2
  startWheelOffset.value = -defaultStartIndex * WHEEL_ITEM_HEIGHT
  endWheelOffset.value = -defaultEndIndex * WHEEL_ITEM_HEIGHT
  formData.startTime = timeSlots[defaultStartIndex]
  formData.endTime = timeSlots[defaultEndIndex]

  if (availableDates.value.length > 0) {
    formData.date = availableDates.value[0].value
  }
})
</script>

<style scoped>
.back-btn {
  font-size: 24px;
  color: white;
  cursor: pointer;
  padding: 8px;
  margin: -8px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.back-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.back-btn:active {
  background-color: rgba(255, 255, 255, 0.3);
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: white;
}

.placeholder {
  width: 40px;
}

.content {
  padding: 16px;
  padding-top: 12px;
  padding-bottom: 40px;
}

.form-section {
  background: white;
  border-radius: 0px;
  padding: 20px;
  margin: 12px 0 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  font-size: 12px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-subtitle {
  font-size: 12px;
  color: #999;
}

.type-options {
  display: flex;
  gap: 12px;
}

.type-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: #f8f8f8;
  border-radius: 12px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.type-item.active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  border-color: var(--color-primary);
}

.type-icon {
  font-size: 28px;
}

.type-name {
  font-size: 14px;
  color: #333;
}

.type-badge {
  font-size: 10px;
  background: #52c41a;
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  margin-top: 4px;
}

.offline-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 12px;
  background: #fffbe6;
  border-radius: 8px;
  border: 1px solid #ffe58f;
}

.warning-icon {
  font-size: 16px;
}

.warning-text {
  font-size: 13px;
  color: #faad14;
}

.game-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.game-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  background: #ffffff;
  border-radius: 12px;
  border: 2px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.25s ease;
  min-width: calc(25% - 12px);
  flex: 1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.game-item:hover {
  border-color: #e0e0ff;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
  transform: translateY(-2px);
}

.game-item.active {
  background: var(--gradient-primary);
  color: white;
  border-color: var(--color-primary);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.35);
  transform: translateY(-2px);
}

.game-icon {
  font-size: 28px;
}

.game-name {
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  color: #444;
}

.game-item.active .game-name {
  color: white;
}

.offline-location {
  padding: 16px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e8f5e9;
  box-shadow: 0 2px 12px rgba(82, 196, 26, 0.08);
}

.location-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.location-icon {
  font-size: 20px;
}

.location-title {
  font-size: 15px;
  font-weight: 600;
  color: #2e7d32;
}

.location-actions {
  margin-bottom: 16px;
}

.location-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 14px 20px;
  background: linear-gradient(135deg, #c8e6c9, #a5d6a7);
  border: none;
  border-radius: 12px;
  font-size: 14px;
  color: #2e7d32;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.2);
}

.location-btn:hover {
  background: linear-gradient(135deg, #81c784, #66bb6a);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(82, 196, 26, 0.3);
}

.location-detail {
  margin-bottom: 14px;
}

.detail-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 10px;
  font-weight: 500;
}

.detail-input-wrapper {
  position: relative;
}

.detail-input {
  width: 100%;
  padding: 14px 16px;
  background: #fafafa;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 14px;
  color: #333;
  outline: none;
  transition: all 0.25s ease;
  box-sizing: border-box;
}

.detail-input:focus {
  border-color: #52c41a;
  box-shadow: 0 0 0 4px rgba(82, 196, 26, 0.12);
  background: white;
}

.detail-input-wrapper.active .detail-input {
  border-color: #52c41a;
  background: #f6ffed;
}

.location-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(82, 196, 26, 0.1), rgba(76, 175, 80, 0.08));
  border-radius: 12px;
  margin-top: 12px;
  border: 1px solid rgba(82, 196, 26, 0.2);
}

.location-summary .summary-icon {
  font-size: 16px;
  color: #43a047;
  flex-shrink: 0;
}

.location-summary .summary-text {
  font-size: 14px;
  color: #2e7d32;
  font-weight: 500;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: rgba(244, 67, 54, 0.1);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.summary-clear:hover {
  background: rgba(244, 67, 54, 0.2);
  transform: scale(1.1);
}

.clear-icon {
  font-size: 18px;
  color: #ef5350;
  font-weight: bold;
  line-height: 1;
}

.calendar-container {
  background: #ffffff;
  border-radius: 0px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #f0f0f0;
}

.calendar-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 0;
  border-bottom: 1px solid #f0f0f0;
  height: 50px;
}

.nav-arrow {
  width: 36px;
  height: 36px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  font-size: 20px;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.nav-arrow:hover {
  background: var(--color-primary);
  color: #fff;
}

.nav-date {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.calendar-weekday {
  text-align: center;
  font-size: 12px;
  color: #999;
  font-weight: 500;
  padding: 8px 0;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.calendar-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 5px;
  background: #f8f8f8;
  border-radius: 10px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  width: 50px;
  height: 50px;
}

.calendar-cell.other {
  background: transparent;
  color: #ccc;
  cursor: default;
}

.calendar-cell.other .calendar-day {
  color: #ccc;
}

.calendar-cell:not(.other):hover {
  border-color: var(--color-primary);
  background: #f0f0ff;
}

.calendar-cell.active {
  background: var(--gradient-primary);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.calendar-cell.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.calendar-day {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.calendar-cell.active .calendar-day {
  color: white;
}

.calendar-month {
  font-size: 10px;
  color: #999;
  margin-top: 2px;
}

.calendar-cell.active .calendar-month {
  color: rgba(255, 255, 255, 0.8);
}

.time-wheel-picker {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #ffffff;
  border-radius: 0px;
  height: 180px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #f0f0f0;
}

.wheel-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.wheel-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 10px;
  font-weight: 500;
}

.wheel-container {
  position: relative;
  width: 100%;
  height: 132px;
  overflow: hidden;
  border-radius: 12px;
  background: #fafafa;
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
}

.wheel-container::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 44px;
  transform: translateY(-50%);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  border-top: 1px solid rgba(102, 126, 234, 0.2);
  border-bottom: 1px solid rgba(102, 126, 234, 0.2);
  pointer-events: none;
}

.wheel-scroll {
  transition: transform 0.1s ease-out;
}

.wheel-item {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.wheel-item.empty {
  cursor: default;
}

.wheel-item:hover:not(.empty) {
  color: var(--color-primary);
  font-weight: 500;
}

.wheel-item.selected {
  font-size: 19px;
  font-weight: 700;
  color: var(--color-primary);
  text-shadow: 0 0 10px rgba(102, 126, 234, 0.3);
}

.wheel-item.disabled {
  opacity: 0.35;
  cursor: not-allowed;
  pointer-events: none;
}

.wheel-indicator {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 44px;
  margin-top: -22px;
  pointer-events: none;
  border-top: 1px solid var(--color-primary);
  border-bottom: 1px solid var(--color-primary);
  background: rgba(102, 126, 234, 0.05);
}

.wheel-separator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 0 4px;
}

.separator-line {
  width: 20px;
  height: 1px;
  background: #ddd;
}

.separator-text {
  font-size: 14px;
  color: #999;
  padding: 8px 0;
}

.time-summary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
  padding: 12px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08), rgba(118, 75, 162, 0.08));
  border-radius: 10px;
}

.time-summary .summary-icon {
  font-size: 16px;
}

.time-summary .summary-text {
  font-size: 14px;
  color: var(--color-primary);
  font-weight: 500;
}

.custom-row {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fc 0%, #f0f2f8 100%);
  border-radius: 16px;
  border: 2px solid #e8eaf0;
}

.custom-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.custom-divider {
  width: 1px;
  height: 40px;
  background: #e0e0e0;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  padding: 0 12px;
  transition: all 0.2s;
}

.input-wrapper:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.price-input-wrapper {
  justify-content: flex-start;
}

.input-prefix {
  font-size: 14px;
  color: #666;
  margin-right: 4px;
}

.input-suffix {
  font-size: 13px;
  color: #999;
  margin-left: 4px;
}

.custom-input {
  flex: 1;
  height: 42px;
  background: transparent;
  border: none;
  font-size: 15px;
  padding: 0;
  outline: none;
  text-align: center;
}

.custom-input::placeholder {
  color: #ccc;
}

.custom-input:focus {
  background: rgba(102, 126, 234, 0.05);
  border-radius: 8px;
}

.budget-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 10px 12px;
  background: #f0f7ff;
  border-radius: 8px;
}

.hint-icon {
  font-size: 14px;
}

.hint-text {
  font-size: 12px;
  color: #666;
}

.remark-input {
  width: 100%;
  height: 100px;
  padding: 16px;
  background: #fafafa;
  border: 2px solid #f0f0f0;
  border-radius: 14px;
  font-size: 15px;
  resize: none;
  box-sizing: border-box;
  transition: all 0.25s;
  outline: none;
  line-height: 1.5;
}

.remark-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.12);
  background: white;
}

.remark-input::placeholder {
  color: #ccc;
}

.remark-counter {
  text-align: right;
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.footer {
  height: 80px;
  padding: 20px;
  padding-bottom: calc(20px + env(safe-area-inset-bottom, 0) + 80px);
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border-radius: 0px;
  margin-top: 20px;
}

.terms-checkbox {
  margin-bottom: 12px;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.checkbox-label input[type="checkbox"] {
  display: none;
}

.checkbox-check {
  width: 16px;
  height: 16px;
  border: 2px solid #ddd;
  border-radius: 4px;
  flex-shrink: 0;
  transition: all 0.2s;
  position: relative;
  top: 2px;
}

.checkbox-label input[type="checkbox"]:checked + .checkbox-check {
  background: var(--gradient-primary);
  border-color: var(--color-primary);
}

.checkbox-label input[type="checkbox"]:checked + .checkbox-check::after {
  content: '✓';
  position: absolute;
  top: -2px;
  left: 2px;
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.checkbox-label:has(input:focus) .checkbox-check {
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3);
}

.checkbox-text {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.terms-link {
  color: var(--color-primary);
  text-decoration: underline;
}

.terms-link:hover {
  color: var(--color-primary-end);
}

.terms-link:hover {
  color: var(--color-primary-end);
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 470px;
  height: 70px;
  font-size: 15px;
}

.price-info {
  display: flex;
  flex-direction: column;
  padding: 10px;
  background: linear-gradient(135deg, #fff5f5 0%, #ffeaea 100%);
  border-radius: 12px;
  border: 1px solid #ffe0e0;
  width: 90px;
  height: 70px;
}

.price-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.price-value {
  font-size: 24px;
  font-weight: bold;
  color: #e74c3c;
}

.submit-btn {
  padding: 16px 48px;
  background: var(--gradient-primary);
  background-color: var(--tw-ring-color);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
}

.submit-btn:disabled {
  background: #e0e0e0;
  cursor: not-allowed;
  box-shadow: none;
}

.submit-btn:not(:disabled):hover {
  transform: scale(1.02);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.submit-btn:not(:disabled):active {
  transform: scale(0.98);
}

.loading-icon {
  margin-right: 8px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media screen and (max-width: 375px) {
  .header {
    padding: 10px 12px;
  }

  .content {
    padding: 12px;
    padding-top: 12px;
    padding-bottom: 100px;
  }

  .form-section {
    padding: 14px;
    border-radius: 0px;
  }

  .type-item {
    padding: 12px;
  }

  .game-item {
    padding: 10px 12px;
    min-width: calc(25% - 10px);
  }

  .calendar-cell {
    padding: 8px 4px;
    min-height: 46px;
  }

  .wheel-container {
    height: 160px;
  }

  .submit-btn {
    padding: 12px 28px;
    font-size: 15px;
  }

  .price-value {
    font-size: 20px;
  }
}

@media screen and (min-width: 768px) {
  .content {
    max-width: 650px;
    margin: 0 auto;
    padding-bottom: 40px;
  }

  .header {
    max-width: 650px;
    left: 50%;
    transform: translateX(-50%);
  }

  .footer {
    max-width: 650px;
    margin: 20px auto;
    border-radius: 20px;
  }

  .publish-demand-page {
    padding-bottom: 40px;
  }
}

@media screen and (min-width: 1024px) {
  .content {
    max-width: 720px;
  }

  .header {
    max-width: 720px;
  }

  .footer {
    max-width: 720px;
  }
}
</style>
