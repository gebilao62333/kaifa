/**
 * 统一页面布局 Composable
 * 提供标准的布局配置，消除各页面间的尺寸差异
 * 
 * 用法：
 *   const layout = usePageLayout({ variant: 'standard' })
 *   // 或
 *   const layout = usePageLayout({ variant: 'tall', bottomPadding: 'compact' })
 */

import { computed } from 'vue'

const LAYOUT_PRESETS = {
  // 标准页面：70px header + 80px bottom
  standard: {
    headerHeight: 70,
    paddingTop: 70,
    paddingBottom: 80,
    bottomNavHeight: 70,
    pcMaxWidth: 650,
    pcMaxWidthLg: 720
  },
  // 高顶页面：82px header + 80px bottom（用于需要额外状态栏空间的页面）
  tall: {
    headerHeight: 82,
    paddingTop: 82,
    paddingBottom: 80,
    bottomNavHeight: 70,
    pcMaxWidth: 650,
    pcMaxWidthLg: 720
  },
  // 紧凑底部：70px header + 70px bottom（有底部输入框的页面）
  compact: {
    headerHeight: 70,
    paddingTop: 70,
    paddingBottom: 70,
    bottomNavHeight: 70,
    pcMaxWidth: 650,
    pcMaxWidthLg: 720
  },
  // 无导航：70px header，无底部导航（聊天、通话等全屏页面）
  noNav: {
    headerHeight: 70,
    paddingTop: 70,
    paddingBottom: 0,
    bottomNavHeight: 0,
    pcMaxWidth: 650,
    pcMaxWidthLg: 720
  },
  // 全屏无头：无 header 无 nav（登录页等）
  fullscreen: {
    headerHeight: 0,
    paddingTop: 0,
    paddingBottom: 0,
    bottomNavHeight: 0,
    pcMaxWidth: 650,
    pcMaxWidthLg: 720
  }
}

export function usePageLayout(options = {}) {
  const { variant = 'standard', bottomPadding } = options
  
  const preset = LAYOUT_PRESETS[variant] || LAYOUT_PRESETS.standard
  
  // 根据 bottomPadding 覆盖底部间距
  let finalPaddingBottom = preset.paddingBottom
  if (bottomPadding === 'compact') {
    finalPaddingBottom = 70
  } else if (bottomPadding === 'large') {
    finalPaddingBottom = 140
  } else if (bottomPadding === 'none') {
    finalPaddingBottom = 0
  }
  
  const layout = computed(() => ({
    headerHeight: preset.headerHeight,
    paddingTop: preset.paddingTop,
    paddingBottom: finalPaddingBottom,
    bottomNavHeight: preset.bottomNavHeight,
    pcMaxWidth: preset.pcMaxWidth,
    pcMaxWidthLg: preset.pcMaxWidthLg,
    // 页面容器样式
    pageStyle: {
      paddingTop: `${preset.paddingTop}px`,
      paddingBottom: `calc(${finalPaddingBottom}px + env(safe-area-inset-bottom, 0px))`
    }
  }))

  return layout
}

// 导出预设以便外部使用
export { LAYOUT_PRESETS }
