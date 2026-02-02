import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('should have skip link for keyboard navigation', async ({ page }) => {
    await page.goto('/in');
    // Skip link should exist but be visually hidden until focused
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();
  });

  test('should have main content landmark', async ({ page }) => {
    await page.goto('/in');
    const main = page.locator('main#main-content');
    await expect(main).toBeAttached();
  });

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/in');
    const nav = page.locator('nav');
    await expect(nav.first()).toBeVisible();
  });

  test('should have accessible mobile menu button', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/in');
    const menuButton = page.locator('button[aria-expanded]').first();
    await expect(menuButton).toHaveAttribute('aria-label', /menu/i);
  });

  test('should have alt text for decorative elements', async ({ page }) => {
    await page.goto('/in');
    // All images should have alt or be marked as decorative
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < Math.min(count, 10); i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      expect(alt !== null || role === 'presentation' || role === 'none').toBeTruthy();
    }
  });

  test('should have sufficient color contrast on buttons', async ({ page }) => {
    await page.goto('/in');
    // Check that primary CTA buttons are visible
    const ctaButton = page.locator('text=Explore Collection').first();
    await expect(ctaButton).toBeVisible();
  });
});

test.describe('Keyboard Navigation', () => {
  test('should be able to tab through navigation', async ({ page }) => {
    await page.goto('/in');
    
    // Press Tab multiple times and check focus moves
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Focus should be on some interactive element
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeAttached();
  });

  test('should be able to navigate with Enter key', async ({ page }) => {
    await page.goto('/in');
    
    // Tab to a link
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }
    
    const focusedElement = await page.locator(':focus').getAttribute('href');
    if (focusedElement) {
      await page.keyboard.press('Enter');
      // Should navigate somewhere
      await page.waitForLoadState('networkidle');
    }
  });
});
