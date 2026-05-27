<template>
  <div class="online-companion-page">
    <div class="header">
      <div class="header-back" @click="goBack">‹</div>
      <div class="title">线上陪玩</div>
    </div>

    <div class="content-container">
      <div class="game-grid">
        <div 
          class="game-card" 
          v-for="game in onlineGames" 
          :key="game.id" 
          :class="{ 'game-card-active': selectedIds.includes(game.id) }"
          @click="handleSelect(game)"
        >
          <div class="game-icon-wrap" :style="{ background: game.bgColor }">
            <span class="game-icon">{{ game.icon }}</span>
          </div>
          <div class="game-info">
            <span class="game-name">{{ game.name }}</span>
          </div>
          <div v-if="selectedIds.includes(game.id)" class="selected-check">✓</div>
        </div>
      </div>
      <div class="selection-hint" v-if="selectedIds.length > 0">
        已选择 {{ selectedIds.length }} 项服务
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const emit = defineEmits(['update:modelValue', 'change'])
const props = defineProps({
  modelValue: { type: Array, default: () => [] }
})

const selectedIds = ref([...props.modelValue])

watch(() => props.modelValue, (newVal) => {
  if (JSON.stringify(newVal) !== JSON.stringify(selectedIds.value)) {
    selectedIds.value = [...newVal]
  }
}, { deep: true })

const onlineGames = [
  { id: 1, name: '王者荣耀', icon: '🎮', price: 50, rating: 4.9, tags: ['打野', 'Carry'], bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 2, name: '和平精英', icon: '🔫', price: 45, rating: 4.8, tags: ['钢枪', '战术'], bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { id: 3, name: '英雄联盟', icon: '⚔️', price: 55, rating: 4.9, tags: ['中单', '上分'], bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 4, name: '永劫无间', icon: '🗡️', price: 48, rating: 4.7, tags: ['太刀', '振刀'], bgColor: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { id: 5, name: '原神', icon: '✨', price: 40, rating: 4.8, tags: ['代肝', '深渊'], bgColor: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { id: 6, name: 'CS2', icon: '🎯', price: 60, rating: 4.9, tags: ['突破', 'AWP'], bgColor: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' }
]

const handleSelect = (game) => {
  const index = selectedIds.value.findIndex(id => id === game.id)
  let newSelectedIds
  if (index === -1) {
    newSelectedIds = [...selectedIds.value, game.id]
  } else {
    newSelectedIds = selectedIds.value.filter(id => id !== game.id)
  }
  selectedIds.value = newSelectedIds
  
  emit('update:modelValue', [...newSelectedIds])
  const selectedItems = onlineGames.filter(service => newSelectedIds.includes(service.id))
  emit('change', selectedItems)
}

const goBack = () => {
  window.history.back()
}
</script>

<style scoped>
.online-companion-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background-color: #f5f5f5;
  padding-top: 70px;
  padding-bottom: 80px;
  padding-bottom: calc(80px + constant(safe-area-inset-bottom, 0px));
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background: -webkit-linear-gradient(315deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 20px;
  height: 70px;
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 650px;
  z-index: 100;
}

.header-back {
  position: absolute;
  left: 20px;
  font-size: 28px;
  color: white;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.title {
  font-size: 20px;
  font-weight: bold;
  color: white;
}

.content-container {
  background: #fff;
  margin: 12px auto;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  max-width: 650px;
  padding: 16px;
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.game-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
  -webkit-transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: relative;
  border: 2px solid transparent;
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}

@media (max-width: 768px) {
  .game-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  
  .game-card {
    padding: 12px 8px;
    border-radius: 12px;
  }
}

@media (max-width: 375px) {
  .game-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
}

.game-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.game-card-active {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
}

.game-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px auto;
  flex-shrink: 0;
}

.game-icon {
  font-size: 28px;
  height: 40px;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .game-icon-wrap {
    width: 48px;
    height: 48px;
    border-radius: 12px;
  }
  
  .game-icon {
    font-size: 24px;
    height: 32px;
    width: 32px;
  }
  
  .game-name {
    font-size: 13px;
  }
}

.game-info {
  margin-bottom: 8px;
}

.game-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  padding-top: 0;
  padding-bottom: 0;
  margin-top: 0;
  margin-bottom: 0;
  display: block;
  text-align: center;
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

/* PC端适配 */
@media (min-width: 768px) {
  .online-companion-page {
    padding-top: 60px;
    padding-bottom: 20px;
    padding-left: 16px;
    padding-right: 16px;
    padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
    max-width: 650px;
    margin: 0 auto;
  }
  
  .content-container {
    margin: 0;
    margin-top: 12px;
    max-width: 650px;
  }
  
  .header {
    max-width: 650px;
    border-radius: 0 0 16px 16px;
    padding: 12px 24px;
    height: 70px;
  }
}

@media (min-width: 1024px) {
  .online-companion-page {
    max-width: 720px;
  }
  
  .header {
    max-width: 720px;
  }
  
  .content-container {
    max-width: 720px;
  }
}
</style>
