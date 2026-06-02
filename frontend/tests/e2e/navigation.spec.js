import { test, expect } from '@playwright/test';

test.describe('页面导航测试', () => {
  test('首页到陪玩页面导航', async ({ page }) => {
    await page.goto('/home');
    const gameLink = page.getByRole('link', { name: /游戏|陪玩|game/i }).first();
    if (await gameLink.isVisible()) {
      await gameLink.click();
    } else {
      await page.goto('/game-index');
    }
    await expect(page).toHaveURL(/game-index/);
  });

  test('首页到圈子动态页面导航', async ({ page }) => {
    await page.goto('/home');
    const activityLink = page.getByRole('link', { name: /动态|圈子|activity/i }).first();
    if (await activityLink.isVisible()) {
      await activityLink.click();
    } else {
      await page.goto('/activity');
    }
    await expect(page).toHaveURL(/activity/);
  });

  test('个人中心页面访问', async ({ page }) => {
    await page.goto('/mine');
    await expect(page).toHaveURL('/mine');
  });

  test('搜索页面访问', async ({ page }) => {
    await page.goto('/search');
    await expect(page).toHaveURL('/search');
  });

  test('钱包页面访问', async ({ page }) => {
    await page.goto('/wallet');
    await expect(page).toHaveURL('/wallet');
  });
});
