import { reactive, readonly } from 'vue'

const state = reactive({
  visible: false,
  message: '',
  type: 'info'
})

let timer = null

export const toast = {
  show(message, type = 'info', duration = 2000) {
    if (timer) clearTimeout(timer)
    state.message = message
    state.type = type
    state.visible = true

    if (duration > 0) {
      timer = setTimeout(() => {
        state.visible = false
      }, duration)
    }
  },
  success(message, duration = 2000) {
    this.show(message, 'success', duration)
  },
  error(message, duration = 2000) {
    this.show(message, 'error', duration)
  },
  warning(message, duration = 2000) {
    this.show(message, 'warning', duration)
  },
  info(message, duration = 2000) {
    this.show(message, 'info', duration)
  },
  hide() {
    state.visible = false
    if (timer) clearTimeout(timer)
  }
}

export function useToast() {
  return {
    state: readonly(state),
    toast
  }
}

export default toast
