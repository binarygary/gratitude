import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import AppShell from '../Components/AppShell';
import FlashbackCard from '../Components/FlashbackCard';
import PromptCard from '../Components/PromptCard';
import { getEntryByDate, pushUnsyncedEntries, upsertLocalEntry } from '../lib/db';

type Entry = {
    entry_date: string;
    person: string | null;
    grace: string | null;
    gratitude: string | null;
    updated_at: number;
} | null;

type PageProps = {
    date: string;
    entry: Entry;
    flashbacks: {
        weekAgo: { entry_date: string; snippet: string } | null;
        yearAgo: { entry_date: string; snippet: string } | null;
    };
    showFlashbacks: boolean;
    isAuthenticated: boolean;
    loginPromptThreshold: number;
    auth: {
        user: {
            id: number;
        } | null;
    };
};

export default function Today() {
    const { props } = usePage<PageProps>();
    const [person, setPerson] = useState('');
    const [grace, setGrace] = useState('');
    const [gratitude, setGratitude] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
    const [savedCount, setSavedCount] = useState<number>(() => Number(localStorage.getItem('save_count') ?? '0'));

    const hasNonEmptyContent = useMemo(
        () => [person, grace, gratitude].some((value) => value.trim().length > 0),
        [person, grace, gratitude],
    );

    useEffect(() => {
        let ignore = false;

        const load = async () => {
            const local = await getEntryByDate(props.date);
            const server = props.entry;

            if (!local && !server) {
                return;
            }

            let resolved = {
                person: local?.person ?? server?.person ?? '',
                grace: local?.grace ?? server?.grace ?? '',
                gratitude: local?.gratitude ?? server?.gratitude ?? '',
                updatedAt: local?.updated_at ?? server?.updated_at ?? Date.now(),
                syncedAt: local?.synced_at ?? null,
            };

            if (local && server) {
                if (local.updated_at > server.updated_at) {
                    resolved = {
                        person: local.person,
                        grace: local.grace,
                        gratitude: local.gratitude,
                        updatedAt: local.updated_at,
                        syncedAt: null,
                    };
                } else {
                    resolved = {
                        person: server.person ?? '',
                        grace: server.grace ?? '',
                        gratitude: server.gratitude ?? '',
                        updatedAt: server.updated_at,
                        syncedAt: Date.now(),
                    };
                }
            }

            if (ignore) {
                return;
            }

            setPerson(resolved.person);
            setGrace(resolved.grace);
            setGratitude(resolved.gratitude);
            setLastSavedAt(resolved.updatedAt);

            await upsertLocalEntry({
                entry_date: props.date,
                person: resolved.person,
                grace: resolved.grace,
                gratitude: resolved.gratitude,
                updated_at: resolved.updatedAt,
                synced_at: resolved.syncedAt,
                server_entry_date: props.date,
            });
        };

        load();

        if (props.auth.user) {
            pushUnsyncedEntries().catch(() => null);
        }

        return () => {
            ignore = true;
        };
    }, [props.auth.user, props.date, props.entry]);

    const saveEntry = async () => {
        const updatedAt = Date.now();

        setIsSaving(true);

        try {
            await upsertLocalEntry({
                entry_date: props.date,
                person,
                grace,
                gratitude,
                updated_at: updatedAt,
                synced_at: null,
                server_entry_date: null,
            });

            if (props.auth.user) {
                await axios.post('/entries/upsert', {
                    entry_date: props.date,
                    person,
                    grace,
                    gratitude,
                    updated_at: updatedAt,
                });

                await upsertLocalEntry({
                    entry_date: props.date,
                    person,
                    grace,
                    gratitude,
                    updated_at: updatedAt,
                    synced_at: Date.now(),
                    server_entry_date: props.date,
                });
            } else if (hasNonEmptyContent) {
                const nextCount = savedCount + 1;
                localStorage.setItem('save_count', `${nextCount}`);
                setSavedCount(nextCount);
            }

            setLastSavedAt(updatedAt);
        } finally {
            setIsSaving(false);
        }
    };

    const formattedDate = new Date(`${props.date}T00:00:00`).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <AppShell>
            <Head title="Today" />

            <div className="card rounded-2xl border border-base-300/50 bg-white shadow-sm">
                <div className="card-body gap-4 p-6">
                    <h1 className="text-2xl font-semibold text-base-content">Today</h1>
                    <p className="text-sm text-base-content/70">{formattedDate}</p>
                    <p className="text-sm text-base-content/60">Private by default. Your entries stay yours.</p>
                    <p className="text-sm text-base-content/60">
                        Entries stay on your device and can be exported anytime. Sign in to sync so your reflections are available across devices.
                    </p>
                </div>
            </div>

            <PromptCard
                title="Who are you grateful for today?"
                helperText="Name someone who made today feel a little brighter."
                value={person}
                onChange={setPerson}
                placeholder="Write a few lines about them."
            />
            <PromptCard
                title="What moment of grace did you notice?"
                helperText="Capture one moment of kindness, beauty, or support."
                value={grace}
                onChange={setGrace}
                placeholder="What stood out to you?"
            />
            <PromptCard
                title="What else are you grateful for?"
                helperText="Add anything else that helped you feel grounded."
                value={gratitude}
                onChange={setGratitude}
                placeholder="Anything else you want to remember from today."
            />

            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button className="btn btn-primary btn-lg w-full rounded-xl sm:w-auto" onClick={saveEntry} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save entry'}
                </button>
                {lastSavedAt && <p className="text-sm text-base-content/70">Last saved {new Date(lastSavedAt).toLocaleTimeString()}</p>}
                {!props.auth.user && savedCount >= props.loginPromptThreshold && (
                    <div className="alert alert-info py-2">
                        Sync and backup across devices is optional. Use the sign in button in the header.
                    </div>
                )}
            </div>

            {props.showFlashbacks && (
                <div className="mt-2 grid gap-4 md:grid-cols-2">
                    <FlashbackCard title="1 week ago" flashback={props.flashbacks.weekAgo} />
                    <FlashbackCard title="1 year ago" flashback={props.flashbacks.yearAgo} />
                </div>
            )}
        </AppShell>
    );
}
