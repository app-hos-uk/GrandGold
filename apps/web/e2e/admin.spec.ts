import { test, expect } from '@playwright/test';

// Mock JWT token for testing (decoded: { role: 'super_admin', country: 'IN' })
// In production tests, use a real test account or auth fixture
const MOCK_ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QtYWRtaW4iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJjb3VudHJ5IjoiSU4iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTgwMDAwMDAwMH0.test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Set mock auth token before navigating to admin pages
    await page.addInitScript((token) => {
      localStorage.setItem('grandgold_token', token);
      localStorage.setItem('accessToken', token);
    }, MOCK_ADMIN_TOKEN);
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

  test('should navigate to admin KYC', async ({ page }) => {
    await page.click('text=KYC >> nth=0');
    await expect(page).toHaveURL(/\/admin\/kyc/);
    await expect(page.locator('text=KYC Applications')).toBeVisible();
  });

  test('should navigate to admin Refunds', async ({ page }) => {
    await page.click('text=Refunds >> nth=0');
    await expect(page).toHaveURL(/\/admin\/refunds/);
    await expect(page.locator('text=Refund Requests')).toBeVisible();
  });

  test('should navigate to admin Onboarding', async ({ page }) => {
    await page.click('text=Onboarding >> nth=0');
    await expect(page).toHaveURL(/\/admin\/onboarding/);
    await expect(page.locator('text=Seller Onboarding')).toBeVisible();
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
    // Set mock auth token before navigating
    await page.addInitScript((token) => {
      localStorage.setItem('grandgold_token', token);
      localStorage.setItem('accessToken', token);
    }, MOCK_ADMIN_TOKEN);
    await page.goto('/admin');
    const menuButton = page.locator('button:has(svg)').first();
    await expect(menuButton).toBeVisible();
  });
});
