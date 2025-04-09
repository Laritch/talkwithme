import { test, expect } from '@playwright/test';

test.describe('Courses Page', () => {
  test('should display course listings', async ({ page }) => {
    // Navigate to the courses page
    await page.goto('/courses');

    // Verify the heading exists
    await expect(page.getByRole('heading', { name: /courses/i })).toBeVisible();

    // Verify course cards are displayed
    const courseCards = page.locator('.course-card');
    await expect(courseCards).toHaveCount({ min: 1 });
  });

  test('filtering should work', async ({ page }) => {
    // Navigate to the courses page
    await page.goto('/courses');

    // Check that filters are displayed
    await expect(page.getByRole('combobox', { name: /category/i })).toBeVisible();

    // Select a category filter
    await page.getByRole('combobox', { name: /category/i }).click();
    await page.getByRole('option', { name: /web development/i }).click();

    // Verify filtered results
    await expect(page.url()).toContain('category=web+development');

    // Verify the course cards are updated
    const webDevCourses = page.locator('.course-card');
    await expect(webDevCourses).toHaveCount({ min: 1 });
  });

  test('searching should work', async ({ page }) => {
    // Navigate to the courses page
    await page.goto('/courses');

    // Enter a search term
    await page.getByPlaceholder(/search courses/i).fill('javascript');
    await page.getByPlaceholder(/search courses/i).press('Enter');

    // Verify search results
    await expect(page.url()).toContain('search=javascript');

    // Check if at least one course is displayed
    const searchResults = page.locator('.course-card');
    await expect(searchResults).toHaveCount({ min: 1 });
  });

  test('sorting should work', async ({ page }) => {
    // Navigate to the courses page
    await page.goto('/courses');

    // Open the sort dropdown
    await page.getByRole('combobox', { name: /sort/i }).click();

    // Select sort by price
    await page.getByRole('option', { name: /price/i }).click();

    // Verify sorting parameter in URL
    await expect(page.url()).toContain('sort=price');

    // Verify courses are visible
    const sortedCourses = page.locator('.course-card');
    await expect(sortedCourses).toHaveCount({ min: 1 });
  });

  test('course details page should load', async ({ page }) => {
    // Navigate to the courses page
    await page.goto('/courses');

    // Click on the first course
    await page.locator('.course-card').first().click();

    // Verify we've navigated to a course detail page
    await expect(page.url()).toMatch(/\/courses\/[^/]+$/);

    // Verify course details content is visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/instructor/i)).toBeVisible();

    // Verify enroll button is present
    await expect(page.getByRole('button', { name: /enroll/i })).toBeVisible();
  });

  test('enrollment should work', async ({ page }) => {
    // Navigate to a course detail page
    await page.goto('/courses');
    await page.locator('.course-card').first().click();

    // Click the enroll button
    await page.getByRole('button', { name: /enroll/i }).click();

    // A login modal should appear if not logged in
    const loginForm = page.getByRole('dialog').getByText(/login/i);

    if (await loginForm.isVisible()) {
      // Fill out the login form
      await page.getByLabel(/email/i).fill('john.doe@example.com');
      await page.getByLabel(/password/i).fill('password123');
      await page.getByRole('button', { name: /login/i }).click();

      // After login, the enroll button should be clicked
      await page.getByRole('button', { name: /enroll/i }).click();
    }

    // Verify enrollment confirmation
    await expect(page.getByText(/successfully enrolled/i)).toBeVisible();

    // Verify enrolled status
    await expect(page.getByText(/enrolled/i)).toBeVisible();
  });
});
