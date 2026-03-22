import { expect, test } from '@playwright/test';

test('root redirects to today', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/today$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Today', exact: true })).toBeVisible();
});

test('guest can save an entry and see it after reload', async ({ page }) => {
    await page.goto('/today');

    const prompts = page.getByRole('textbox');

    await prompts.nth(0).fill('My partner checked in on me.');
    await prompts.nth(1).fill('A calm walk outside reset the day.');
    await prompts.nth(2).fill('A quiet evening and a safe home.');

    await page.getByRole('button', { name: 'Save entry' }).click();

    await expect(page.getByText('Last saved')).toBeVisible();

    await page.reload();

    await expect(prompts.nth(0)).toHaveValue('My partner checked in on me.');
    await expect(prompts.nth(1)).toHaveValue('A calm walk outside reset the day.');
    await expect(prompts.nth(2)).toHaveValue('A quiet evening and a safe home.');
});
