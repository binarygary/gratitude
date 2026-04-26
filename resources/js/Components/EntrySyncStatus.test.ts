import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import EntrySyncStatus from './EntrySyncStatus';

describe('EntrySyncStatus', () => {
    it('renders compact visible status text without long explanatory copy', () => {
        const markup = renderToStaticMarkup(createElement(EntrySyncStatus, {
            status: 'rejected',
        }));

        expect(markup).toContain('Rejected');
        expect(markup).toContain('This entry is saved on this device, but it needs changes before it can sync.');
        expect(markup).not.toContain('>This entry is saved on this device, but it needs changes before it can sync.<');
    });

    it('uses a restrained rejected callout instead of a full red alert panel', () => {
        const markup = renderToStaticMarkup(createElement(EntrySyncStatus, {
            mode: 'alert',
            onEdit: vi.fn(),
            status: 'rejected',
        }));

        expect(markup).toContain('role="alert"');
        expect(markup).not.toContain('alert-error');
        expect(markup).toContain('border-error/30');
        expect(markup).toContain('Edit entry');
    });

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
