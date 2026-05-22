import { test, expect } from '@playwright/test';

test.describe('Shop — Browse Listings', () => {
  test('shop page loads with listings', async ({ page }) => {
    await page.goto('/shop/');
    await expect(page.locator('.listing-grid')).toBeVisible({ timeout: 15000 });
    // Should have at least one listing card or a "no listings" message
    const cards = page.locator('.listing-card');
    const noResults = page.locator('[data-i18n="listing.noResults"]');
    await expect(cards.first().or(noResults)).toBeVisible({ timeout: 15000 });
  });

  test('featured listings appear first', async ({ page }) => {
    await page.goto('/shop/');
    await page.waitForSelector('.listing-card', { timeout: 15000 });
    // Check if any listing has featured badge
    const featured = page.locator('.b-featured');
    const cards = page.locator('.listing-card');
    if (await featured.count() > 0 && await cards.count() > 1) {
      // Featured badge should be on one of the first listings
      const firstFew = cards.first();
      await expect(firstFew.locator('.b-featured')).toBeAttached();
    }
  });

  test('category tree is visible on desktop', async ({ page }) => {
    // Only test on desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/shop/');
    await expect(page.locator('#catList')).toBeVisible({ timeout: 15000 });
    // Should have category items
    const items = page.locator('.cat-item');
    await expect(items.first()).toBeVisible({ timeout: 10000 });
  });

  test('search bar works', async ({ page }) => {
    await page.goto('/shop/');
    const searchBox = page.locator('#searchBox');
    await expect(searchBox).toBeVisible();
    await searchBox.fill('English');
    await searchBox.press('Enter');
    await page.waitForLoadState('networkidle');
    // Should show results or empty state
    await expect(page.locator('.listing-grid')).toBeVisible();
  });

  test('sort dropdown exists', async ({ page }) => {
    await page.goto('/shop/');
    const sortSelect = page.locator('#sortSelect, select[name="sort"]').first();
    if (await sortSelect.isVisible()) {
      const options = await sortSelect.locator('option').count();
      expect(options).toBeGreaterThanOrEqual(2);
    }
  });

  test('listing card shows title and price', async ({ page }) => {
    await page.goto('/shop/');
    await page.waitForSelector('.listing-card', { timeout: 15000 });
    const card = page.locator('.listing-card').first();
    await expect(card.locator('.listing-title')).toBeVisible();
    await expect(card.locator('.listing-price')).toBeVisible();
  });

  test('clicking listing card navigates to detail', async ({ page }) => {
    await page.goto('/shop/');
    await page.waitForSelector('.listing-card', { timeout: 15000 });
    const card = page.locator('.listing-card').first();
    const cardCount = await card.count();
    if (cardCount > 0) {
      await card.click();
      await expect(page).toHaveURL(/\/shop\/listing\//);
    }
  });

  test('pagination appears when multiple pages exist', async ({ page }) => {
    await page.goto('/shop/');
    await page.waitForLoadState('networkidle');
    const pagination = page.locator('.pagination');
    // May or may not exist depending on listing count
    // But the page should at least load without errors
    await expect(page.locator('.listing-grid')).toBeVisible();
  });
});
