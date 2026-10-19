import { ref } from 'vue'

const current = ref(null)
let timer = null

export function useIncomingCall() { return current }

export function showIncomingCall(data) {
  current.value = data || null
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => { current.value = null }, 30000)
}

export function hideIncomingCall() {
  current.value = null
  if (timer) { clearTimeout(timer); timer = null }
}
