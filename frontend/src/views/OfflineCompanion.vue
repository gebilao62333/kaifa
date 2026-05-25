<template>
  <div>
    <div class="offline-grid">
      <div 
        class="offline-card" 
        v-for="item in offlineServices" 
        :key="item.id" 
        :class="{ 'offline-card-active': selectedIds.includes(item.id) }"
        @click="handleSelect(item)"
      >
        <div class="offline-icon-wrap" :style="{ background: item.bgColor }">
          <span class="offline-icon">{{ item.icon }}</span>
        </div>
        <div class="offline-info">
          <span class="offline-name">{{ item.name }}</span>
        </div>
        <div v-if="selectedIds.includes(item.id)" class="selected-check">✓</div>
      </div>
    </div>
    <div class="selection-hint" v-if="selectedIds.length > 0">
      已选择 {{ selectedIds.length }} 项服务
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

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

const offlineActivities = [
  { id: 201, name: '逛街购物', icon: '🛍️', price: 150, desc: '陪同逛街购物', bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 202, name: '看电影', icon: '🎬', price: 200, desc: '陪同观看电影', bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 203, name: '美食探店', icon: '🍽️', price: 180, desc: '陪同品尝美食', bgColor: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { id: 204, name: '密室逃脱', icon: '🔐', price: 160, desc: '组队密室挑战', bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }
]

const sportsActivities = [
  { id: 301, name: '运动健身', icon: '💪', price: 120, desc: '陪同健身指导', bgColor: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { id: 302, name: '羽毛球', icon: '🏸', price: 100, desc: '双人羽毛球对打', bgColor: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
  { id: 303, name: '跑步陪练', icon: '🏃', price: 80, desc: '户外跑步陪伴', bgColor: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
  { id: 304, name: '篮球', icon: '🏀', price: 150, desc: '组队篮球比赛', bgColor: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' }
]

const offlineServices = computed(() => {
  return [...offlineActivities, ...sportsActivities]
})

const handleSelect = (item) => {
  const index = selectedIds.value.findIndex(id => id === item.id)
  let newSelectedIds
  if (index === -1) {
    newSelectedIds = [...selectedIds.value, item.id]
  } else {
    newSelectedIds = selectedIds.value.filter(id => id !== item.id)
  }
  selectedIds.value = newSelectedIds
  
  // 直接 emit，不通过 watch
  emit('update:modelValue', [...newSelectedIds])
  const selectedItems = offlineServices.value.filter(service => newSelectedIds.includes(service.id))
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
  border-radius: 16px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
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
  border-color: #667eea;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  color: #667eea;
  padding: 12px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 12px;
  margin-bottom: 16px;
}
</style>
