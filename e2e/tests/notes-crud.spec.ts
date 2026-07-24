import { test, expect } from '@playwright/test';

/**
 * End-to-end happy path across the real UI + API + database: create a note,
 * edit it (autosave), see it in the list, then delete it.
 */
test('create, autosave-edit, and delete a note', async ({ page }) => {
  const unique = `E2E note ${Date.now()}`;

  // Create
  await page.goto('/');
  await page
    .getByRole('button', { name: /new note|create your first note/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/notes\/.+/);

  // Edit — autosave should settle to "Saved"
  await page.getByPlaceholder('Note title').fill(unique);
  await page.getByPlaceholder(/start writing/i).fill('Body written by Playwright.');
  await expect(page.getByText('Saved')).toBeVisible({ timeout: 5000 });

  // It appears back on the list
  await page.getByRole('link', { name: /back to notes/i }).click();
  await expect(page.getByText(unique)).toBeVisible();

  // Search narrows to it
  await page.getByPlaceholder(/search notes/i).fill(unique);
  await expect(page.getByText(unique)).toBeVisible();

  // Open and delete
  await page.getByText(unique).click();
  await page.getByTitle('Delete note').click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText(unique)).toHaveCount(0);
});
