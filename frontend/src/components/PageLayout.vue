<template>
  <div class="page-layout">
    <header v-if="$slots.nav" class="page-nav">
      <div class="page-nav-inner">
        <slot name="nav" />
      </div>
    </header>

    <main class="page-body">
      <slot />
    </main>
  </div>
</template>

<script setup>
// 主页面统一布局：
// 1. 顶部渐变导航栏（sticky 固定，高度由插槽内容自适应，无需手动算 padding-top）
// 2. PC 端整体居中（max-width 650 / 720，margin: 0 auto）
// 3. 底部为 TabBar 预留安全留白（padding-bottom: 80px）
// 用法：
//   <PageLayout>
//     <template #nav> 导航栏内容（搜索框/标题/用户信息等） </template>
//     页面主体内容
//   </PageLayout>
</script>

<style scoped>
.page-layout {
  min-height: calc(100dvh - 80px);
  background-color: #f5f5f5;
  padding-bottom: 80px;
}

.page-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.page-nav-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 50px;
  padding: 12px 20px;
  box-sizing: border-box;
}

.page-body {
  /* 主体内容由页面自身控制卡片样式 */
}

/* PC 端居中，与首页 /home 保持一致的宽度体验 */
@media (min-width: 768px) {
  .page-layout {
    max-width: 650px;
    margin: 0 auto;
    padding-bottom: 20px;
  }

  .page-nav {
    max-width: 650px;
    margin: 0 auto;
  }

  .page-nav-inner {
    padding: 12px 24px;
  }
}

@media (min-width: 1024px) {
  .page-layout {
    max-width: 720px;
  }

  .page-nav {
    max-width: 720px;
  }
}
</style>
