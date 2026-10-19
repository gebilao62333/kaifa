import homeService from '../services/homeService'

const STORAGE_PREFIX = 'splash_shown:'

// 展示频率 1 每次打开 / 2 每天一次 / 3 每周一次 / 4 仅一次，频率不同去重口径不同
const bucketOf = (frequency, now) => {
  if (frequency === 2) return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
  if (frequency === 3) {
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7))
    return `W${monday.getFullYear()}-${monday.getMonth()}-${monday.getDate()}`
  }
  if (frequency === 4) return 'once'
  return ''
}

const readBucket = (id) => {
  try {
    return localStorage.getItem(STORAGE_PREFIX + id)
  } catch (e) {
    return null
  }
}

const writeBucket = (id, bucket) => {
  try {
    localStorage.setItem(STORAGE_PREFIX + id, bucket)
  } catch (e) {
    /* 存储不可用时忽略，弹窗仍可展示 */
  }
}

export const canShowSplash = (splash, now = new Date()) => {
  if (!splash) return false
  const bucket = bucketOf(splash.frequency, now)
  if (!bucket) return true
  return readBucket(splash.id) !== bucket
}

export const markSplashShown = (splash, now = new Date()) => {
  const bucket = bucketOf(splash.frequency, now)
  if (bucket) writeBucket(splash.id, bucket)
}

// 一次启动只展示优先级最高（接口已按 sort DESC 返回）且未到去重周期的一条
export const pickSplash = async (now = new Date()) => {
  const result = await homeService.getSplashList()
  const list = (result && result.code === 200 && result.data && result.data.list) || []
  const target = list.find((splash) => canShowSplash(splash, now))
  if (!target) return null
  markSplashShown(target, now)
  return target
}
