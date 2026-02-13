import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import AppShell from '../Components/AppShell';
import FlashbackCard from '../Components/FlashbackCard';
import PromptCard from '../Components/PromptCard';
import { formatHumanDate } from '../lib/date';
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
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AppShell>
            <Head title="Today" />

            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <h1 className="card-title text-2xl">Today</h1>
                    <p className="opacity-70">{formatHumanDate(props.date)}</p>
                </div>
            </div>

            <PromptCard
                title="1) Who is a person you’re grateful for?"
                value={person}
                onChange={setPerson}
                placeholder="Either by name or by the context you encountered them, write about a person you’re grateful for today."
            />
            <PromptCard
                title="2) What did you experience today that was a small (or large) moment of grace?"
                value={grace}
                onChange={setGrace}
                placeholder="This could be something you witnessed, something someone did for you, or even a moment of beauty or awe that you experienced."
            />
            <PromptCard
                title="3) What else are you grateful for?"
                value={gratitude}
                onChange={setGratitude}
                placeholder="Think about your place in the world, either physically or emotionally. This could be a part of your environment, a relationship, an aspect of yourself, or even an opportunity you have."
            />

            <div className="flex items-center gap-3">
                <button className="btn btn-primary" onClick={saveEntry} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save'}
                </button>
                {!props.auth.user && savedCount >= props.loginPromptThreshold && (
                    <div className="alert alert-info py-2">
                        Sync &amp; backup across devices is optional. Use the magic link in the footer.
                    </div>
                )}
            </div>

            {props.showFlashbacks && (
                <div className="grid gap-4 md:grid-cols-2">
                    <FlashbackCard title="1 week ago" flashback={props.flashbacks.weekAgo} />
                    <FlashbackCard title="1 year ago" flashback={props.flashbacks.yearAgo} />
                </div>
            )}
        </AppShell>
    );
}
