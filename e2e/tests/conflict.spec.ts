import { test, expect } from '@playwright/test';

/**
 * The signature end-to-end scenario: two independent sessions edit the same
 * note. The second save is rejected by the backend's optimistic lock (409) and
 * the UI surfaces the conflict-resolution dialog. This is the app's defining
 * behaviour, verified through the real stack.
 */
test('concurrent edits trigger the conflict-resolution dialog', async ({ browser }) => {
  const sessionA = await browser.newContext();
  const sessionB = await browser.newContext();
  const a = await sessionA.newPage();
  const b = await sessionB.newPage();

  // Session A creates a note.
  await a.goto('/');
  await a
    .getByRole('button', { name: /new note|create your first note/i })
    .first()
    .click();
  await expect(a).toHaveURL(/\/notes\/.+/);
  const noteUrl = a.url();

  // Session B opens the same note.
  await b.goto(noteUrl);
  await expect(b.getByPlaceholder('Note title')).toBeVisible();

  // B edits and lets autosave persist first (advancing the note's updatedAt).
  await b.getByPlaceholder('Note title').fill('Edited by B');
  await expect(b.getByText('Saved')).toBeVisible({ timeout: 5000 });

  // A now edits with a stale updatedAt and saves -> conflict.
  await a.getByPlaceholder('Note title').fill('Edited by A');
  await a.getByTitle('Save (Ctrl+S)').click();
  await expect(a.getByText(/conflict detected/i)).toBeVisible({ timeout: 5000 });

  // A can resolve by taking the server version.
  await a.getByRole('button', { name: /use server version/i }).click();
  await expect(a.getByDisplayValue('Edited by B')).toBeVisible();

  await sessionA.close();
  await sessionB.close();
});
