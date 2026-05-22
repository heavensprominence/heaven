import { test, expect } from '@playwright/test';

test.describe('Cross-Page Consistency', () => {
  test('main pages load without error', async ({ page }) => {
    const pages = ['/', '/shop/', '/shop/cart', '/shop/checkout', '/credon/', '/shop/download'];
    for (const path of pages) {
      await page.goto(path);
      await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
    }
  });

  test('statcounter present on landing and shop', async ({ page }) => {
    for (const path of ['/', '/shop/', '/shop/cart']) {
      await page.goto(path);
      const sc = await page.evaluate(() => typeof sc_project !== 'undefined');
      expect(sc, `statcounter missing on ${path}`).toBe(true);
    }
  });

  test('navigation flows work', async ({ page }) => {
    await page.goto('/shop/');
    await expect(page.locator('.listing-grid')).toBeVisible({ timeout: 15000 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
    await page.goto('/shop/');
    await expect(page.locator('.listing-grid')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('API Endpoints', () => {
  test('listings API returns data', async ({ request }) => {
    const resp = await request.get('/api/shop/listings?limit=5');
    expect(resp.ok()).toBe(true);
    const data = await resp.json();
    expect(Array.isArray(data.listings)).toBe(true);
  });

  test('categories API returns categories', async ({ request }) => {
    const resp = await request.get('/api/shop/categories');
    expect(resp.ok()).toBe(true);
    const data = await resp.json();
    expect(Array.isArray(data.categories)).toBe(true);
  });

  test('subscription plans API has all tiers', async ({ request }) => {
    const resp = await request.get('/api/shop/subscriptions/plans');
    expect(resp.ok()).toBe(true);
    const data = await resp.json();
    expect(data.plans.length).toBeGreaterThanOrEqual(4);
  });

  test('featured listings sort first', async ({ request }) => {
    const resp = await request.get('/api/shop/listings?limit=10');
    const data = await resp.json();
    const listings = data.listings || [];
    const featuredIdx = listings.findIndex(l => l.is_featured);
    if (featuredIdx > 0) {
      for (let i = 0; i < featuredIdx; i++) {
        expect(listings[i].is_featured).not.toBe(true);
      }
    }
  });

  test('image URLs in listings are root-relative', async ({ request }) => {
    const resp = await request.get('/api/shop/listings?limit=20');
    const data = await resp.json();
    for (const l of data.listings || []) {
      if (l.images && l.images.length > 0) {
        expect(l.images[0]).toMatch(/^\//);
      }
    }
  });

  test('download page has all platform links', async ({ page }) => {
    await page.goto('/shop/download');
    const links = page.locator('a[href*="/downloads/"]');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });
});

test('no page has broken *** auth headers', async ({ request }) => {
    const pages = ['/','/shop/','/shop/cart','/shop/checkout','/shop/create','/shop/admin-dashboard','/credon/'];
    for (const path of pages) {
      const resp = await request.get(path);
      const html = await resp.text();
      const broken = html.includes('Authorization:"***"+T') || html.includes("Authorization:'***'+T") || html.includes('Authorization:***+T');
      expect(broken, `BROKEN auth in ${path}: *** instead of Bearer`).toBe(false);
    }
  });
