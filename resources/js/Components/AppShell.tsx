import { Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import BrandName from './BrandName';
import { exportEntries } from '../lib/export';

type Props = {
    children: ReactNode;
};

type SharedProps = {
    auth: {
        user: {
            name: string;
            email: string;
        } | null;
        magic_link: {
            remember_default: boolean;
        };
    };
    flash: {
        status?: string;
    };
    turnstile: {
        enabled: boolean;
        site_key: string | null;
        bypass_token: string | null;
    };
};

type LoginFormData = {
    email: string;
    'cf-turnstile-response': string;
    remember_device: boolean;
};

type TurnstileRenderOptions = {
    sitekey: string;
    size: 'compact';
    callback: (token: string) => void;
    'expired-callback': () => void;
    'error-callback': () => void;
};

declare global {
    interface Window {
        turnstile?: {
            render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
            remove?: (widgetId: string) => void;
            reset?: (widgetId: string) => void;
        };
    }
}

type ThemePreference = 'retro' | 'dim' | 'system';
type ResolvedTheme = 'retro' | 'dim';
const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let turnstileScriptPromise: Promise<void> | null = null;

const themeLabel: Record<ThemePreference, string> = {
    retro: 'Light',
    system: 'System',
    dim: 'Dark',
};

function loadTurnstileScript(): Promise<void> {
    if (window.turnstile) {
        return Promise.resolve();
    }

    if (turnstileScriptPromise) {
        return turnstileScriptPromise;
    }

    turnstileScriptPromise = new Promise((resolve, reject) => {
        const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${TURNSTILE_SCRIPT_URL}"]`);

        if (existingScript) {
            existingScript.addEventListener('load', () => resolve(), { once: true });
            existingScript.addEventListener('error', () => reject(new Error('Turnstile failed to load.')), { once: true });

            return;
        }

        const script = document.createElement('script');
        script.src = TURNSTILE_SCRIPT_URL;
        script.async = true;
        script.defer = true;
        script.addEventListener('load', () => resolve(), { once: true });
        script.addEventListener(
            'error',
            () => {
                turnstileScriptPromise = null;
                reject(new Error('Turnstile failed to load.'));
            },
            { once: true },
        );

        document.head.appendChild(script);
    });

    return turnstileScriptPromise;
}

function storedThemePreference(): ThemePreference {
    const savedTheme = localStorage.getItem('theme');

    return savedTheme === 'retro' || savedTheme === 'dim' || savedTheme === 'system'
        ? savedTheme
        : 'system';
}

function ThemeIcon({ preference }: { preference: ThemePreference }) {
    if (preference === 'retro') {
        return (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2.5v2.2M12 19.3v2.2M4.7 4.7l1.6 1.6M17.7 17.7l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.7 19.3l1.6-1.6M17.7 6.3l1.6-1.6" />
            </svg>
        );
    }

    if (preference === 'dim') {
        return (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M14.5 3.2a8.8 8.8 0 1 0 6.3 14.7A7.7 7.7 0 1 1 14.5 3.2Z" />
            </svg>
        );
    }

    return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <rect x="4" y="5" width="16" height="11" rx="2" />
            <path d="M9 19h6M12 16v3" />
        </svg>
    );
}

function TurnstileWidget({
    siteKey,
    resetKey,
    onToken,
    onClear,
}: {
    siteKey: string;
    resetKey: number;
    onToken: (token: string) => void;
    onClear: () => void;
}) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const widgetIdRef = useRef<string | null>(null);
    const onTokenRef = useRef(onToken);
    const onClearRef = useRef(onClear);

    useEffect(() => {
        onTokenRef.current = onToken;
        onClearRef.current = onClear;
    }, [onToken, onClear]);

    useEffect(() => {
        let cancelled = false;

        void loadTurnstileScript()
            .then(() => {
                if (cancelled || !containerRef.current || !window.turnstile || widgetIdRef.current) {
                    return;
                }

                widgetIdRef.current = window.turnstile.render(containerRef.current, {
                    sitekey: siteKey,
                    size: 'compact',
                    callback: (token) => onTokenRef.current(token),
                    'expired-callback': () => onClearRef.current(),
                    'error-callback': () => onClearRef.current(),
                });
            })
            .catch(() => {
                if (!cancelled) {
                    onClearRef.current();
                }
            });

        return () => {
            cancelled = true;

            if (widgetIdRef.current && window.turnstile?.remove) {
                window.turnstile.remove(widgetIdRef.current);
            }

            widgetIdRef.current = null;
        };
    }, [siteKey]);

    useEffect(() => {
        if (!widgetIdRef.current) {
            return;
        }

        window.turnstile?.reset?.(widgetIdRef.current);
        onClearRef.current();
    }, [resetKey]);

    return (
        <div className="mt-4" aria-label="Verification check">
            <div ref={containerRef} className="max-w-full overflow-hidden" />
        </div>
    );
}

