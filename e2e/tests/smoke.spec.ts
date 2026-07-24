import { test, expect } from '@playwright/test';

/**
 * Smoke tests (tagged @smoke) — the minimal "is the deployed stack alive?"
 * checks. Run on every PR via `playwright test --grep @smoke`. If these fail
 * the environment is broken; the fuller suites won't be meaningful.
 */
test.describe('@smoke', () => {
  test('the notes page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /my notes/i })).toBeVisible();
  });

  test('creating a note opens the editor', async ({ page }) => {
    await page.goto('/');
    await page
      .getByRole('button', { name: /new note|create your first note/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/notes\/.+/);
    await expect(page.getByPlaceholder('Note title')).toBeVisible();
  });
});
