import { test, expect } from '@playwright/test';

test.describe('Full Scan Execution Flow', () => {
  // Use a longer timeout because the AI responses can take 15-30 seconds each step
  test.setTimeout(180000); 

  test('should run a complete Copilot flow to generate a scan', async ({ page }) => {
    // 1. Setup - Log in
    const randomSuffix = Math.floor(Math.random() * 1000000);
    const testEmail = `scan_tester_${randomSuffix}@example.com`;
    
    await page.goto('/auth');
    await page.locator('button.text-zinc-500').click(); // Switch to Register
    await page.locator('input[placeholder="Jane Doe"]').fill(`Scanner ${randomSuffix}`);
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').fill('StrongPassword123!');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    // 2. Navigate to Copilot
    await page.goto('/copilot');
    
    // Wait for Copilot input textarea
    const ideaInput = page.locator('textarea');
    await expect(ideaInput).toBeVisible();
    
    // Fill the idea
    await ideaInput.fill('منصة SaaS تعتمد على الذكاء الاصطناعي لربط المستثمرين بالشركات الناشئة في مراحلها المبكرة بناءً على تحليل سلوك المؤسسين وبيانات السوق الحية لتقليل المخاطر وزيادة فرص النجاح.');
    
    // Submit idea
    await page.locator('button', { hasText: 'تحليل الفكرة والمتابعة' }).click();

    // 3. Wait for AI Questions (this might take up to 30s)
    // We look for the next step button which signifies questions are loaded, or look for the question blocks
    const finalizeButton = page.locator('button', { hasText: 'صياغة الفكرة النهائية' });
    
    // This waits for the questions UI to fully render
    await expect(finalizeButton).toBeVisible({ timeout: 60000 });

    // Answer the questions - click the first option for every question block
    const questionBlocks = page.locator('.glass.rounded-2xl');
    const count = await questionBlocks.count();
    
    // Expect at least 1 question
    expect(count).toBeGreaterThan(0);

    for(let i=0; i<count; i++) {
      // Find the first option button within each question block and click it
      const optionBtn = questionBlocks.nth(i).locator('button').first();
      await optionBtn.click();
    }

    // Click Finalize
    await finalizeButton.click();

    // 4. Wait for Profile (this might take up to 30s)
    const launchScanBtn = page.locator('button', { hasText: 'إطلاق تقييم قُوم المتكامل' });
    await expect(launchScanBtn).toBeVisible({ timeout: 60000 });
    
    // Click Launch
    await launchScanBtn.click();

    // 5. Wait for redirect to ScanResult
    await page.waitForURL('**/scan/**', { timeout: 20000 });
    
    // Verify the ScanResult page is loading or loaded
    // Depending on the app logic, we might see the loading pipeline or the final result.
    // The pipeline creates a Loader interface first, then the result.
    const resultTitle = page.locator('h1.text-gradient-cyan', { hasText: 'جاري فحص' });
    // Or it might be the final text "بطاقة الجواز" or "التقييم الشامل". We just check the URL.
    await expect(page).toHaveURL(/.*\/scan\/[a-zA-Z0-9-]{10,}/);
    
    // We can wait for the report to fully finish, which takes 30-60s
    // The passport decision element or synthesis section
    const synthesisHeading = page.locator('h2', { hasText: 'التوليفة الاستراتيجية' });
    await expect(synthesisHeading).toBeVisible({ timeout: 120000 });
  });
});
