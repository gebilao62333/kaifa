import { test, expect } from '@playwright/test';

test.describe('核心用户流程测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('浏览首页内容', async ({ page }) => {
    await page.goto('/home');
    await expect(page.locator('body')).toBeVisible();
  });

  test('查看陪玩列表', async ({ page }) => {
    await page.goto('/online-companions');
    await expect(page).toHaveURL('/online-companions');
  });

  test('查看VIP中心', async ({ page }) => {
    await page.goto('/vip-center');
    await expect(page).toHaveURL('/vip-center');
  });

  test('查看充值页面', async ({ page }) => {
    await page.goto('/recharge');
    await expect(page).toHaveURL('/recharge');
  });

  test('查看我的订单', async ({ page }) => {
    await page.goto('/my-order');
    await expect(page).toHaveURL('/my-order');
  });

  test('查看编辑资料页面', async ({ page }) => {
    await page.goto('/edit-profile');
    await expect(page).toHaveURL('/edit-profile');
  });

  test('查看设置页面', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL('/settings');
  });

  test('查看AI陪聊页面', async ({ page }) => {
    await page.goto('/ai-chat');
    await expect(page).toHaveURL('/ai-chat');
  });

  test('页面响应式检查', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/home');
    await expect(page.locator('body')).toBeVisible();
  });
});
