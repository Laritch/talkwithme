import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display the landing page', async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');

    // Verify the title of the page
    await expect(page).toHaveTitle(/Instructor Chat System/);

    // Verify some content from the landing page is visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');

    // Verify navigation links are present
    await expect(page.getByRole('link', { name: /courses/i })).toBeVisible();

    // Click on the courses link
    await page.getByRole('link', { name: /courses/i }).click();

    // Verify that we navigated to the courses page
    await expect(page.url()).toContain('/courses');
  });

  test('should be responsive', async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');

    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify mobile menu button is visible
    await expect(page.getByRole('button', { name: /menu/i })).toBeVisible();

    // Open mobile menu
    await page.getByRole('button', { name: /menu/i }).click();

    // Verify navigation links are visible in mobile menu
    await expect(page.getByRole('link', { name: /courses/i })).toBeVisible();

    // Set viewport back to desktop size
    await page.setViewportSize({ width: 1280, height: 720 });

    // Verify desktop navigation is visible
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('should have working search functionality', async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');

    // Find and click the search button
    await page.getByRole('button', { name: /search/i }).click();

    // Type something in the search field
    await page.getByPlaceholder(/search/i).fill('javascript');

    // Press Enter to submit the search
    await page.getByPlaceholder(/search/i).press('Enter');

    // Verify we've navigated to search results page
    await expect(page.url()).toContain('/search');
    await expect(page.url()).toContain('q=javascript');

    // Verify search results heading is visible
    await expect(page.getByRole('heading', { name: /search results/i })).toBeVisible();
  });
});
