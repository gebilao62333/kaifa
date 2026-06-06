<template>
  <div class="pagination" :class="{ 'pagination-compact': compact }">
    <div v-if="!compact" class="pagination-left">
      <span class="page-size-label">每页</span>
      <select v-model.number="currentPageSize" @change="onPageSizeChange" class="page-size-select">
        <option v-for="s in pageSizes" :key="s" :value="s">{{ s }}</option>
      </select>
      <span class="page-size-label">条，共 {{ total }} 条</span>
    </div>
    <div class="pagination-right">
      <button @click="goPage(1)" class="page-btn" :disabled="page <= 1">首页</button>
      <button @click="goPage(page - 1)" class="page-btn" :disabled="page <= 1">上一页</button>
      <template v-for="p in displayPages" :key="p.key">
        <span v-if="p.isEllipsis" class="page-btn page-ellipsis" disabled>...</span>
        <button v-else :class="['page-btn', { 'page-active': p.value === page }]" @click="goPage(p.value)">{{ p.value }}</button>
      </template>
      <button @click="goPage(page + 1)" class="page-btn" :disabled="page >= totalPages">下一页</button>
      <button @click="goPage(totalPages)" class="page-btn" :disabled="page >= totalPages">末页</button>
      <span v-if="compact" class="page-info">共 {{ total }} 条</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminPagination',
  props: {
    page: { type: Number, required: true },
    pageSize: { type: Number, default: 20 },
    total: { type: Number, default: 0 },
    compact: { type: Boolean, default: false },
    pageSizes: { type: Array, default: () => [10, 20, 50, 100] }
  },
  emits: ['update:page', 'update:pageSize', 'change'],
  computed: {
    currentPageSize: {
      get() { return this.pageSize },
      set(val) { this.$emit('update:pageSize', val) }
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.total / this.pageSize))
    },
    displayPages() {
      const total = this.totalPages
      const current = this.page
      const pages = []
      if (total <= 7) {
        for (let i = 1; i <= total; i++) pages.push({ key: i, value: i, isEllipsis: false })
      } else {
        pages.push({ key: 1, value: 1, isEllipsis: false })
        let start = Math.max(2, current - 1)
        let end = Math.min(total - 1, current + 1)
        if (current <= 3) { start = 2; end = 4 }
        if (current >= total - 2) { start = total - 3; end = total - 1 }
        if (start > 2) pages.push({ key: 'left-ellipsis', value: -1, isEllipsis: true })
        for (let i = start; i <= end; i++) pages.push({ key: i, value: i, isEllipsis: false })
        if (end < total - 1) pages.push({ key: 'right-ellipsis', value: -1, isEllipsis: true })
        pages.push({ key: total, value: total, isEllipsis: false })
      }
      return pages
    }
  },
  methods: {
    goPage(p) {
      if (p < 1 || p > this.totalPages || p === this.page) return
      this.$emit('update:page', p)
      this.$emit('change')
    },
    onPageSizeChange() {
      this.$emit('update:page', 1)
      this.$emit('change')
    }
  }
}
</script>

<style scoped>
.pagination-compact .pagination-right {
  justify-content: center;
}
</style>
