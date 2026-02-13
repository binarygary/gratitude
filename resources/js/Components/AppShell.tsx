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
            <div className="navbar mb-6 rounded-box bg-base-100 shadow-sm">
                <div className="flex-1">
                    <Link href="/today" className="btn btn-ghost text-lg">
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
                    {authUser && (
                        <Link href="/settings" className="btn btn-sm btn-ghost">
                            Settings
                        </Link>
                    )}
                </div>
            </div>

            {flashStatus && <div className="alert alert-info mb-4">{flashStatus}</div>}

            <main className="flex-1 space-y-4">{children}</main>

            <footer className="mt-8 rounded-box bg-base-100 p-4 shadow-sm">
                {authUser ? (
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm">Signed in as {authUser.email}</p>
                        <Link href="/logout" method="post" as="button" className="btn btn-sm">
                            Sign out
                        </Link>
                    </div>
                ) : (
                    <form
                        className="flex flex-col gap-3 sm:flex-row"
                        onSubmit={(event) => {
                            event.preventDefault();
                            loginForm.post('/auth/magic-link/request', {
                                preserveScroll: true,
                                onSuccess: () => loginForm.reset('email'),
                            });
                        }}
                    >
                        <label className="input input-bordered flex w-full items-center gap-2 sm:max-w-sm">
                            <span className="text-xs opacity-70">Email</span>
                            <input
                                type="email"
                                className="grow"
                                placeholder="you@example.com"
                                required
                                value={loginForm.data.email}
                                onChange={(event) => loginForm.setData('email', event.target.value)}
                            />
                        </label>
                        <button className="btn btn-primary" type="submit" disabled={loginForm.processing}>
                            Send magic link
                        </button>
                    </form>
                )}
            </footer>
        </div>
    );
}
