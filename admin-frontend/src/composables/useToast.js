import { reactive, readonly } from 'vue'

const state = reactive({
  visible: false,
  message: '',
  type: 'info'
})

let timer = null

function show(message, type = 'info', duration = 2000) {
  if (timer) clearTimeout(timer)
  state.message = message
  state.type = type
  state.visible = true

  if (duration > 0) {
    timer = setTimeout(() => {
      state.visible = false
    }, duration)
  }
}

function success(message, duration = 2000) {
  show(message, 'success', duration)
}

function error(message, duration = 2000) {
  show(message, 'error', duration)
}

function warning(message, duration = 2000) {
  show(message, 'warning', duration)
}

function info(message, duration = 2000) {
  show(message, 'info', duration)
}

function hide() {
  state.visible = false
  if (timer) clearTimeout(timer)
}

// toast 作为函数直接调用时默认为 info 提示
function toastFn(message, duration) {
  show(message, 'info', duration)
}

// 将方法挂载到 toastFn 上，使其同时支持 toast('msg') 和 toast.success('msg') 两种用法
toastFn.show = show
toastFn.success = success
toastFn.error = error
toastFn.warning = warning
toastFn.info = info
toastFn.hide = hide

export const toast = toastFn

export function useToast() {
  return {
    state: readonly(state),
    toast,
    showToast: show
  }
}

export default toast
