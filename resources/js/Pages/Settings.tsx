import { Head, useForm, usePage } from '@inertiajs/react';
import AppShell from '../Components/AppShell';

type PageProps = {
    timezone: string;
    show_flashbacks: boolean;
    timezones: string[];
};

export default function Settings() {
    const { props } = usePage<PageProps>();
    const form = useForm({
        timezone: props.timezone,
        show_flashbacks: props.show_flashbacks,
    });

    return (
        <AppShell>
            <Head title="Settings" />

            <div className="card bg-base-100 shadow-sm">
                <div className="card-body gap-4">
                    <h1 className="card-title text-2xl">Settings</h1>

                    <label className="form-control w-full max-w-xs gap-2">
                        <span className="label-text">Timezone</span>
                        <select
                            className="select select-bordered"
                            value={form.data.timezone}
                            onChange={(event) => form.setData('timezone', event.target.value)}
                        >
                            {props.timezones.map((timezone) => (
                                <option key={timezone} value={timezone}>
                                    {timezone}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="label cursor-pointer justify-start gap-3">
                        <input
                            type="checkbox"
                            className="toggle"
                            checked={form.data.show_flashbacks}
                            onChange={(event) => form.setData('show_flashbacks', event.target.checked)}
                        />
                        <span className="label-text">Show flashbacks</span>
                    </label>

                    <button
                        className="btn btn-primary w-fit"
                        onClick={() => form.post('/settings', { preserveScroll: true })}
                        disabled={form.processing}
                    >
                        {form.processing ? 'Saving...' : 'Save settings'}
                    </button>
                </div>
            </div>

            <div className="card bg-base-100 shadow-sm opacity-70">
                <div className="card-body">
                    <h2 className="card-title">Reminders</h2>
                    <p>Push and SMS reminders are outside MVP. Placeholder only.</p>
                    <button className="btn btn-disabled btn-sm w-fit">Coming later</button>
                </div>
            </div>
        </AppShell>
    );
}
