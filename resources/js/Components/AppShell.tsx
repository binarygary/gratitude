import { Link, useForm, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';

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

    const loginForm = useForm({ email: '' });

    return (
        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6">
            <div className="navbar mb-8 rounded-2xl border border-base-300/50 bg-white shadow-sm">
                <div className="flex-1">
                    <Link href="/today" className="btn btn-ghost text-lg font-medium text-base-content">
                        Gratitude Journal
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
                        <div className="dropdown dropdown-end">
                            <button className="btn btn-sm btn-primary">Sign in</button>
                            <form
                                className="dropdown-content z-10 mt-2 w-72 rounded-2xl border border-base-300/50 bg-white p-4 shadow-sm"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    loginForm.post('/auth/magic-link/request', {
                                        preserveScroll: true,
                                        onSuccess: () => loginForm.reset('email'),
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

            <main className="flex-1 space-y-8">{children}</main>

            <footer className="mt-8 rounded-2xl border border-base-300/50 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                    <Link href="/settings" className="text-sm text-base-content/60 hover:text-base-content">
                        Export
                    </Link>
                    <Link href="/settings" className="text-sm text-base-content/60 hover:text-base-content">
                        Help
                    </Link>
                </div>
            </footer>
        </div>
    );
}
