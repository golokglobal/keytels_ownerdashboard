import { test, expect } from '@playwright/test';

test.describe('Owner Authentication', () => {

  test('should display owner login page', async ({ page }) => {
    await page.goto('/');

    // Should show login page or redirect to login
    const isLoginPage = await page.url().includes('login') ||
                        await page.getByText(/sign in|login/i).isVisible();
    expect(isLoginPage).toBeTruthy();
  });

  test('login form should have required fields', async ({ page }) => {
    await page.goto('/');

    // Check for login form elements
    await expect(page.getByRole('textbox', { name: /email|username/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|login|submit/i })).toBeVisible();
  });

  test('should show validation error for empty submission', async ({ page }) => {
    await page.goto('/');

    // Submit empty form
    const submitButton = page.getByRole('button', { name: /sign in|login|submit/i });
    await submitButton.click();

    // Should show validation errors
    const errorMessages = page.locator('text=/required|invalid|enter/i');
    const errorCount = await errorMessages.count();
    expect(errorCount).toBeGreaterThan(0);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/');

    // Fill invalid credentials
    await page.getByRole('textbox', { name: /email|username/i }).fill('invalid@test.com');
    await page.getByLabel(/password/i).fill('wrongpassword');

    // Submit
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Wait for error message
    await expect(page.getByText(/invalid|incorrect|failed|error/i)).toBeVisible({ timeout: 10000 });
  });
});
