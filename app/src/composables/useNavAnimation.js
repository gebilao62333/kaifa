import { ref } from 'vue'
import storage from '../common/storage'

const STORAGE_KEY = 'navAnimation'

// 底部导航 emoji 动效开关（默认开启）
const navAnimationEnabled = ref(storage.getItem(STORAGE_KEY) !== '0')

export function setNavAnimation(enabled) {
  navAnimationEnabled.value = !!enabled
  storage.setItem(STORAGE_KEY, enabled ? '1' : '0')
}

export function useNavAnimation() {
  return { navAnimationEnabled, setNavAnimation }
}
