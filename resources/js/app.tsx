import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import type { ComponentType, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';

type PageComponent = ComponentType & {
    layout?: ComponentType<{ children: ReactNode }> | ComponentType<{ children: ReactNode }>[] | ((page: ReactNode) => ReactNode) | ((props: unknown) => ReactNode);
};

type PageModule = {
    default: PageComponent;
};

createInertiaApp({
    defaults: {
        future: {
            useScriptElementForInitialPage: true,
        },
    },
    resolve: async (name) => {
        const page = await resolvePageComponent<PageModule>(`./Pages/${name}.tsx`, import.meta.glob<PageModule>('./Pages/**/*.tsx'));

        return page.default;
    },
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
    progress: {
        color: '#2b3440',
    },
});
