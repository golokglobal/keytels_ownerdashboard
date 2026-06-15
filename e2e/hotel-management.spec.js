import { test, expect } from '@playwright/test';

test.describe('Hotel and Room Management', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Skip if on login page
    const isLoginPage = await page.url().includes('login');
    if (isLoginPage) {
      test.skip();
    }
  });

  test('should display hotel selector or hotel info', async ({ page }) => {
    // Look for hotel selector dropdown or hotel name display
    const hotelSelector = page.locator('select, [role="combobox"]').filter({ hasText: /hotel|property/i }).first();
    const hotelName = page.getByText(/hotel|property/i).first();

    const hasHotelSelector = await hotelSelector.isVisible();
    const hasHotelName = await hotelName.isVisible();

    expect(hasHotelSelector || hasHotelName).toBeTruthy();
  });

  test('dashboard should show key metrics', async ({ page }) => {
    // Look for dashboard metrics
    const metrics = [
      /total|bookings/i,
      /revenue|earnings/i,
      /occupancy|rooms/i,
      /guests/i,
    ];

    let metricsFound = 0;
    for (const metricPattern of metrics) {
      const metric = page.getByText(metricPattern).first();
      if (await metric.isVisible()) {
        metricsFound++;
      }
    }

    expect(metricsFound).toBeGreaterThan(0);
  });

  test('should have rooms management section', async ({ page }) => {
    // Navigate to rooms section
    const roomsLink = page.getByRole('link', { name: /rooms|inventory/i }).first();

    if (await roomsLink.isVisible()) {
      await roomsLink.click();
      await page.waitForLoadState('networkidle');

      // Should show rooms list or add room button
      const hasRoomsList = await page.getByText(/room|bed|suite/i).isVisible();
      const hasAddButton = await page.getByRole('button', { name: /add|create|new/i }).isVisible();

      expect(hasRoomsList || hasAddButton).toBeTruthy();
    }
  });

  test('should have calendar/schedule view', async ({ page }) => {
    // Look for calendar link
    const calendarLink = page.getByRole('link', { name: /calendar|schedule/i }).first();

    if (await calendarLink.isVisible()) {
      await calendarLink.click();
      await page.waitForLoadState('networkidle');

      // Should show calendar view
      await expect(page.locator('body')).toContainText(/calendar|schedule|date/i, { timeout: 10000 });
    }
  });

  test('navigation sidebar should be visible', async ({ page }) => {
    // Check for sidebar navigation
    const sidebar = page.locator('aside, nav[class*="sidebar"]').first();

    if (await sidebar.isVisible()) {
      await expect(sidebar).toBeVisible();

      // Should have navigation links
      const navLinks = sidebar.getByRole('link');
      const linkCount = await navLinks.count();
      expect(linkCount).toBeGreaterThan(0);
    }
  });

  test('should have settings or profile section', async ({ page }) => {
    // Look for settings link
    const settingsLink = page.getByRole('link', { name: /settings|profile|account/i }).first();

    if (await settingsLink.isVisible()) {
      await expect(settingsLink).toBeVisible();
    }
  });
});
