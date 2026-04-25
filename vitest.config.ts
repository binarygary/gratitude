import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['resources/js/**/*.test.ts'],
        setupFiles: ['./tests/js/setup.ts'],
    },
});
