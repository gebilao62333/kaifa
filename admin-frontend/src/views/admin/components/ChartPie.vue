<template>
  <div class="chart-pie" ref="containerRef">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
      <g :transform="`translate(${size / 2}, ${size / 2})`">
        <path
          v-for="(slice, idx) in slices"
          :key="idx"
          :d="slice.path"
          :fill="slice.color"
          :stroke="'#fff'"
          :stroke-width="2"
          class="pie-slice"
          @mouseenter="hovered = idx"
          @mouseleave="hovered = null"
          :style="{ transform: hovered === idx ? `scale(${1 + slice.scaleOffset})` : 'scale(1)', transformOrigin: 'center', transition: 'transform 0.2s ease' }"
        />
      </g>
    </svg>
    <!-- 图例 -->
    <div class="legend">
      <div v-for="(item, idx) in data" :key="idx" class="legend-item">
        <span class="legend-dot" :style="{ background: colors[idx % colors.length] }"></span>
        <span class="legend-label">{{ item.label }}</span>
        <span class="legend-value">{{ item.value }}</span>
        <span class="legend-percent">{{ percent(idx) }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
  size: { type: Number, default: 200 },
  colors: { type: Array, default: () => ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#a18cd1'] }
})

const hovered = ref(null)

const total = computed(() => props.data.reduce((sum, d) => sum + (Number(d.value) || 0), 0))

const slices = computed(() => {
  if (total.value === 0) return []
  let startAngle = -Math.PI / 2
  return props.data.map((item, idx) => {
    const angle = ((Number(item.value) || 0) / total.value) * Math.PI * 2
    const endAngle = startAngle + angle
    const r = props.size / 2 - 10
    const x1 = r * Math.cos(startAngle)
    const y1 = r * Math.sin(startAngle)
    const x2 = r * Math.cos(endAngle)
    const y2 = r * Math.sin(endAngle)
    const largeArc = angle > Math.PI ? 1 : 0
    const path = `M 0 0 L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
    startAngle = endAngle
    return { path, color: props.colors[idx % props.colors.length], scaleOffset: 0.05 }
  })
})

const percent = (idx) => {
  if (total.value === 0) return 0
  return ((Number(props.data[idx]?.value) || 0) / total.value * 100).toFixed(1)
}
</script>

<style scoped>
.chart-pie {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

svg {
  flex-shrink: 0;
}

.pie-slice {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #555;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-label {
  min-width: 60px;
}

.legend-value {
  font-weight: 600;
  color: #333;
  min-width: 40px;
  text-align: right;
}

.legend-percent {
  color: #999;
  min-width: 40px;
  text-align: right;
}
</style>