export default function AppShell({ children }: Props) {
    const { props } = usePage<SharedProps>();
    const authUser = props.auth?.user;
    const flashStatus = props.flash?.status;
    const turnstile = props.turnstile ?? { enabled: false, site_key: null, bypass_token: null };
    const rememberDeviceDefault = props.auth?.magic_link?.remember_default ?? false;
    const defaultTurnstileResponse = !turnstile.enabled && turnstile.bypass_token ? turnstile.bypass_token : '';
    const [themePreference, setThemePreference] = useState<ThemePreference>(storedThemePreference);
    const [exporting, setExporting] = useState<false | 'json' | 'pdf' | 'csv'>(false);
    const [exportStatus, setExportStatus] = useState<string | null>(null);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const loginDropdownRef = useRef<HTMLDivElement | null>(null);

    const initialLoginFormData: LoginFormData = {
        email: '',
        'cf-turnstile-response': defaultTurnstileResponse,
        remember_device: rememberDeviceDefault,
    };
    const [turnstileResetKey, setTurnstileResetKey] = useState(0);

    const loginForm = useForm<LoginFormData>(initialLoginFormData);
    const showTurnstileWidget = turnstile.enabled && Boolean(turnstile.site_key);
    const showVerificationUnavailable = !showTurnstileWidget && !turnstile.bypass_token;

    useEffect(() => {
        const root = document.documentElement;
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const resolveTheme = (): ResolvedTheme =>
            themePreference === 'system' ? (media.matches ? 'dim' : 'retro') : themePreference;

        const applyTheme = () => {
            const nextTheme = resolveTheme();
            root.setAttribute('data-theme', nextTheme);
        };

        applyTheme();

        if (themePreference !== 'system') {
            return;
        }

        const handleSystemThemeChange = () => {
            applyTheme();
        };

        media.addEventListener('change', handleSystemThemeChange);

        return () => {
            media.removeEventListener('change', handleSystemThemeChange);
        };
    }, [themePreference]);

    useEffect(() => {
        const handleOutsidePress = (event: MouseEvent | TouchEvent) => {
            if (!loginDropdownRef.current?.contains(event.target as Node)) {
                setIsLoginOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsidePress);
        document.addEventListener('touchstart', handleOutsidePress);

        return () => {
            document.removeEventListener('mousedown', handleOutsidePress);
            document.removeEventListener('touchstart', handleOutsidePress);
        };
    }, []);

    const handleExport = async (format: 'json' | 'pdf' | 'csv') => {
        setExporting(format);
        setExportStatus(null);

        try {
            const entryCount = await exportEntries(format);
            setExportStatus(`Exported ${entryCount} ${entryCount === 1 ? 'entry' : 'entries'} as ${format.toUpperCase()}.`);
        } catch {
            setExportStatus('Export failed. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    const setThemeMode = (preference: ThemePreference) => {
        localStorage.setItem('theme', preference);
        setThemePreference(preference);
    };

    return (
        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6">
            <div className="app-navbar-surface navbar mb-8 rounded-2xl border border-base-300/50 bg-base-100 px-2 sm:px-3 shadow-sm">
                <div className="flex-1">
                    <Link href="/today" className="btn btn-ghost h-10 min-h-10 px-2 text-base font-medium text-base-content sm:h-12 sm:min-h-12 sm:px-3 sm:text-lg">
                        <BrandName />
                    </Link>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-2">
                    <div className="dropdown dropdown-end">
                        <button
                            className="btn btn-xs btn-ghost px-1.5 sm:btn-sm sm:gap-2 sm:px-2"
                            type="button"
                            tabIndex={0}
                            aria-haspopup="menu"
                            aria-controls="theme-menu"
                            aria-label={`Theme: ${themeLabel[themePreference]}`}
                            title={`Theme: ${themeLabel[themePreference]}`}
                        >
                            <ThemeIcon preference={themePreference} />
                            <span className="hidden sm:inline">Theme: {themeLabel[themePreference]}</span>
                            <svg viewBox="0 0 20 20" className="hidden h-3 w-3 opacity-70 sm:block" fill="currentColor" aria-hidden="true">
                                <path d="M5.2 7.5 10 12.3l4.8-4.8" />
                            </svg>
                        </button>
                        <ul
                            id="theme-menu"
                            tabIndex={0}
                            className="menu dropdown-content z-10 mt-2 w-44 rounded-box border border-base-300/50 bg-base-100 app-card-surface p-2 shadow-sm"
                        >
                            <li>
                                <button type="button" onClick={() => setThemeMode('retro')}>
                                    {themePreference === 'retro' ? '✓ ' : ''}Light
                                </button>
                            </li>
                            <li>
                                <button type="button" onClick={() => setThemeMode('system')}>
                                    {themePreference === 'system' ? '✓ ' : ''}System
                                </button>
                            </li>
                            <li>
                                <button type="button" onClick={() => setThemeMode('dim')}>
                                    {themePreference === 'dim' ? '✓ ' : ''}Dark
                                </button>
                            </li>
                        </ul>
                    </div>
                    <span className="hidden h-5 w-px bg-base-content/20 sm:block" aria-hidden="true" />
                    <Link href="/today" className="btn btn-xs btn-ghost px-2 sm:btn-sm">
                        Today
                    </Link>
                    <Link href="/history" className="btn btn-xs btn-ghost px-2 sm:btn-sm">
                        History
                    </Link>
                    {authUser ? (
                        <div className="dropdown dropdown-end">
                            <button
                                className="btn btn-xs btn-ghost rounded-full sm:btn-sm"
                                type="button"
                                aria-label="Account menu"
                                aria-haspopup="menu"
                                aria-controls="account-menu"
                            >
                                <span className="avatar avatar-placeholder">
                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-base-200 text-xs font-semibold text-base-content">
                                        {authUser.name?.[0] ?? authUser.email[0]?.toUpperCase()}
                                    </span>
                                </span>
                            </button>
                            <ul
                                id="account-menu"
                                className="menu dropdown-content z-10 mt-2 w-52 rounded-box border border-base-300/50 bg-base-100 app-card-surface p-2 shadow-sm"
                            >
                                <li>
                                    <Link href="/settings">Account settings</Link>
                                </li>
                                <li>
                                    <Link href="/logout" method="post" as="button">
                                        Sign out
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    ) : (
                        <div className="relative" ref={loginDropdownRef}>
                            <button
                                className="btn btn-sm btn-primary px-2 sm:px-4"
                                type="button"
                                aria-haspopup="dialog"
                                aria-expanded={isLoginOpen}
                                aria-controls="sign-in-menu"
                                aria-label="Sign in"
                                onClick={() => setIsLoginOpen((open) => !open)}
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    className="h-4 w-4 sm:hidden"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    aria-hidden="true"
                                >
                                    <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
                                    <path d="m5 8 7 5 7-5" />
                                </svg>
                                <span className="hidden sm:inline">Sign in</span>
                            </button>
                            <form
                                id="sign-in-menu"
                                className={`absolute right-0 z-10 mt-2 w-72 rounded-2xl border border-base-300/50 bg-base-100 app-card-surface p-4 shadow-sm ${
                                    isLoginOpen ? 'block' : 'hidden'
                                }`}
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    loginForm.post('/auth/magic-link/request', {
                                        preserveScroll: true,
                                        onSuccess: () => {
                                            loginForm.setData(initialLoginFormData);
                                            setTurnstileResetKey((key) => key + 1);
                                            setIsLoginOpen(false);
                                        },
                                    });
                                }}
                            >
                                <input type="hidden" name="cf-turnstile-response" value={loginForm.data['cf-turnstile-response']} readOnly />
                                <label className="form-control gap-2">
                                    <span className="text-sm text-base-content/70">Email</span>
                                    <input
                                        type="email"
                                        className="input input-bordered w-full"
                                        placeholder="you@example.com"
                                        required
                                        value={loginForm.data.email}
                                        onChange={(event) => loginForm.setData('email', event.target.value)}
                                    />
                                </label>
                                <p className="mt-2 text-sm text-base-content/70">The link may take a minute to arrive and expires in 30 minutes.</p>
                                {showTurnstileWidget && turnstile.site_key ? (
                                    <TurnstileWidget
                                        siteKey={turnstile.site_key}
                                        resetKey={turnstileResetKey}
                                        onToken={(token) => loginForm.setData('cf-turnstile-response', token)}
                                        onClear={() => loginForm.setData('cf-turnstile-response', '')}
                                    />
                                ) : null}
                                {showVerificationUnavailable ? (
                                    <p className="mt-4 text-sm text-base-content/70">We could not verify this request. Try again in a minute.</p>
                                ) : null}
                                <label className="mt-4 flex items-start gap-2 text-sm text-base-content/80">
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-sm mt-0.5"
                                        checked={loginForm.data.remember_device}
                                        onChange={(event) => loginForm.setData('remember_device', event.target.checked)}
                                    />
                                    <span>
                                        <span className="block">Remember this device</span>
                                        <span className="block text-base-content/60">Stay signed in on this device for the configured beta session window.</span>
                                    </span>
                                </label>
                                <button className="btn btn-primary mt-4 w-full" type="submit" disabled={loginForm.processing}>
                                    {loginForm.processing ? 'Sending...' : 'Send magic link'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {flashStatus && (
                <div className="alert alert-info mb-4" role="status" aria-live="polite">
                    {flashStatus}
                </div>
            )}
            {exportStatus && (
                <div className="alert alert-info mb-4" role="status" aria-live="polite">
                    {exportStatus}
                </div>
            )}

            <main className="flex-1 space-y-8">{children}</main>

            <footer className="footer mt-8 flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-base-300/50 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2 text-base-content/70">
                    <div className="dropdown dropdown-top">
                        <button
                            className="link link-hover text-sm font-normal text-base-content/70 no-underline"
                            type="button"
                            tabIndex={0}
                            aria-haspopup="menu"
                            aria-controls="export-menu"
                        >
                            {exporting ? 'Exporting...' : 'Export'}
                        </button>
                        <ul id="export-menu" className="menu dropdown-content z-10 mt-2 w-40 rounded-box border border-base-300/50 bg-base-100 app-card-surface p-2 shadow-sm">
                            <li>
                                <button type="button" onClick={() => handleExport('json')} disabled={Boolean(exporting)}>
                                    JSON
                                </button>
                            </li>
                            <li>
                                <button type="button" onClick={() => handleExport('pdf')} disabled={Boolean(exporting)}>
                                    PDF
                                </button>
                            </li>
                            <li>
                                <button type="button" onClick={() => handleExport('csv')} disabled={Boolean(exporting)}>
                                    CSV
                                </button>
                            </li>
                        </ul>
                    </div>
                    <span className="text-base-content/70">&middot;</span>
                    <Link href="/help" className="link link-hover text-sm font-normal text-base-content/70 no-underline">
                        Help
                    </Link>
                    <span className="text-base-content/70">&middot;</span>
                    <Link href="/policies#privacy" className="link link-hover text-sm font-normal text-base-content/70 no-underline">
                        Policies
                    </Link>
                    <span className="text-base-content/70">&middot;</span>
                    <a href="mailto:support@consider.today" className="link link-hover text-sm font-normal text-base-content/70 no-underline">
                        support@consider.today
                    </a>
                </div>
                <p className="w-full text-sm font-normal text-base-content/70 sm:w-auto sm:text-right">I&apos;m grateful for you.</p>
            </footer>
        </div>
    );
}
