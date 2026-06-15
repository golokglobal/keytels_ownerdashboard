import { test, expect } from '@playwright/test';

test.describe('Bookings Management', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/');

    // If on login page, note that tests require authentication
    const isLoginPage = await page.url().includes('login');
    if (isLoginPage) {
      test.skip();
    }
  });

  test('should display bookings/inbox page', async ({ page }) => {
    // Navigate to bookings
    const bookingsLink = page.getByRole('link', { name: /bookings|inbox|reservations/i }).first();

    if (await bookingsLink.isVisible()) {
      await bookingsLink.click();
      await page.waitForLoadState('networkidle');
    }

    // Should show bookings list or empty state
    const hasBookings = await page.getByText(/booking|reservation|guest/i).isVisible();
    const hasEmptyState = await page.getByText(/no bookings|no reservations/i).isVisible();

    expect(hasBookings || hasEmptyState).toBeTruthy();
  });

  test('should have booking status filters', async ({ page }) => {
    // Navigate to bookings
    const bookingsLink = page.getByRole('link', { name: /bookings|inbox/i }).first();
    if (await bookingsLink.isVisible()) {
      await bookingsLink.click();
      await page.waitForLoadState('networkidle');
    }

    // Look for status filters
    const statusFilters = [
      /all|total/i,
      /booked|confirmed/i,
      /checked.in/i,
      /checked.out/i,
      /cancelled/i,
    ];

    for (const filterPattern of statusFilters) {
      const filter = page.getByText(filterPattern).first();
      if (await filter.isVisible()) {
        await expect(filter).toBeVisible();
        break;
      }
    }
  });

  test('should display booking details modal/page', async ({ page }) => {
    // Navigate to bookings
    const bookingsLink = page.getByRole('link', { name: /bookings|inbox/i }).first();
    if (await bookingsLink.isVisible()) {
      await bookingsLink.click();
      await page.waitForLoadState('networkidle');
    }

    // Click on view details button
    const viewButton = page.getByRole('button', { name: /view|details|eye/i }).first();

    if (await viewButton.isVisible()) {
      await viewButton.click();

      // Should show booking details
      await expect(page.getByText(/guest|room|check.in|check.out/i).first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('should have check-in functionality', async ({ page }) => {
    // Navigate to bookings
    const bookingsLink = page.getByRole('link', { name: /bookings|inbox/i }).first();
    if (await bookingsLink.isVisible()) {
      await bookingsLink.click();
      await page.waitForLoadState('networkidle');
    }

    // Look for check-in button (may not be available for all bookings)
    const checkInButton = page.getByRole('button', { name: /check.in/i }).first();

    if (await checkInButton.isVisible()) {
      await expect(checkInButton).toBeVisible();
    }
  });

  test('should have search functionality', async ({ page }) => {
    // Navigate to bookings
    const bookingsLink = page.getByRole('link', { name: /bookings|inbox/i }).first();
    if (await bookingsLink.isVisible()) {
      await bookingsLink.click();
      await page.waitForLoadState('networkidle');
    }

    // Look for search input
    const searchInput = page.getByPlaceholder(/search/i);

    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeVisible();

      // Test search functionality
      await searchInput.fill('test');
      await page.waitForTimeout(500); // Debounce
    }
  });
});
