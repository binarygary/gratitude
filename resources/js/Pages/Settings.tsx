import { useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AppShell from '../Components/AppShell';
import SeoHead from '../Components/SeoHead';

type PageProps = {
    timezone: string;
    show_flashbacks: boolean;
    notifications_enabled: boolean;
    notification_channel: string | null;
    daily_reminder_time: string | null;
    auth: {
        user: {
            email: string;
            timezone: string;
            notifications_enabled?: boolean;
            notification_channel?: string | null;
            daily_reminder_time?: string | null;
        } | null;
    };
};

export default function Settings() {
    const { props } = usePage<PageProps>();
    const [reminderTime, setReminderTime] = useState(props.daily_reminder_time ?? '20:00');
    const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const form = useForm({
        timezone: props.timezone,
        show_flashbacks: props.show_flashbacks,
        notifications_enabled: props.notifications_enabled,
        notification_channel: props.notification_channel ?? 'email',
        daily_reminder_time: props.daily_reminder_time ?? '20:00',
    });

    const reminderIcsHref = useMemo(() => {
        const now = new Date();
        const dateParts = new Intl.DateTimeFormat('en-CA', {
            timeZone: deviceTimezone,
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
        const uid = `consider-today-daily-reminder-${deviceTimezone}-${hour}${minute}`;

        const calendar = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//consider.today//Daily Reminder//EN',
            'CALSCALE:GREGORIAN',
            'BEGIN:VEVENT',
            `UID:${uid}`,
            `DTSTAMP:${stamp}`,
            `DTSTART;TZID=${deviceTimezone}:${dtStart}`,
            'RRULE:FREQ=DAILY',
            'SUMMARY:Daily consider.today reminder',
            'DESCRIPTION:Open consider.today and write today\\,s entry.',
            'END:VEVENT',
            'END:VCALENDAR',
        ].join('\r\n');

        return `data:text/calendar;charset=utf-8,${encodeURIComponent(calendar)}`;
    }, [deviceTimezone, reminderTime]);

    return (
        <AppShell>
            <SeoHead
                title="Settings"
                description="Manage reflection settings, reminders, and account preferences."
                canonicalPath="/settings"
                noIndex
            />

            <div className="card rounded-2xl border border-base-300/50 bg-base-100 app-card-surface shadow-sm">
                <div className="card-body gap-4 p-6">
                    <h1 className="text-3xl font-semibold text-base-content">Settings</h1>

                    <label className="form-control gap-2">
                        <span className="label-text text-base-content">Timezone</span>
                        <input
                            type="text"
                            className="input input-bordered rounded-xl"
                            value={form.data.timezone}
                            onChange={(event) => form.setData('timezone', event.target.value)}
                            placeholder="America/New_York"
                            spellCheck={false}
                            aria-invalid={form.errors.timezone ? 'true' : 'false'}
                            aria-describedby={form.errors.timezone ? 'timezone-error' : undefined}
                        />
                    </label>
                    <p className="text-sm text-base-content/70">
                        Your saved timezone decides which date counts as &quot;today&quot; after you sign in. Existing entry dates do not change.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            className="btn btn-outline btn-sm rounded-xl"
                            onClick={() => form.setData('timezone', deviceTimezone)}
                        >
                            Use device timezone
                        </button>
                        <p className="self-center text-sm text-base-content/60">
                            Current device timezone: {deviceTimezone}
                        </p>
                    </div>
                    {form.errors.timezone ? (
                        <p id="timezone-error" className="text-sm text-error" role="alert">
                            {form.errors.timezone}
                        </p>
                    ) : null}

                    <label className="label cursor-pointer justify-start gap-3">
                        <input
                            type="checkbox"
                            className="toggle"
                            checked={form.data.show_flashbacks}
                            onChange={(event) => form.setData('show_flashbacks', event.target.checked)}
                        />
                        <span className="label-text text-base-content">Show flashbacks</span>
                    </label>
                    <p className="text-sm text-base-content/70">Enable or hide historical reflection cards on your Today page.</p>

                    <button
                        className="btn btn-primary w-fit rounded-xl"
                        onClick={() => form.post('/settings', { preserveScroll: true })}
                        disabled={form.processing}
                    >
                        {form.processing ? 'Saving...' : 'Save settings'}
                    </button>
                </div>
            </div>

            <div className="card rounded-2xl border border-base-300/50 bg-base-100 app-card-surface shadow-sm">
                <div className="card-body gap-3 p-6">
                    <h2 className="text-lg font-medium text-base-content">Account</h2>
                    <p className="text-sm text-base-content/70">{props.auth.user?.email ?? 'Not signed in'}</p>
                </div>
            </div>

            <div className="card rounded-2xl border border-base-300/50 bg-base-100 app-card-surface shadow-sm">
                <div className="card-body gap-4 p-6">
                    <h2 className="text-lg font-medium text-base-content">Reminders</h2>
                    <p className="text-sm text-base-content/70">
                        Start with one daily email reminder. The calendar download remains available as a backup while hosted delivery is being verified.
                    </p>

                    <label className="label cursor-pointer justify-start gap-3">
                        <input
                            type="checkbox"
                            className="toggle"
                            checked={form.data.notifications_enabled}
                            onChange={(event) => form.setData('notifications_enabled', event.target.checked)}
                        />
                        <span className="label-text text-base-content">Enable daily reminders</span>
                    </label>

                    <div className="rounded-xl border border-base-300/60 bg-base-200/30 p-4">
                        <p className="text-sm font-medium text-base-content">Delivery channel</p>
                        <p className="mt-1 text-sm text-base-content/70">Email only for the first beta slice.</p>
                    </div>

                    <label className="form-control w-full max-w-xs gap-2">
                        <span className="label-text text-base-content">Reminder time</span>
                        <input
                            type="time"
                            className="input input-bordered rounded-xl"
                            value={form.data.daily_reminder_time}
                            onChange={(event) => {
                                const value = event.target.value;
                                form.setData('daily_reminder_time', value);
                                setReminderTime(value);
                            }}
                            disabled={!form.data.notifications_enabled}
                            aria-invalid={form.errors.daily_reminder_time ? 'true' : 'false'}
                            aria-describedby={form.errors.daily_reminder_time ? 'daily-reminder-time-error' : undefined}
                        />
                    </label>

                    {form.errors.notification_channel ? (
                        <p className="text-sm text-error" role="alert">
                            {form.errors.notification_channel}
                        </p>
                    ) : null}

                    {form.errors.daily_reminder_time ? (
                        <p id="daily-reminder-time-error" className="text-sm text-error" role="alert">
                            {form.errors.daily_reminder_time}
                        </p>
                    ) : null}

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
