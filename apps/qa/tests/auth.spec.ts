import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  const randomSuffix = Math.floor(Math.random() * 1000000);
  const testEmail = `testuser_${randomSuffix}@example.com`;
  const testPassword = 'StrongPassword123!';

  test('should register a new user successfully', async ({ page }) => {
    await page.goto('/auth');

    // Switch to Register tab
    // We can rely on the fact that the register button is the second button in the tab list
    // However, it's safer to locate by text, but since it's translated, we can click the button that is NOT currently active
    // The inactive button has 'text-zinc-500' class
    await page.locator('button.text-zinc-500').click();

    // Fill the registration form
    await page.locator('input[placeholder="Jane Doe"]').fill(`Test User ${randomSuffix}`);
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').fill(testPassword);

    // Submit form
    await page.locator('button[type="submit"]').click();

    // After successful registration, it should redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Verify dashboard loaded by looking for expected elements
    // The dashboard usually contains 'مشاريعي' or a 'Copilot' button
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('should fail login with invalid credentials', async ({ page }) => {
    await page.goto('/auth');

    // By default, it's on Login tab
    await page.locator('input[type="email"]').fill('invalid_user@example.com');
    await page.locator('input[type="password"]').fill('WrongPassword!');

    // Submit form
    await page.locator('button[type="submit"]').click();

    // Expect error message
    const errorBanner = page.locator('.bg-rose-500\\/10');
    await expect(errorBanner).toBeVisible({ timeout: 5000 });
  });
});
