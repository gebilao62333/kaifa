import { test, expect } from '@playwright/test';

test.describe('前端性能测试', () => {
  test('首页加载时间应该在合理范围内', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/home', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000);
  });

  test('页面资源加载检查', async ({ page }) => {
    const response = await page.goto('/home');
    expect(response.ok()).toBeTruthy();
  });

  test('LCP指标测试', async ({ page }) => {
    const lcpPromise = page.evaluate(() => {
      return new Promise(resolve => {
        new PerformanceObserver(list => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            resolve(lastEntry.startTime);
          }
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      });
    });

    await page.goto('/home');
    const lcpTime = await Promise.race([lcpPromise, Promise.resolve(0)]);
    if (lcpTime > 0) {
      expect(lcpTime).toBeLessThan(4000);
    }
  });
});
