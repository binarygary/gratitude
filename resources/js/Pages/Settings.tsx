import { useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AppShell from '../Components/AppShell';
import SeoHead from '../Components/SeoHead';

type PageProps = {
    show_flashbacks: boolean;
    auth: {
        user: {
            email: string;
        } | null;
    };
};

export default function Settings() {
    const { props } = usePage<PageProps>();
    const [reminderTime, setReminderTime] = useState('20:00');
    const form = useForm({
        show_flashbacks: props.show_flashbacks,
    });

    const reminderIcsHref = useMemo(() => {
        const safeTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        const now = new Date();
        const dateParts = new Intl.DateTimeFormat('en-CA', {
            timeZone: safeTimezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).formatToParts(now);

        const year = dateParts.find((part) => part.type === 'year')?.value ?? '1970';
        const month = dateParts.find((part) => part.type === 'month')?.value ?? '01';
        const day = dateParts.find((part) => part.type === 'day')?.value ?? '01';

        const [hour = '20', minute = '00'] = reminderTime.split(':');
        const dtStart = `${year}${month}${day}T${hour}${minute}00`;
        const stamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const uid = `consider-today-daily-reminder-${safeTimezone}-${hour}${minute}`;

        const calendar = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//consider.today//Daily Reminder//EN',
            'CALSCALE:GREGORIAN',
            'BEGIN:VEVENT',
            `UID:${uid}`,
            `DTSTAMP:${stamp}`,
            `DTSTART;TZID=${safeTimezone}:${dtStart}`,
            'RRULE:FREQ=DAILY',
            'SUMMARY:Daily consider.today reminder',
            'DESCRIPTION:Open consider.today and write today\\,s entry.',
            'END:VEVENT',
            'END:VCALENDAR',
        ].join('\r\n');

        return `data:text/calendar;charset=utf-8,${encodeURIComponent(calendar)}`;
    }, [reminderTime]);

    return (
        <AppShell>
            <SeoHead
                title="Settings"
                description="Manage reflection settings, reminders, and account preferences."
                canonicalPath="/settings"
                noIndex
            />

            <div className="card rounded-2xl border border-base-300/50 bg-white shadow-sm">
                <div className="card-body gap-4 p-6">
                    <h1 className="text-3xl font-semibold text-base-content">Settings</h1>

                    <label className="label cursor-pointer justify-start gap-3">
                        <input
                            type="checkbox"
                            className="toggle"
                            checked={form.data.show_flashbacks}
                            onChange={(event) => form.setData('show_flashbacks', event.target.checked)}
                        />
                        <span className="label-text text-base-content">Show flashbacks</span>
                    </label>
                    <p className="text-sm text-base-content/60">Enable or hide historical reflection cards on your Today page.</p>

                    <button
                        className="btn btn-primary w-fit rounded-xl"
                        onClick={() => form.post('/settings', { preserveScroll: true })}
                        disabled={form.processing}
                    >
                        {form.processing ? 'Saving...' : 'Save settings'}
                    </button>
                </div>
            </div>

            <div className="card rounded-2xl border border-base-300/50 bg-white shadow-sm">
                <div className="card-body gap-3 p-6">
                    <h2 className="text-lg font-medium text-base-content">Account</h2>
                    <p className="text-sm text-base-content/60">{props.auth.user?.email ?? 'Not signed in'}</p>
                </div>
            </div>

            <div className="card rounded-2xl border border-base-300/50 bg-white shadow-sm">
                <div className="card-body gap-4 p-6">
                    <h2 className="text-lg font-medium text-base-content">Reminders</h2>
                    <p className="text-sm text-base-content/60">Coming later. You can still add a daily reminder to your calendar today.</p>

                    <label className="form-control w-full max-w-xs gap-2">
                        <span className="label-text text-base-content">Reminder time</span>
                        <input
                            type="time"
                            className="input input-bordered rounded-xl"
                            value={reminderTime}
                            onChange={(event) => setReminderTime(event.target.value)}
                        />
                    </label>

                    <a
                        className="btn btn-outline btn-sm w-fit"
                        href={reminderIcsHref}
                        download="consider-today-daily-reminder.ics"
                    >
                        Download daily reminder (.ics)
                    </a>
                </div>
            </div>
        </AppShell>
    );
}
