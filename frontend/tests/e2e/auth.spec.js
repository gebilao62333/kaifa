import { test, expect } from '@playwright/test';

test.describe('认证流程测试', () => {
  test('访问登录页面', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL('/login');
  });

  test('登录表单渲染正确', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="text"], input[type="tel"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('首页导航正常', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/.*home/);
  });

  test('底部导航栏正常显示', async ({ page }) => {
    await page.goto('/home');
    const bottomNav = page.locator('nav, .bottom-nav, [class*="nav"]');
    await expect(bottomNav).toBeVisible();
  });
});
