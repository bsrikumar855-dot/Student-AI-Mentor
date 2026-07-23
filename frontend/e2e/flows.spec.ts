import { test, expect } from '@playwright/test';

test.describe('Drishta E2E Core Journeys', () => {
  
  test('Flow A: Student completes a daily mission target and goal streak increments', async ({ page }) => {
    // 1. Load the authentication screen
    await page.goto('/app/login');
    await expect(page.locator('h1')).toContainText('Drishta');

    // 2. Click quick enter shortcut for Student Companion
    await page.getByRole('button', { name: 'Enter as Student (Aisha)' }).click();
    await page.waitForURL('**/app/today');

    // 3. Confirm daily greeting and targets load
    await expect(page.locator('h1')).toContainText('Alex Mercer');
    
    // 4. Capture current streak indicator value
    const streakElement = page.locator('[title="Goal Met Streak"] span').first();
    await expect(streakElement).toBeVisible();
    const originalStreakText = await streakElement.textContent();
    const originalStreak = parseInt(originalStreakText || '0', 10);

    // 5. Locate the first uncompleted mission checkbox button
    const firstCheckbox = page.getByRole('button', { name: 'Mark task complete' }).first();
    await expect(firstCheckbox).toBeVisible();

    // 6. Click the checkbox to trigger optimistic mutation complete task
    await firstCheckbox.click();

    // 7. Verify streak count increments by 1
    await expect(streakElement).toHaveText((originalStreak + 1).toString());

    // 8. Uncheck the checkbox and confirm streak rolls back
    await page.getByRole('button', { name: 'Mark task incomplete' }).first().click();
    await expect(streakElement).toHaveText(originalStreak.toString());
  });

  test('Flow B: Faculty opens reviews queue, approves manual intervention, and clears queue row', async ({ page }) => {
    // 1. Load login page and bypass via Faculty Console quick enter
    await page.goto('/app/login');
    await page.getByRole('button', { name: 'Enter as Faculty' }).click();
    await page.waitForURL('**/app/console*');

    // 2. Click Oversight Queue to view pending safety override targets
    await page.getByRole('button', { name: 'Oversight Queue' }).click();
    await page.waitForURL('**/app/console/reviews');

    // 3. Verify pending intervention reviews load
    const pendingHeader = page.locator('text=Pending Safety Reviews');
    await expect(pendingHeader).toBeVisible();

    // 4. Verify a specific student intervention alert is listed
    const targetStudentName = page.locator('text=Alex Mercer').first();
    await expect(targetStudentName).toBeVisible();

    // 5. Click the Approve button on the student row to expand notes lever field
    await page.getByRole('button', { name: 'Approve Target' }).first().click();
    
    // 6. Focus and fill out the faculty reason textarea note
    const noteArea = page.locator('textarea');
    await expect(noteArea).toBeVisible();
    await noteArea.fill('Approved via Playwright automated E2E script pipeline.');

    // 7. Click Commit Decision to trigger review mutation
    await page.getByRole('button', { name: 'Commit Decision' }).click();

    // 8. Confirm the reviewed intervention is cleared from the pending queue list
    await expect(page.locator('text=Approved via Playwright automated E2E script pipeline')).toBeHidden();
    // Verify that the count decreases or student name is no longer displayed as pending
    await expect(page.locator('text=Pending Safety Reviews (2)')).toBeVisible();
  });
});
