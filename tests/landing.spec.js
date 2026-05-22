import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('loads landing page with prayer audio', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/HeavensLive/i);
    const audio = page.locator('#prayerAudio');
    await expect(audio).toBeAttached({ timeout: 10000 });
    const source = page.locator('#prayerAudio source').first();
    await expect(source).toHaveAttribute('src', /audio\./);
  });

  test('loading screen displays', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
  });

  test('language selector present', async ({ page }) => {
    await page.goto('/');
    const sel = page.locator('select').first();
    await expect(sel).toBeVisible({ timeout: 10000 });
  });

  test('statcounter tracking present', async ({ page }) => {
    await page.goto('/');
    const sc = await page.evaluate(() => typeof sc_project !== 'undefined');
    expect(sc).toBe(true);
  });
});
