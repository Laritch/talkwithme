import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the homepage
    await page.goto('/');
  });

  test('should navigate to sign in page', async ({ page }) => {
    // Click the sign in button/link
    await page.click('a[href="/auth/signin"]');

    // Verify we're on the sign in page
    await expect(page).toHaveURL(/.*\/auth\/signin/);

    // Check if the sign in form is displayed
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should display validation errors on sign in form', async ({ page }) => {
    // Navigate to sign in page
    await page.goto('/auth/signin');

    // Submit the form without filling it
    await page.click('button[type="submit"]');

    // Check for validation error messages
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();

    // Fill in an invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.click('button[type="submit"]');

    // Check for email validation error
    await expect(page.locator('text=Please enter a valid email')).toBeVisible();
  });

  test('should navigate to sign up page', async ({ page }) => {
    // Navigate to sign in page first
    await page.goto('/auth/signin');

    // Click the sign up link
    await page.click('a[href="/auth/signup"]');

    // Verify we're on the sign up page
    await expect(page).toHaveURL(/.*\/auth\/signup/);

    // Check if the sign up form is displayed with all required fields
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should attempt sign in with invalid credentials', async ({ page }) => {
    // Navigate to sign in page
    await page.goto('/auth/signin');

    // Fill in the form with invalid credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    // Submit the form
    await page.click('button[type="submit"]');

    // Check for authentication error message
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });

  test('should navigate to password reset page', async ({ page }) => {
    // Navigate to sign in page
    await page.goto('/auth/signin');

    // Click the forgot password link
    await page.click('a[href="/auth/forgot-password"]');

    // Verify we're on the password reset page
    await expect(page).toHaveURL(/.*\/auth\/forgot-password/);

    // Check if the password reset form is displayed
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should submit password reset request', async ({ page }) => {
    // Navigate to password reset page
    await page.goto('/auth/forgot-password');

    // Fill in the email
    await page.fill('input[type="email"]', 'test@example.com');

    // Submit the form
    await page.click('button[type="submit"]');

    // Check for success message
    await expect(page.locator('text=Password reset instructions have been sent to your email')).toBeVisible();
  });

  // This test requires a valid user account that you can test with
  test.skip('should sign in with valid credentials and redirect to dashboard', async ({ page }) => {
    // Navigate to sign in page
    await page.goto('/auth/signin');

    // Fill in the form with valid credentials (use test account credentials)
    await page.fill('input[type="email"]', 'valid-user@example.com');
    await page.fill('input[type="password"]', 'ValidPassword123!');

    // Submit the form
    await page.click('button[type="submit"]');

    // Verify redirection to dashboard/homepage after successful login
    await expect(page).toHaveURL('/');

    // Check if user is logged in (e.g., profile avatar or username is visible)
    await expect(page.locator('text=valid-user@example.com')).toBeVisible();
  });
});
