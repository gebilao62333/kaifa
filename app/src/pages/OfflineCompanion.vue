<template>
  <view>
    <view class="offline-grid">
      <view 
        class="offline-card" 
        v-for="item in offlineServices" 
        :key="item.serviceId" 
        :class="{ 'offline-card-active': selectedIds.includes(item.serviceId) }"
        @click="handleSelect(item)"
      >
        <view class="offline-icon-wrap" :style="{ background: item.bgColor }">
          <text class="offline-icon">{{ item.icon }}</text>
        </view>
        <view class="offline-info">
          <text class="offline-name">{{ item.name }}</text>
        </view>
        <view v-if="selectedIds.includes(item.id)" class="selected-check">✓</view>
      </view>
    </view>
    <view class="selection-hint" v-if="selectedIds.length > 0">
      已选择 {{ selectedIds.length }} 项服务
    </view>
  </view>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import gamesService from '../services/gamesService'

const emit = defineEmits(['update:modelValue', 'change'])
const props = defineProps({
  modelValue: { type: Array, default: () => [] }
})

const selectedIds = ref([...props.modelValue])

watch(() => props.modelValue, (newVal) => {
  // 只有当值真正不同时才更新，避免递归
  if (JSON.stringify(newVal) !== JSON.stringify(selectedIds.value)) {
    selectedIds.value = [...newVal]
  }
}, { deep: true })

const offlineServices = ref([])

// U-18：目录与真实 gameId 由服务端下发，不再把 201-304 假 id 当 gameId
const loadOfflineServices = async () => {
  try {
    const res = await gamesService.getOfflineServices()
    const data = res?.data || res
    offlineServices.value = (data.list || []).map(item => ({
      ...item,
      id: item.serviceId,
      tags: item.tags || [item.name]
    }))
  } catch (error) {
    console.error('加载线下服务失败:', error)
    offlineServices.value = []
  }
}

onMounted(loadOfflineServices)

const handleSelect = (item) => {
  const index = selectedIds.value.findIndex(id => id === item.serviceId || id === item.id)
  let newSelectedIds
  if (index === -1) {
    newSelectedIds = [...selectedIds.value, item.serviceId || item.id]
  } else {
    newSelectedIds = selectedIds.value.filter(id => id !== (item.serviceId || item.id))
  }
  selectedIds.value = newSelectedIds
  
  // 直接 emit，不通过 watch
  emit('update:modelValue', [...newSelectedIds])
  const selectedItems = offlineServices.value.filter(service => newSelectedIds.includes(service.serviceId || service.id))
  emit('change', selectedItems)
}
</script>

<style scoped>
.offline-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.offline-card {
  background: white;
  border-radius: 0px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  position: relative;
  border: 2px solid transparent;
  width: 140px;
  height: 140px;
}

.offline-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.offline-card-active {
  border-color: var(--color-primary);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
}

.offline-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
  margin-bottom: 10px;
  padding-left: 25px;
  padding-right: 25px;
  padding-top: 0;
  padding-bottom: 0;
  margin-left: 25px;
  margin-right: 25px;
}

.offline-icon {
  font-size: 28px;
  height: 40px;
  width: 40px;
  margin-left: 20px;
  margin-right: 20px;
}

.offline-info {
  margin-bottom: 8px;
}

.offline-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  display: block;
  text-align: center;
  padding-top: 0;
  padding-bottom: 0;
  margin-top: 0;
  margin-bottom: 0;
}

.selected-check {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: var(--gradient-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  font-weight: bold;
}

.selection-hint {
  text-align: center;
  font-size: 13px;
  color: var(--color-primary);
  padding: 12px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 12px;
  margin-bottom: 16px;
}
</style>
