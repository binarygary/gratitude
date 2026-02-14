import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useMemo, useRef, useState } from 'react';
import AppShell from '../Components/AppShell';
import FlashbackCard from '../Components/FlashbackCard';
import PromptCard from '../Components/PromptCard';
import { getEntryByDate, pushUnsyncedEntries, seedLocalEntries, upsertLocalEntry } from '../lib/db';

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
        weekAgo: { entry_date: string; person: string; grace: string; gratitude: string } | null;
        yearAgo: { entry_date: string; person: string; grace: string; gratitude: string } | null;
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

type Flashback = { entry_date: string; person: string; grace: string; gratitude: string } | null;

type LocalSeedRequest = {
    days: number;
    endDate?: string;
    clearExisting: boolean;
};

function ymdMinusDays(ymd: string, days: number): string {
    const date = new Date(`${ymd}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() - days);
    return date.toISOString().slice(0, 10);
}

function ymdMinusYears(ymd: string, years: number): string {
    const date = new Date(`${ymd}T12:00:00Z`);
    date.setUTCFullYear(date.getUTCFullYear() - years);
    return date.toISOString().slice(0, 10);
}

function localFlashbackSnippet(entry: { entry_date: string; person: string; grace: string; gratitude: string } | undefined): Flashback {
    if (!entry) {
        return null;
    }

    const hasContent = [entry.person, entry.grace, entry.gratitude]
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
        .length > 0;

    if (!hasContent) {
        return null;
    }

    return {
        entry_date: entry.entry_date,
        person: entry.person,
        grace: entry.grace,
        gratitude: entry.gratitude,
    };
}

function getLocalSeedRequest(): LocalSeedRequest | null {
    const params = new URLSearchParams(window.location.search);
    const daysRaw = params.get('seed_local_days') ?? params.get('seed');

    if (!daysRaw) {
        return null;
    }

    const parsedDays = Number.parseInt(daysRaw, 10);

    if (!Number.isFinite(parsedDays) || parsedDays <= 0) {
        return null;
    }

    const endDate = params.get('seed_local_end') ?? undefined;
    const clearExisting = params.get('seed_local_reset') === '1';

    return {
        days: Math.max(1, Math.min(parsedDays, 2000)),
        endDate,
        clearExisting,
    };
}

export default function Today() {
    const { props } = usePage<PageProps>();
    const [person, setPerson] = useState('');
    const [grace, setGrace] = useState('');
    const [gratitude, setGratitude] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
    const [savedCount, setSavedCount] = useState<number>(() => Number(localStorage.getItem('save_count') ?? '0'));
    const [seedMessage, setSeedMessage] = useState<string | null>(null);
    const [localFlashbacks, setLocalFlashbacks] = useState<{ weekAgo: Flashback; yearAgo: Flashback }>({
        weekAgo: null,
        yearAgo: null,
    });
    const lastSeedQueryRef = useRef<string | null>(null);

    const hasNonEmptyContent = useMemo(
        () => [person, grace, gratitude].some((value) => value.trim().length > 0),
        [person, grace, gratitude],
    );

    useEffect(() => {
        let ignore = false;

        const load = async () => {
            if (!props.auth.user) {
                const queryKey = window.location.search;
                const seedRequest = getLocalSeedRequest();

                if (seedRequest && lastSeedQueryRef.current !== queryKey) {
                    const result = await seedLocalEntries(seedRequest);
                    lastSeedQueryRef.current = queryKey;
                    setSeedMessage(
                        `Seeded ${result.seeded} local entries (${result.startDate} to ${result.endDate}).`,
                    );
                }

                const [weekAgoEntry, yearAgoEntry] = await Promise.all([
                    getEntryByDate(ymdMinusDays(props.date, 7)),
                    getEntryByDate(ymdMinusYears(props.date, 1)),
                ]);

                if (!ignore) {
                    setLocalFlashbacks({
                        weekAgo: localFlashbackSnippet(weekAgoEntry),
                        yearAgo: localFlashbackSnippet(yearAgoEntry),
                    });
                }
            } else if (!ignore) {
                setLocalFlashbacks({
                    weekAgo: null,
                    yearAgo: null,
                });
            }

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

    const resolvedFlashbacks = {
        weekAgo: props.flashbacks.weekAgo ?? localFlashbacks.weekAgo,
        yearAgo: props.flashbacks.yearAgo ?? localFlashbacks.yearAgo,
    };

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
                server_entry_date: props.date,
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
                    {seedMessage && <p className="text-sm text-success">{seedMessage}</p>}
                </div>
            </div>

            <PromptCard
                title={
                    <>
                        <span className="font-semibold">Who</span> are you grateful for today?
                    </>
                }
                helperText="Either by name or by the context you encountered them, write about a person you’re grateful for today."
                value={person}
                onChange={setPerson}
                placeholder="Write a few lines about them."
            />
            <PromptCard
                title={
                    <>
                        What moment of <span className="font-semibold">grace</span> did you notice?
                    </>
                }
                helperText="This could be something you witnessed, something someone did for you, or even a moment of beauty or awe that you experienced."
                value={grace}
                onChange={setGrace}
                placeholder="What stood out to you?"
            />
            <PromptCard
                title={
                    <>
                        What else are you <span className="font-semibold">grateful</span> for?
                    </>
                }
                helperText="Think about your place in the world, either physically or emotionally. This could be a part of your environment, a relationship, an aspect of yourself, or even an opportunity you have."
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
                    <FlashbackCard title="1 week ago" flashback={resolvedFlashbacks.weekAgo} />
                    <FlashbackCard title="1 year ago" flashback={resolvedFlashbacks.yearAgo} />
                </div>
            )}
        </AppShell>
    );
}
