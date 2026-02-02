import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/in');
  });

  test('should navigate to collections page', async ({ page }) => {
    await page.click('nav >> text=Collections');
    await expect(page).toHaveURL(/\/in\/collections/);
    await expect(page.locator('text=Collections')).toBeVisible();
  });

  test('should navigate to category pages', async ({ page }) => {
    await page.click('nav >> text=Necklaces');
    await expect(page).toHaveURL(/\/in\/category\/necklaces/);
  });

  test('should navigate to AR Try-On page', async ({ page }) => {
    await page.click('nav >> text=AR Try-On');
    await expect(page).toHaveURL(/\/in\/ar-tryon/);
  });

  test('should navigate to cart page', async ({ page }) => {
    await page.click('[aria-label*="cart"], [href*="/cart"]');
    await expect(page).toHaveURL(/\/in\/cart/);
  });

  test('should navigate to wishlist page', async ({ page }) => {
    const wishlistLink = page.locator('[href*="/wishlist"]').first();
    await wishlistLink.click();
    await expect(page).toHaveURL(/\/in\/wishlist/);
  });

  test('should navigate to account page', async ({ page }) => {
    await page.click('text=Account');
    await expect(page).toHaveURL(/\/in\/account/);
  });
});

test.describe('Footer Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/in');
  });

  test('should navigate to help page from footer', async ({ page }) => {
    await page.click('footer >> text=Help Center');
    await expect(page).toHaveURL(/\/in\/help/);
  });

  test('should navigate to shipping info from footer', async ({ page }) => {
    await page.click('footer >> text=Shipping Info');
    await expect(page).toHaveURL(/\/in\/shipping/);
  });

  test('should navigate to returns page from footer', async ({ page }) => {
    await page.click('footer >> text=Returns');
    await expect(page).toHaveURL(/\/in\/returns/);
  });

  test('should navigate to contact page from footer', async ({ page }) => {
    await page.click('footer >> text=Contact Us');
    await expect(page).toHaveURL(/\/in\/contact/);
  });

  test('should navigate to FAQ page from footer', async ({ page }) => {
    await page.click('footer >> text=FAQ');
    await expect(page).toHaveURL(/\/in\/faq/);
  });

  test('should navigate to privacy policy', async ({ page }) => {
    await page.click('footer >> text=Privacy Policy');
    await expect(page).toHaveURL(/\/in\/privacy/);
  });

  test('should navigate to terms of service', async ({ page }) => {
    await page.click('footer >> text=Terms of Service');
    await expect(page).toHaveURL(/\/in\/terms/);
  });
});

test.describe('Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should show hamburger menu on mobile', async ({ page }) => {
    await page.goto('/in');
    const menuButton = page.locator('button[aria-label*="menu"], button:has(svg)').first();
    await expect(menuButton).toBeVisible();
  });

  test('should open mobile menu when hamburger clicked', async ({ page }) => {
    await page.goto('/in');
    const menuButton = page.locator('button[aria-label*="menu"]').first();
    await menuButton.click();
    // Check that mobile nav items are visible
    await expect(page.locator('nav >> text=Collections').first()).toBeVisible();
  });
});
