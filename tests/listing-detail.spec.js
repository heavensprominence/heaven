import { test, expect } from '@playwright/test';

test.describe('Listing Detail', () => {
  test('listing detail page loads for a valid listing', async ({ page }) => {
    // Use a known listing ID from the API
    const resp = await page.request.get('/api/shop/listings?limit=1');
    const data = await resp.json();
    const listing = data.listings?.[0];
    
    if (listing) {
      await page.goto(`/shop/listing/${listing.id}`);
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
      // Should show title
      await expect(page.getByText(listing.title)).toBeVisible({ timeout: 5000 });
    }
  });

  test('listing detail shows price', async ({ page }) => {
    const resp = await page.request.get('/api/shop/listings?limit=1');
    const data = await resp.json();
    const listing = data.listings?.[0];
    
    if (listing) {
      await page.goto(`/shop/listing/${listing.id}`);
      await expect(page.locator('.price')).toBeVisible({ timeout: 10000 });
    }
  });

  test('listing detail shows metadata', async ({ page }) => {
    const resp = await page.request.get('/api/shop/listings?limit=1');
    const data = await resp.json();
    const listing = data.listings?.[0];
    
    if (listing) {
      await page.goto(`/shop/listing/${listing.id}`);
      // Should have seller info or location
      await expect(page.locator('.meta')).toBeVisible({ timeout: 10000 });
    }
  });

  test('message seller button exists', async ({ page }) => {
    const resp = await page.request.get('/api/shop/listings?limit=1');
    const data = await resp.json();
    const listing = data.listings?.[0];
    
    if (listing) {
      await page.goto(`/shop/listing/${listing.id}`);
      const msgBtn = page.locator('button').filter({ hasText: /Message|💬/ }).first();
      await expect(msgBtn).toBeVisible({ timeout: 5000 });
    }
  });

  test('invalid listing ID shows not found', async ({ page }) => {
    await page.goto('/shop/listing/nonexistent-id-12345');
    await expect(page.getByText(/Not Found|Error|not found/i)).toBeVisible({ timeout: 10000 });
  });

  test('language selector works on detail page', async ({ page }) => {
    const resp = await page.request.get('/api/shop/listings?limit=1');
    const data = await resp.json();
    const listing = data.listings?.[0];
    
    if (listing) {
      await page.goto(`/shop/listing/${listing.id}`);
      const langSel = page.locator('#langSel');
      await expect(langSel).toBeVisible({ timeout: 5000 });
    }
  });
});
