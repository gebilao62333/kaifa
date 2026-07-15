import { ref, computed } from 'vue'

export function useAdminApi() {
  const page = ref(1)
  const pageSize = ref(20)
  const total = ref(0)
  const searchKeyword = ref('')
  const filterStatus = ref('')

  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

  const getHost = () => {
    return import.meta.env.VITE_API_BASE || 'http://localhost:3000'
  }

  const getToken = () => {
    return localStorage.getItem('admin_token') || ''
  }

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
  })

  const formatTime = (time) => {
    if (!time) return ''
    return new Date(time).toLocaleString()
  }

  const prevPage = () => {
    if (page.value > 1) { page.value-- }
  }

  const nextPage = () => {
    if (page.value < totalPages.value) { page.value++ }
  }

  const gotoPage = (p) => {
    if (p >= 1 && p <= totalPages.value) { page.value = p }
  }

  const resetPagination = () => {
    page.value = 1
    searchKeyword.value = ''
    filterStatus.value = ''
  }

  return {
    page, pageSize, total, totalPages,
    searchKeyword, filterStatus,
    getHost, getToken, getHeaders, formatTime,
    prevPage, nextPage, gotoPage, resetPagination
  }
}

export const companionStatusMap = { 0: '未申请', 1: '审核中', 2: '已通过' }
export const companionStatusClass = (s) => ({ 0: 'disabled', 1: 'pending', 2: 'approved' }[s] || 'disabled')
