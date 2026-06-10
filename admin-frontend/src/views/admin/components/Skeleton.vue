<template>
  <div class="admin-skeleton">
    <!-- 标题骨架 -->
    <div v-if="type === 'title'" class="skeleton-block title-shape" :style="{ width: w || '200px' }"></div>

    <!-- 卡片骨架 -->
    <div v-else-if="type === 'card'" class="skeleton-card" :style="{ width: w, height: h }">
      <div class="skeleton-block card-icon-shape"></div>
      <div class="skeleton-card-body">
        <div class="skeleton-block text-shape" style="width:40%"></div>
        <div class="skeleton-block text-shape" style="width:70%"></div>
      </div>
    </div>

    <!-- 文本骨架 -->
    <div v-else-if="type === 'text'" class="skeleton-text">
      <div v-for="i in (lines || 3)" :key="i" class="skeleton-block text-shape" :style="{ width: i === lines ? '40%' : '100%' }"></div>
    </div>

    <!-- 表格骨架（最常用） -->
    <div v-else-if="type === 'table'" class="skeleton-table">
      <div class="skeleton-table-header">
        <div v-for="i in (cols || 5)" :key="'h'+i" class="skeleton-block th-shape" :style="{ width: colWidths ? colWidths[i-1] : '' }"></div>
      </div>
      <div v-for="r in (rows || 8)" :key="'r'+r" class="skeleton-table-row">
        <div v-for="c in (cols || 5)" :key="'c'+c" class="skeleton-block td-shape" :style="{ width: colWidths ? colWidths[c-1] : '' }"></div>
      </div>
    </div>

    <!-- 统计卡片网格骨架 -->
    <div v-else-if="type === 'stats'" class="skeleton-stats">
      <div v-for="i in (count || 6)" :key="i" class="skeleton-card">
        <div class="skeleton-block card-icon-shape"></div>
        <div class="skeleton-card-body">
          <div class="skeleton-block text-shape" style="width:50%"></div>
          <div class="skeleton-block text-shape" style="width:80%"></div>
        </div>
      </div>
    </div>

    <!-- 默认：混合卡片 -->
    <div v-else class="skeleton-default">
      <div class="skeleton-block title-shape" style="width:180px;margin-bottom:20px"></div>
      <div class="skeleton-stats">
        <div v-for="i in 4" :key="i" class="skeleton-card">
          <div class="skeleton-block card-icon-shape"></div>
          <div class="skeleton-card-body">
            <div class="skeleton-block text-shape" style="width:45%"></div>
            <div class="skeleton-block text-shape" style="width:70%"></div>
          </div>
        </div>
      </div>
      <div style="margin-top:24px">
        <div class="skeleton-table-header">
          <div v-for="i in 5" :key="'h'+i" class="skeleton-block th-shape"></div>
        </div>
        <div v-for="r in 6" :key="'r'+r" class="skeleton-table-row">
          <div v-for="c in 5" :key="'c'+c" class="skeleton-block td-shape"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  type: { type: String, default: '' },    // 'title' | 'card' | 'text' | 'table' | 'stats' | ''
  rows: { type: Number, default: 8 },
  cols: { type: Number, default: 5 },
  count: { type: Number, default: 6 },
  lines: { type: Number, default: 3 },
  w: { type: String, default: '' },
  h: { type: String, default: '' },
  colWidths: { type: Array, default: null }
})
</script>

<style scoped>
.admin-skeleton {
  padding: 4px 0;
}

/* 通用骨架块 + shimmer */
.skeleton-block {
  background: linear-gradient(90deg, #e8ecf0 25%, #f0f3f5 37%, #e8ecf0 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
  border-radius: 6px;
}

@keyframes shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}

/* 标题 */
.title-shape {
  height: 28px;
  border-radius: 8px;
}

/* 文字行 */
.text-shape {
  height: 14px;
  margin-bottom: 10px;
}
.text-shape:last-child { margin-bottom: 0; }

.skeleton-text {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* 卡片 */
.skeleton-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.card-icon-shape {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  flex-shrink: 0;
}
.skeleton-card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 统计网格 */
.skeleton-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

/* 表格 */
.skeleton-table {
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.skeleton-table-header {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #eee;
}
.th-shape {
  flex: 1;
  height: 14px;
}
.skeleton-table-row {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid #f5f5f5;
}
.skeleton-table-row:last-child { border-bottom: none; }
.td-shape {
  flex: 1;
  height: 12px;
}

/* 默认混合 */
.skeleton-default {
  padding: 0;
}
</style>
