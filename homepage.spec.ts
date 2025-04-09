import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load the homepage successfully', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Check if the page title is as expected
    const title = await page.title();
    expect(title).toContain('Instructor Chat System');
  });

  test('should display the main navigation', async ({ page }) => {
    await page.goto('/');

    // Wait for the navigation elements to be visible
    await page.waitForSelector('nav');

    // Check if navigation contains expected links
    expect(await page.isVisible('a[href="/"]')).toBeTruthy();
    expect(await page.isVisible('a[href="/chat"]')).toBeTruthy();
    expect(await page.isVisible('a[href="/profile"]')).toBeTruthy();
  });

  test('should allow theme toggling', async ({ page }) => {
    await page.goto('/');

    // Find and click the theme toggle button
    const themeToggle = page.locator('button[aria-label="Toggle theme"]');
    await themeToggle.click();

    // Check that the theme has changed (e.g., by checking a CSS class or data attribute)
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'dark');

    // Toggle back to light theme
    await themeToggle.click();
    await expect(html).toHaveAttribute('data-theme', 'light');
  });

  test('should display course cards on homepage', async ({ page }) => {
    await page.goto('/');

    // Wait for course cards to load
    await page.waitForSelector('[data-testid="course-card"]', { timeout: 5000 });

    // Check if multiple course cards are present
    const courseCards = await page.locator('[data-testid="course-card"]').count();
    expect(courseCards).toBeGreaterThan(0);
  });

  test('should allow searching for courses', async ({ page }) => {
    await page.goto('/');

    // Find search input and enter a search term
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('TypeScript');
    await searchInput.press('Enter');

    // Check that the search results are displayed
    await page.waitForSelector('[data-testid="search-results"]');
    const searchResults = page.locator('[data-testid="search-results"]');
    await expect(searchResults).toBeVisible();

    // Check that the URL contains the search query
    expect(page.url()).toContain('search=TypeScript');
  });

  test('should have functional mobile navigation on small screens', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Wait for mobile menu button to be visible
    await page.waitForSelector('[data-testid="mobile-menu-button"]');

    // Check if mobile menu button exists
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
    await expect(mobileMenuButton).toBeVisible();

    // Click mobile menu button to open menu
    await mobileMenuButton.click();

    // Check if mobile menu is open and contains navigation links
    const mobileMenu = page.locator('[data-testid="mobile-menu"]');
    await expect(mobileMenu).toBeVisible();

    // Check that navigation links are visible in mobile menu
    await expect(page.locator('a[href="/chat"]')).toBeVisible();
    await expect(page.locator('a[href="/profile"]')).toBeVisible();
  });
});
