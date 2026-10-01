import { ref } from 'vue'

const toasts = ref([])
let idCounter = 0

export function useToast() {
  const add = (msg, type) => {
    const id = ++idCounter
    toasts.value.push({ id, msg, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, 3000)
  }

  const success = (msg) => add(msg, 'success')
  const error = (msg) => add(msg, 'error')
  const info = (msg) => add(msg, 'info')
  const remove = (id) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return { toasts, success, error, info, remove }
}
