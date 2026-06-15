# Playwright Testing Guide - Keytels Owner Dashboard

## Overview

This project uses [Playwright](https://playwright.dev/) for end-to-end testing of the hotel owner dashboard. Playwright enables reliable testing across Chromium, Firefox, and WebKit browsers.

## Installation

Playwright is already installed as a dev dependency. If you need to reinstall:

```bash
npm install -D @playwright/test
npx playwright install
```

## Running Tests

### All Tests (Headless Mode)
```bash
npm test
```

### Interactive UI Mode (Recommended for Development)
```bash
npm run test:ui
```
This opens the Playwright Test UI where you can:
- See all your tests
- Run tests individually or in groups
- Watch mode for automatic re-runs
- Time travel through test execution
- View detailed traces

### Headed Mode (See Browser)
```bash
npm run test:headed
```

### Debug Mode
```bash
npm run test:debug
```
Opens Playwright Inspector for step-by-step debugging.

### Run Specific Browser
```bash
npm run test:chromium   # Chrome/Edge
npm run test:firefox    # Firefox
npm run test:webkit     # Safari
```

### Run Specific Test File
```bash
npx playwright test e2e/owner-auth.spec.js
```

### Run Tests Matching a Pattern
```bash
npx playwright test --grep "bookings"
```

## Viewing Test Reports

After test execution, view the HTML report:

```bash
npm run test:report
```

## Test Structure

Tests are organized in the `e2e/` directory:

```
e2e/
├── owner-auth.spec.js           # Owner authentication tests
├── bookings-management.spec.js  # Bookings and guest management
└── hotel-management.spec.js     # Hotel and room management
```

## Writing New Tests

### Basic Test Example

```javascript
import { test, expect } from '@playwright/test';

test('should display dashboard', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/dashboard/i)).toBeVisible();
});
```

### Authentication Helper

For tests requiring login:

```javascript
test.beforeEach(async ({ page }) => {
  await page.goto('/');

  // Login if needed
  const isLoginPage = await page.url().includes('login');
  if (isLoginPage) {
    await page.getByRole('textbox', { name: /email/i }).fill('owner@test.com');
    await page.getByLabel(/password/i).fill('testpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForLoadState('networkidle');
  }
});
```

### Best Practices

1. **Use Descriptive Test Names**
   ```javascript
   test('should allow check-in of confirmed booking', async ({ page }) => {
     // Test code
   });
   ```

2. **Use Built-in Locators**
   ```javascript
   // Good
   await page.getByRole('button', { name: /check in/i }).click();

   // Avoid
   await page.click('.checkin-btn');
   ```

3. **Handle Authentication State**
   ```javascript
   test.beforeEach(async ({ page }) => {
     const isLoginPage = await page.url().includes('login');
     if (isLoginPage) {
       test.skip(); // Skip if authentication is required
     }
   });
   ```

4. **Group Related Tests**
   ```javascript
   test.describe('Booking Operations', () => {
     test('check-in', async ({ page }) => { });
     test('check-out', async ({ page }) => { });
     test('cancel', async ({ page }) => { });
   });
   ```

## Configuration

Test configuration is in `playwright.config.js`:

- **Base URL**: http://localhost:5174 (owner dashboard port)
- **Timeout**: 30 seconds per test
- **Retries**: 2 on CI, 0 locally
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Auto-start dev server**: Yes (runs `npm run dev`)

### Environment Variables

Set custom base URL:
```bash
BASE_URL=http://localhost:3000 npm test
```

## Test Reports

Test results are saved in:
- `test-results/` - Screenshots, videos, traces
- `playwright-report/` - HTML report
- `test-results/results.json` - JSON report for CI

These directories are gitignored.

## Debugging Failed Tests

1. **View trace in UI mode**
   ```bash
   npm run test:ui
   ```

2. **Check screenshots**
   Screenshots are automatically taken on test failures in `test-results/`

3. **Watch test execution**
   ```bash
   npm run test:headed
   ```

4. **Use debug mode**
   ```bash
   npm run test:debug
   ```

## CI/CD Integration

For GitHub Actions, add:

```yaml
- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run Playwright Tests
  run: npm test

- name: Upload Test Results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests (headless) |
| `npm run test:ui` | Open interactive UI |
| `npm run test:headed` | Run with visible browser |
| `npm run test:debug` | Debug mode with inspector |
| `npm run test:report` | View HTML report |
| `npx playwright codegen http://localhost:5174` | Generate tests by recording |

## Test Coverage Areas

### ✅ Owner Authentication
- Login form validation
- Error handling
- Required field validation

### ✅ Bookings Management
- Bookings list display
- Status filters
- Booking details modal
- Search functionality
- Check-in/check-out buttons

### ✅ Hotel & Room Management
- Hotel selector
- Dashboard metrics
- Rooms management section
- Calendar/schedule view
- Navigation sidebar

### 📝 To Be Added
- Complete check-in flow (with authentication)
- Complete check-out flow
- Room creation and editing
- Guest information management
- Revenue reports testing
- Payment transfer verification

## Tips for Effective Testing

1. **Keep tests independent** - Each test should work in isolation
2. **Use data-testid attributes** - Add to important dashboard elements
3. **Test workflows, not UI** - Focus on business operations
4. **Mock API responses** - For consistent test data
5. **Use fixtures** - For common setup data
6. **Test error states** - Network failures, validation errors

## Troubleshooting

### Tests timing out
- Increase timeout in config: `timeout: 60000`
- Check API requests are completing
- Verify dev server is running

### Authentication issues
- Use `test.skip()` for tests requiring auth
- Consider using Playwright's auth state storage
- Check token expiration

### Can't find elements
- Use Playwright Inspector: `npm run test:debug`
- Check if element is in a modal or different page
- Verify element is visible (not hidden by CSS)

### Data-dependent tests failing
- Use fixtures or test data setup
- Reset database state between tests
- Mock API responses for consistent results

## Advanced Features

### Page Object Model

Create reusable page objects:

```javascript
// pages/BookingsPage.js
export class BookingsPage {
  constructor(page) {
    this.page = page;
    this.bookingsList = page.locator('[data-testid="bookings-list"]');
    this.checkInButton = page.getByRole('button', { name: /check in/i });
  }

  async goto() {
    await this.page.goto('/bookings');
  }

  async checkInBooking(bookingId) {
    await this.checkInButton.first().click();
  }
}

// In test file
import { BookingsPage } from './pages/BookingsPage';

test('check in booking', async ({ page }) => {
  const bookingsPage = new BookingsPage(page);
  await bookingsPage.goto();
  await bookingsPage.checkInBooking('123');
});
```

### API Mocking

```javascript
test('should display bookings', async ({ page }) => {
  // Mock API response
  await page.route('**/api/hotels/*/bookings', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { bookingId: '1', guestName: 'Test Guest', status: 'BOOKED' }
      ])
    });
  });

  await page.goto('/bookings');
  await expect(page.getByText('Test Guest')).toBeVisible();
});
```

### Visual Regression Testing

```javascript
test('dashboard should match screenshot', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('dashboard.png');
});
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [Authentication Guide](https://playwright.dev/docs/auth)

---

**Happy Testing! 🎭**
