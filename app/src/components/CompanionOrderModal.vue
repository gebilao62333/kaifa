<template>
  <view class="order-modal-overlay" v-if="visible" @click.self="close">
    <view class="order-modal">
      <view class="modal-header">
        <text class="modal-title">向 {{ companion.name || '陪玩师' }} 下单</text>
        <text class="modal-close" @click="close">✕</text>
      </view>
      <view class="modal-body">
        <view class="form-item">
          <label class="form-label">游戏</label>
          <select class="form-select" v-model.number="gameId">
            <option v-for="g in categories" :key="g.id" :value="g.id">{{ g.name }}</option>
          </select>
        </view>
        <view class="form-item">
          <label class="form-label">单数</label>
          <view class="num-row">
            <button class="num-btn" :disabled="num <= 1" @click="num--">−</button>
            <text class="num-value">{{ num }}</text>
            <button class="num-btn" :disabled="num >= 10" @click="num++">＋</button>
          </view>
        </view>
        <view class="price-summary">
          <text>单价：{{ unitPrice ? unitPrice + ' 金币' : '按陪玩师定价' }}</text>
          <text v-if="unitPrice">合计：{{ unitPrice * num }} 金币</text>
        </view>
        <view class="tip">下单即从余额扣款；陪玩师接单前可在「我的订单」取消</view>
      </view>
      <view class="modal-footer">
        <button class="btn-cancel" @click="close">取消</button>
        <button class="btn-submit" :disabled="submitting || !gameId" @click="submit">
          {{ submitting ? '提交中...' : '确认下单' }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import gamesService from '../services/gamesService'
import { toast } from '../composables/useToast'

const props = defineProps({
  visible: Boolean,
  companion: {
    type: Object,
    default: () => ({ id: 0, name: '', gameId: 0, price: 0 })
  }
})
const emit = defineEmits(['close', 'submitted'])

const categories = ref([])
const gameId = ref(0)
const num = ref(1)
const submitting = ref(false)

const unitPrice = computed(() => Number(props.companion.price) || 0)

const loadCategories = async () => {
  try {
    const res = await gamesService.getCategories()
    const data = res && res.data !== undefined ? res.data : res
    const list = Array.isArray(data) ? data : (data && Array.isArray(data.list) ? data.list : [])
    categories.value = list
      .map(item => ({ id: Number(item.gameId || item.id), name: item.name || '' }))
      .filter(item => item.id)
    if (!gameId.value) gameId.value = Number(props.companion.gameId) || categories.value[0]?.id || 0
  } catch (error) {
    console.error('加载游戏分类失败:', error)
    categories.value = []
  }
}

watch(() => props.visible, (visible) => {
  if (!visible) return
  num.value = 1
  gameId.value = Number(props.companion.gameId) || 0
  loadCategories()
}, { immediate: true })

watch(() => props.companion.gameId, (value) => {
  if (value) gameId.value = Number(value)
})

const close = () => {
  if (!submitting.value) emit('close')
}

const submit = async () => {
  if (!gameId.value || submitting.value) return
  submitting.value = true
  try {
    const res = await gamesService.pushOrder({
      targetUserId: Number(props.companion.id),
      gameId: gameId.value,
      num: num.value
    })
    const data = res && res.data !== undefined ? res.data : res
    toast.success('下单成功，等待陪玩师接单')
    emit('submitted', data || {})
    emit('close')
  } catch (error) {
    toast.error(error.message || '下单失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.order-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
}
.order-modal {
  width: 100%;
  max-width: 480px;
  background: #fff;
  border-radius: 18px 18px 0 0;
  padding: 18px 20px 24px;
  box-sizing: border-box;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.modal-title {
  font-size: 17px;
  font-weight: 600;
  color: #222;
}
.modal-close {
  font-size: 18px;
  color: #999;
  cursor: pointer;
}
.form-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.form-label {
  color: #666;
  font-size: 14px;
}
.form-select {
  min-width: 180px;
  height: 38px;
  padding: 0 10px;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  background: #fafafa;
  font-size: 14px;
}
.num-row {
  display: flex;
  align-items: center;
  gap: 14px;
}
.num-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid #e5e5e5;
  background: #fff;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}
.num-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.num-value {
  min-width: 24px;
  text-align: center;
  font-size: 16px;
}
.price-summary {
  display: flex;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f7f8fa;
  color: #333;
  font-size: 14px;
}
.tip {
  margin: 12px 0 0;
  color: #999;
  font-size: 12px;
}
.modal-footer {
  display: flex;
  gap: 12px;
  margin-top: 18px;
}
.btn-cancel,
.btn-submit {
  flex: 1;
  height: 42px;
  border-radius: 21px;
  border: none;
  font-size: 15px;
  cursor: pointer;
}
.btn-cancel {
  background: #f2f3f5;
  color: #555;
}
.btn-submit {
  background: var(--gradient-primary, linear-gradient(135deg, #667eea, #764ba2));
  color: #fff;
}
.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
