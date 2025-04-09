import { test, expect } from '@playwright/test';

// Helper function to login
async function login(page) {
  // Navigate to login page
  await page.goto('/login');

  // Fill in login form
  await page.getByLabel(/email/i).fill('john.doe@example.com');
  await page.getByLabel(/password/i).fill('password123');

  // Submit the form
  await page.getByRole('button', { name: /login/i }).click();

  // Wait for navigation to complete
  await page.waitForURL('/**/');
}

test.describe('Chat Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);

    // Navigate to the chat page
    await page.goto('/chat');
  });

  test('should display the chat interface', async ({ page }) => {
    // Verify chat interface is visible
    await expect(page.getByText(/all chats/i)).toBeVisible();

    // Verify chat list is visible
    await expect(page.locator('.chat-list')).toBeVisible();
  });

  test('should be able to select a chat', async ({ page }) => {
    // Click on the first chat in the list
    await page.locator('.chat-item').first().click();

    // Verify the chat conversation is visible
    await expect(page.locator('.chat-messages')).toBeVisible();

    // Verify message input is available
    await expect(page.getByPlaceholder(/type a message/i)).toBeVisible();
  });

  test('should be able to send a message', async ({ page }) => {
    // Click on the first chat in the list
    await page.locator('.chat-item').first().click();

    // Verify message input is available
    const messageInput = page.getByPlaceholder(/type a message/i);
    await expect(messageInput).toBeVisible();

    // Type a message
    await messageInput.fill('Hello, this is a test message');

    // Send the message
    await page.getByRole('button', { name: /send/i }).click();

    // Verify the message appears in the chat
    await expect(page.getByText('Hello, this is a test message')).toBeVisible();

    // Verify message status indicator is visible
    await expect(page.locator('.message-status')).toBeVisible();
  });

  test('should support file attachments', async ({ page }) => {
    // Click on the first chat in the list
    await page.locator('.chat-item').first().click();

    // Click on the attachment button
    await page.getByRole('button', { name: /attach/i }).click();

    // Set file input
    await page.setInputFiles('input[type="file"]', {
      name: 'test-file.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('This is a test file'),
    });

    // Verify the file is attached
    await expect(page.getByText(/test-file.txt/i)).toBeVisible();

    // Send the message with attachment
    await page.getByRole('button', { name: /send/i }).click();

    // Verify the attachment appears in the chat
    await expect(page.getByText(/test-file.txt/i)).toBeVisible();
  });

  test('should show unread message count', async ({ page }) => {
    // Assuming there's at least one chat with unread messages
    const chatWithUnread = page.locator('.chat-item:has(.unread-count)').first();

    // Verify the unread count is visible
    await expect(chatWithUnread.locator('.unread-count')).toBeVisible();

    // Click on the chat
    await chatWithUnread.click();

    // Verify message thread is loaded
    await expect(page.locator('.chat-messages')).toBeVisible();

    // Navigate back to the chat list (e.g., on mobile view)
    await page.getByRole('tab', { name: /all chats/i }).click();

    // Verify the unread count is now gone for that chat
    await expect(chatWithUnread.locator('.unread-count')).not.toBeVisible();
  });

  test('should handle different message types', async ({ page }) => {
    // Click on a chat that has various message types
    await page.locator('.chat-item').nth(1).click();

    // Verify text messages are visible
    await expect(page.locator('.message-bubble').filter({ hasText: /.+/ })).toBeVisible();

    // If there are image messages, check those too
    const imageMessages = page.locator('.message-image');
    if (await imageMessages.count() > 0) {
      await expect(imageMessages.first()).toBeVisible();
    }

    // If there are file attachments, check those too
    const attachments = page.locator('.message-attachment');
    if (await attachments.count() > 0) {
      await expect(attachments.first()).toBeVisible();
    }
  });

  test('expert chat interface should display credentials', async ({ page }) => {
    // Navigate to an expert chat (e.g., therapy or legal consultation)
    await page.goto('/experts');

    // Click on an expert profile
    await page.locator('.expert-card').first().click();

    // Verify expert profile is visible
    await expect(page.getByRole('heading', { name: /dr\.|esq\./i })).toBeVisible();

    // Verify credentials section is visible
    await expect(page.getByText(/specialization/i)).toBeVisible();

    // Start a chat with the expert
    await page.getByRole('button', { name: /message/i }).click();

    // Verify chat interface is loaded
    await expect(page.locator('.chat-messages')).toBeVisible();

    // Verify expert info badge is displayed in the chat header
    await expect(page.locator('.chat-header .expert-badge')).toBeVisible();
  });
});
