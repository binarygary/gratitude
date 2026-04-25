import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import EntrySyncStatus from './EntrySyncStatus';

describe('EntrySyncStatus', () => {
    it('keeps rejected alert actions outside the alert region', () => {
        const markup = renderToStaticMarkup(createElement(EntrySyncStatus, {
            mode: 'alert',
            onEdit: vi.fn(),
            status: 'rejected',
        }));
        const alertIndex = markup.indexOf('role="alert"');
        const actionWrapperIndex = markup.indexOf('class="flex shrink-0');

        expect(alertIndex).toBeGreaterThan(-1);
        expect(actionWrapperIndex).toBeGreaterThan(alertIndex);
        expect(markup).toContain('<button');
        expect(markup.slice(alertIndex, actionWrapperIndex)).not.toContain('<button');
    });
});
