import { Head, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AppShell from '../Components/AppShell';

type PageProps = {
    show_flashbacks: boolean;
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
        const uid = `gratitude-daily-reminder-${safeTimezone}-${hour}${minute}`;

        const calendar = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Gratitude//Daily Reminder//EN',
            'CALSCALE:GREGORIAN',
            'BEGIN:VEVENT',
            `UID:${uid}`,
            `DTSTAMP:${stamp}`,
            `DTSTART;TZID=${safeTimezone}:${dtStart}`,
            'RRULE:FREQ=DAILY',
            'SUMMARY:Daily Gratitude Reminder',
            'DESCRIPTION:Open Gratitude and write today\\,s entry.',
            'END:VEVENT',
            'END:VCALENDAR',
        ].join('\r\n');

        return `data:text/calendar;charset=utf-8,${encodeURIComponent(calendar)}`;
    }, [reminderTime]);

    return (
        <AppShell>
            <Head title="Settings" />

            <div className="card bg-base-100 shadow-sm">
                <div className="card-body gap-4">
                    <h1 className="card-title text-2xl">Settings</h1>

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

            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <h2 className="card-title">Reminders</h2>
                    <p>Choose a daily reminder time, then add it to your calendar.</p>

                    <label className="form-control w-full max-w-xs gap-2">
                        <span className="label-text">Reminder time</span>
                        <input
                            type="time"
                            className="input input-bordered"
                            value={reminderTime}
                            onChange={(event) => setReminderTime(event.target.value)}
                        />
                    </label>

                    <a
                        className="btn btn-outline btn-sm w-fit"
                        href={reminderIcsHref}
                        download="gratitude-daily-reminder.ics"
                    >
                        Download daily reminder (.ics)
                    </a>
                </div>
            </div>
        </AppShell>
    );
}
