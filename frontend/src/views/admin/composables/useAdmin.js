import { ref, computed } from 'vue'
import { host } from '../../../common/config'

export function useAdmin() {
  const token = ref(localStorage.getItem('admin_token') || '')

  const page = ref(1)
  const pageSize = ref(20)
  const total = ref(0)
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

  const pageNumbers = computed(() => {
    const tp = totalPages.value
    const current = page.value
    if (tp <= 7) return Array.from({ length: tp }, (_, i) => i + 1)
    const pages = []
    if (current <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i)
      pages.push('...')
      pages.push(tp)
    } else if (current >= tp - 2) {
      pages.push(1)
      pages.push('...')
      for (let i = tp - 3; i <= tp; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(tp)
    }
    return pages
  })

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

  // 导出 CSV
  const exportCSV = (data, columns, filename) => {
    if (!data || data.length === 0) return
    const BOM = '\uFEFF'
    const header = columns.map(c => c.label).join(',')
    const rows = data.map(row =>
      columns.map(col => {
        let val = typeof col.key === 'function' ? col.key(row) : row[col.key]
        if (val == null) val = ''
        val = String(val).replace(/"/g, '""')
        return `"${val}"`
      }).join(',')
    )
    const csv = BOM + header + '\n' + rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = (filename || 'export') + '.csv'
    link.click()
    URL.revokeObjectURL(link.href)
  }

  // Toast 通知
  const toast = (message, type = 'success') => {
    const el = document.createElement('div')
    el.textContent = message
    el.style.cssText = `
      position:fixed;top:24px;right:24px;padding:12px 24px;border-radius:8px;
      font-size:14px;color:#fff;z-index:99999;animation:slideIn 0.3s ease;
      box-shadow:0 4px 12px rgba(0,0,0,0.15);
      background:${type === 'error' ? '#d63031' : type === 'warning' ? '#fdcb6e' : '#00b894'};
      color:${type === 'warning' ? '#333' : '#fff'};
    `
    document.body.appendChild(el)
    setTimeout(() => { el.remove() }, 3000)
  }

  // 自定义确认弹窗（替代原生 confirm）
  const confirm = (message, title = '操作确认') => {
    return new Promise((resolve) => {
      const overlay = document.createElement('div')
      overlay.style.cssText = `
        position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:99998;
        display:flex;align-items:center;justify-content:center;
        animation:fadeIn 0.2s ease;
      `
      overlay.innerHTML = `
        <div style="background:#fff;border-radius:12px;width:380px;max-width:90vw;box-shadow:0 8px 40px rgba(0,0,0,0.2);animation:scaleIn 0.2s ease;">
          <div style="padding:24px 24px 0;font-size:16px;font-weight:600;color:#1a1a1a;">${title}</div>
          <div style="padding:16px 24px 24px;font-size:14px;color:#666;line-height:1.6;">${message}</div>
          <div style="display:flex;border-top:1px solid #f0f0f0;">
            <button id="_confirm_cancel" style="flex:1;padding:14px;background:none;border:none;border-right:1px solid #f0f0f0;font-size:14px;color:#999;cursor:pointer;border-radius:0 0 0 12px;">取消</button>
            <button id="_confirm_ok" style="flex:1;padding:14px;background:none;border:none;font-size:14px;color:#1890ff;font-weight:600;cursor:pointer;border-radius:0 0 12px 0;">确认</button>
          </div>
        </div>
      `
      const cleanup = () => {
        overlay.removeEventListener('click', onBg)
        overlay.remove()
      }
      const onBg = (e) => { if (e.target === overlay) { resolve(false); cleanup() } }
      overlay.addEventListener('click', onBg)
      document.body.appendChild(overlay)

      overlay.querySelector('#_confirm_cancel').onclick = () => { resolve(false); cleanup() }
      overlay.querySelector('#_confirm_ok').onclick = () => { resolve(true); cleanup() }

      // ESC 关闭
      const onEsc = (e) => { if (e.key === 'Escape') { resolve(false); cleanup(); document.removeEventListener('keydown', onEsc) } }
      document.addEventListener('keydown', onEsc)
    })
  }

  return {
    token, page, pageSize, total, totalPages, pageNumbers,
    getHost, formatTime, getAuthHeaders, handleLogout,
    apiGet, apiPost, apiPut, apiDelete,
    exportCSV, toast, confirm
  }
}
