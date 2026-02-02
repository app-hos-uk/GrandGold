import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/in');
  });

  test('should display GrandGold branding', async ({ page }) => {
    await expect(page.locator('text=GrandGold')).toBeVisible();
  });

  test('should show hero section with CTA buttons', async ({ page }) => {
    await expect(page.locator('text=Discover Exquisite Gold Jewellery')).toBeVisible();
    await expect(page.locator('text=Explore Collection')).toBeVisible();
    await expect(page.locator('text=Try AR Experience')).toBeVisible();
  });

  test('should display live gold price in header', async ({ page }) => {
    await expect(page.locator('text=Live Gold')).toBeVisible();
    await expect(page.locator('text=24K')).toBeVisible();
  });

  test('should have working navigation links', async ({ page }) => {
    // Check that main nav links are present
    await expect(page.locator('nav >> text=Collections')).toBeVisible();
    await expect(page.locator('nav >> text=Necklaces')).toBeVisible();
    await expect(page.locator('nav >> text=Earrings')).toBeVisible();
    await expect(page.locator('nav >> text=Rings')).toBeVisible();
    await expect(page.locator('nav >> text=Bracelets')).toBeVisible();
    await expect(page.locator('nav >> text=AR Try-On')).toBeVisible();
  });

  test('should navigate to collections page', async ({ page }) => {
    await page.click('text=Explore Collection');
    await expect(page).toHaveURL(/\/in\/collections/);
  });

  test('should display footer with all sections', async ({ page }) => {
    await expect(page.locator('footer >> text=Shop')).toBeVisible();
    await expect(page.locator('footer >> text=Services')).toBeVisible();
    await expect(page.locator('footer >> text=Account')).toBeVisible();
    await expect(page.locator('footer >> text=Support')).toBeVisible();
  });

  test('should show newsletter subscription form', async ({ page }) => {
    await expect(page.locator('text=Stay Updated')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button >> text=Subscribe')).toBeVisible();
  });
});

test.describe('Country Routing', () => {
  test('should redirect root to /in by default', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/(in|ae|uk)/);
  });

  test('should display India content on /in', async ({ page }) => {
    await page.goto('/in');
    await expect(page.locator('text=🇮🇳 India')).toBeVisible();
    await expect(page.locator('text=₹')).toBeVisible();
  });

  test('should display UAE content on /ae', async ({ page }) => {
    await page.goto('/ae');
    await expect(page.locator('text=🇦🇪 UAE')).toBeVisible();
  });

  test('should display UK content on /uk', async ({ page }) => {
    await page.goto('/uk');
    await expect(page.locator('text=🇬🇧 UK')).toBeVisible();
    await expect(page.locator('text=£')).toBeVisible();
  });
});
