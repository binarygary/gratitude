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
    };
    flash: {
        status?: string;
    };
};

export default function AppShell({ children }: Props) {
    const { props } = usePage<SharedProps>();
    const authUser = props.auth?.user;
    const flashStatus = props.flash?.status;
    const [exporting, setExporting] = useState<false | 'json' | 'pdf' | 'csv'>(false);
    const [exportStatus, setExportStatus] = useState<string | null>(null);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const loginDropdownRef = useRef<HTMLDivElement | null>(null);

    const loginForm = useForm({ email: '' });

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

    return (
        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6">
            <div className="navbar mb-8 rounded-2xl border border-base-300/50 bg-white shadow-sm">
                <div className="flex-1">
                    <Link href="/today" className="btn btn-ghost text-lg font-medium text-base-content">
                        <BrandName />
                    </Link>
                </div>
                <div className="flex gap-2">
                    <Link href="/today" className="btn btn-sm btn-ghost">
                        Today
                    </Link>
                    <Link href="/history" className="btn btn-sm btn-ghost">
                        History
                    </Link>
                    {authUser ? (
                        <div className="dropdown dropdown-end">
                            <button className="btn btn-sm btn-ghost rounded-full" aria-label="Account menu">
                                <span className="avatar avatar-placeholder">
                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-base-200 text-xs font-semibold text-base-content">
                                        {authUser.name?.[0] ?? authUser.email[0]?.toUpperCase()}
                                    </span>
                                </span>
                            </button>
                            <ul className="menu dropdown-content z-10 mt-2 w-52 rounded-box border border-base-300/50 bg-white p-2 shadow-sm">
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
                            <button className="btn btn-sm btn-primary" type="button" onClick={() => setIsLoginOpen((open) => !open)}>
                                Sign in
                            </button>
                            <form
                                className={`absolute right-0 z-10 mt-2 w-72 rounded-2xl border border-base-300/50 bg-white p-4 shadow-sm ${
                                    isLoginOpen ? 'block' : 'hidden'
                                }`}
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    loginForm.post('/auth/magic-link/request', {
                                        preserveScroll: true,
                                        onSuccess: () => {
                                            loginForm.reset('email');
                                            setIsLoginOpen(false);
                                        },
                                    });
                                }}
                            >
                                <label className="form-control gap-2">
                                    <span className="text-sm text-base-content/60">Email</span>
                                    <input
                                        type="email"
                                        className="input input-bordered w-full"
                                        placeholder="you@example.com"
                                        required
                                        value={loginForm.data.email}
                                        onChange={(event) => loginForm.setData('email', event.target.value)}
                                    />
                                </label>
                                <button className="btn btn-primary mt-3 w-full" type="submit" disabled={loginForm.processing}>
                                    {loginForm.processing ? 'Sending...' : 'Send magic link'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {flashStatus && <div className="alert alert-info mb-4">{flashStatus}</div>}
            {exportStatus && <div className="alert alert-info mb-4">{exportStatus}</div>}

            <main className="flex-1 space-y-8">{children}</main>

            <footer className="mt-8 rounded-2xl border border-base-300/50 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="dropdown dropdown-top">
                        <button className="text-sm text-base-content/60 hover:text-base-content" tabIndex={0}>
                            {exporting ? 'Exporting...' : 'Export'}
                        </button>
                        <ul className="menu dropdown-content z-10 mt-2 w-40 rounded-box border border-base-300/50 bg-white p-2 shadow-sm">
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
                    <Link href="/help" className="text-sm text-base-content/60 hover:text-base-content">
                        Help
                    </Link>
                </div>
            </footer>
        </div>
    );
}
