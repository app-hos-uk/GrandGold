import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
  });

  test('should display admin dashboard', async ({ page }) => {
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should have admin sidebar navigation', async ({ page }) => {
    await expect(page.locator('text=Users')).toBeVisible();
    await expect(page.locator('text=Orders')).toBeVisible();
    await expect(page.locator('text=Products')).toBeVisible();
    await expect(page.locator('text=Sellers')).toBeVisible();
    await expect(page.locator('text=Reports')).toBeVisible();
    await expect(page.locator('text=Settings')).toBeVisible();
  });

  test('should display stats cards', async ({ page }) => {
    await expect(page.locator('text=Total Revenue')).toBeVisible();
    await expect(page.locator('text=Total Orders')).toBeVisible();
    await expect(page.locator('text=Total Users')).toBeVisible();
    await expect(page.locator('text=Active Products')).toBeVisible();
  });

  test('should navigate to admin orders', async ({ page }) => {
    await page.click('text=Orders >> nth=0');
    await expect(page).toHaveURL(/\/admin\/orders/);
  });

  test('should navigate to admin products', async ({ page }) => {
    await page.click('text=Products >> nth=0');
    await expect(page).toHaveURL(/\/admin\/products/);
  });

  test('should navigate to admin users', async ({ page }) => {
    await page.click('text=Users >> nth=0');
    await expect(page).toHaveURL(/\/admin\/users/);
  });

  test('should display recent orders table', async ({ page }) => {
    await expect(page.locator('text=Recent Orders')).toBeVisible();
    await expect(page.locator('th >> text=Order ID')).toBeVisible();
    await expect(page.locator('th >> text=Customer')).toBeVisible();
    await expect(page.locator('th >> text=Amount')).toBeVisible();
    await expect(page.locator('th >> text=Status')).toBeVisible();
  });

  test('should display top sellers section', async ({ page }) => {
    await expect(page.locator('text=Top Sellers')).toBeVisible();
  });
});

test.describe('Admin Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should show mobile menu button on admin', async ({ page }) => {
    await page.goto('/admin');
    const menuButton = page.locator('button:has(svg)').first();
    await expect(menuButton).toBeVisible();
  });
});
