import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.APP_PORT ?? '8000');
const baseURL = process.env.APP_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
    testDir: './tests/Browser',
    fullyParallel: true,
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
    use: {
        baseURL,
        trace: 'retain-on-failure',
    },
    webServer: {
        command: `php artisan serve --host=127.0.0.1 --port=${port}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
