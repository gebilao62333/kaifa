import { ref } from 'vue'
import { pickSplash } from '../utils/splashScreen'
import { router } from '../common/route'

const splash = ref(null)

export function useSplash() { return splash }

export async function loadSplash() {
  try { splash.value = await pickSplash() } catch (e) { splash.value = null }
}

export function closeSplash() { splash.value = null }

export function navigateSplash(link) {
  const target = String(link || '')
  splash.value = null
  if (/^https?:\/\//i.test(target)) {
    try { window.location.href = target } catch (e) {}
    return
  }
  router.push(target.indexOf('/') === 0 ? target : '/' + target)
}
