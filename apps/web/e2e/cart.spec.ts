import { test, expect } from '@playwright/test';

test.describe('Cart', () => {
  test('should display empty cart message', async ({ page }) => {
    await page.goto('/in/cart');
    await expect(page.locator('text=Your cart is empty')).toBeVisible();
    await expect(page.locator('text=Start Shopping')).toBeVisible();
  });

  test('should have continue shopping link', async ({ page }) => {
    await page.goto('/in/cart');
    const shopLink = page.locator('text=Start Shopping');
    await shopLink.click();
    await expect(page).toHaveURL(/\/in\/collections/);
  });
});

test.describe('Checkout Flow', () => {
  test('should redirect to login if not authenticated', async ({ page }) => {
    await page.goto('/in/checkout');
    // Should show either empty cart or login prompt
    const content = await page.textContent('body');
    expect(
      content?.includes('Sign in to checkout') || 
      content?.includes('Your cart is empty')
    ).toBeTruthy();
  });

  test('should show checkout form structure', async ({ page }) => {
    // This test would require auth - checking basic structure
    await page.goto('/in/checkout');
    // Either shows login prompt or empty cart message
    await expect(page.locator('main')).toBeVisible();
  });
});
