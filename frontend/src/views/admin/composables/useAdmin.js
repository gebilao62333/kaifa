import { ref, computed } from 'vue'
import { host } from '../../../common/config'

export function useAdmin() {
  const token = ref(localStorage.getItem('admin_token') || '')

  const page = ref(1)
  const pageSize = ref(20)
  const total = ref(0)
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

  const getHost = () => host || ''

  const formatTime = (timestamp) => {
    if (!timestamp) return '-'
    const date = new Date(timestamp * 1000)
    return date.toLocaleString('zh-CN')
  }

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token.value
  })

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_refresh_token')
    localStorage.removeItem('admin_user')
    window.location.href = '/admin/login'
  }

  const apiGet = async (url, params = {}) => {
    const query = new URLSearchParams(params).toString()
    const res = await fetch(getHost() + url + (query ? '?' + query : ''), {
      headers: getAuthHeaders()
    })
    return res.json()
  }

  const apiPost = async (url, body = {}) => {
    const res = await fetch(getHost() + url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    })
    return res.json()
  }

  const apiPut = async (url, body = {}) => {
    const res = await fetch(getHost() + url, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    })
    return res.json()
  }

  const apiDelete = async (url) => {
    const res = await fetch(getHost() + url, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    return res.json()
  }

  return {
    token, page, pageSize, total, totalPages,
    getHost, formatTime, getAuthHeaders, handleLogout,
    apiGet, apiPost, apiPut, apiDelete
  }
}
