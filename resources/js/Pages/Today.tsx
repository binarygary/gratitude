import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useMemo, useRef, useState } from 'react';
import AppShell from '../Components/AppShell';
import EntrySyncStatus from '../Components/EntrySyncStatus';
import FlashbackCard from '../Components/FlashbackCard';
import PromptCard from '../Components/PromptCard';
import SeoHead from '../Components/SeoHead';
import {
    countLocalEntries,
    getEntryByDate,
    pushUnsyncedEntries,
    seedLocalEntries,
    upsertLocalEntry,
    type CanonicalEntryPayload,
    type LocalEntry,
    type SyncErrorPayload,
} from '../lib/db';

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

type DirectEntrySaveResponse = {
    entry: CanonicalEntryPayload;
};

const INTRO_COLLAPSED_STORAGE_KEY = 'today_intro_collapsed';
const GENERIC_SYNC_ERROR = 'Sync request failed. Try again.';
const BATCH_SYNC_ERROR = 'Sync could not send this batch. Try again in a moment.';
const DISCARD_CONFLICT_COPY_CONFIRMATION = 'Discard the saved local copy and keep the synced version?';

function syncErrorText(syncError: SyncErrorPayload | null): string | null {
    if (!syncError) {
        return null;
    }

    if (typeof syncError === 'string') {
        return syncError;
    }

    return Object.values(syncError).flat()[0] ?? null;
}

function hasActionableSyncStatus(entry: LocalEntry | null): entry is LocalEntry {
    return entry !== null && (
        entry.sync_status === 'failed'
        || entry.sync_status === 'rejected'
        || entry.sync_status === 'conflict'
    );
}

function hasDurableLocalStatus(entry: LocalEntry): boolean {
    return entry.sync_status === 'failed'
        || entry.sync_status === 'rejected'
        || entry.sync_status === 'conflict'
        || entry.sync_status === 'pending';
}

function canonicalText(value: string | null): string {
    return value ?? '';
}

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
    const [currentEntry, setCurrentEntry] = useState<LocalEntry | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
    const [savedCount, setSavedCount] = useState<number>(() => Number(localStorage.getItem('save_count') ?? '0'));
    const [isKnownUser, setIsKnownUser] = useState(false);
    const [isIntroExpanded, setIsIntroExpanded] = useState(() => localStorage.getItem(INTRO_COLLAPSED_STORAGE_KEY) !== '1');
    const [seedMessage, setSeedMessage] = useState<string | null>(null);
    const [syncActionError, setSyncActionError] = useState<string | null>(null);
    const [isLocalCopyExpanded, setIsLocalCopyExpanded] = useState(false);
    const [localFlashbacks, setLocalFlashbacks] = useState<{ weekAgo: Flashback; yearAgo: Flashback }>({
        weekAgo: null,
        yearAgo: null,
    });
    const lastSeedQueryRef = useRef<string | null>(null);

    const hasNonEmptyContent = useMemo(
        () => [person, grace, gratitude].some((value) => value.trim().length > 0),
        [person, grace, gratitude],
    );

    const collapseIntro = () => {
        localStorage.setItem(INTRO_COLLAPSED_STORAGE_KEY, '1');
        setIsIntroExpanded(false);
    };

    const expandIntro = () => {
        localStorage.removeItem(INTRO_COLLAPSED_STORAGE_KEY);
        setIsIntroExpanded(true);
    };

    useEffect(() => {
        let ignore = false;

        const load = async () => {
            const localEntryCount = await countLocalEntries();
            const knownUser = localEntryCount >= 3;

            if (!ignore) {
                setIsKnownUser(knownUser);
                if (knownUser && localStorage.getItem(INTRO_COLLAPSED_STORAGE_KEY) === null) {
                    setIsIntroExpanded(false);
                }
            }

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
            let resolvedEntry: LocalEntry | null = null;

            if (local) {
                resolvedEntry = local;

                if (server && !hasDurableLocalStatus(local) && local.updated_at <= server.updated_at) {
                    const syncedAt = Date.now();

                    resolvedEntry = await upsertLocalEntry({
                        entry_date: server.entry_date,
                        person: canonicalText(server.person),
                        grace: canonicalText(server.grace),
                        gratitude: canonicalText(server.gratitude),
                        updated_at: server.updated_at,
                        synced_at: syncedAt,
                        server_entry_date: server.entry_date,
                        sync_status: 'synced',
                        sync_error: null,
                        server_payload: server,
                        conflict_local_payload: null,
                        last_sync_attempt_at: syncedAt,
                    });
                }
            } else if (server) {
                const syncedAt = Date.now();

                resolvedEntry = await upsertLocalEntry({
                    entry_date: server.entry_date,
                    person: canonicalText(server.person),
                    grace: canonicalText(server.grace),
                    gratitude: canonicalText(server.gratitude),
                    updated_at: server.updated_at,
                    synced_at: syncedAt,
                    server_entry_date: server.entry_date,
                    sync_status: 'synced',
                    sync_error: null,
                    server_payload: server,
                    conflict_local_payload: null,
                    last_sync_attempt_at: syncedAt,
                });
            }

            if (ignore) {
                return;
            }

            if (!resolvedEntry) {
                setPerson('');
                setGrace('');
                setGratitude('');
                setCurrentEntry(null);
                setLastSavedAt(null);

                return;
            }

            setPerson(resolvedEntry.person);
            setGrace(resolvedEntry.grace);
            setGratitude(resolvedEntry.gratitude);
            setCurrentEntry(resolvedEntry);
            setLastSavedAt(resolvedEntry.updated_at);
        };

        load();

        if (props.auth.user) {
            pushUnsyncedEntries()
                .catch(() => null)
                .finally(async () => {
                    const refreshedEntry = await getEntryByDate(props.date);

                    if (!ignore) {
                        setCurrentEntry(refreshedEntry ?? null);
                    }
                });
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
        setSyncActionError(null);
        setIsLocalCopyExpanded(false);

        try {
            const localEntry = await upsertLocalEntry({
                entry_date: props.date,
                person,
                grace,
                gratitude,
                updated_at: updatedAt,
                synced_at: null,
                server_entry_date: props.date,
                sync_status: 'local',
                sync_error: null,
                server_payload: null,
                conflict_local_payload: null,
                last_sync_attempt_at: null,
            });
            setCurrentEntry(localEntry);
            setLastSavedAt(updatedAt);

            if (props.auth.user) {
                const attemptedAt = Date.now();
                const pendingEntry = await upsertLocalEntry({
                    ...localEntry,
                    sync_status: 'pending',
                    sync_error: null,
                    last_sync_attempt_at: attemptedAt,
                });
                setCurrentEntry(pendingEntry);

                try {
                    const response = await axios.post<DirectEntrySaveResponse>('/entries/upsert', {
                        entry_date: props.date,
                        person,
                        grace,
                        gratitude,
                        updated_at: updatedAt,
                    });
                    const canonical = response.data.entry;
                    const syncedAt = Date.now();

                    const syncedEntry = await upsertLocalEntry({
                        local_id: pendingEntry.local_id,
                        entry_date: canonical.entry_date,
                        person: canonicalText(canonical.person),
                        grace: canonicalText(canonical.grace),
                        gratitude: canonicalText(canonical.gratitude),
                        updated_at: canonical.updated_at,
                        synced_at: syncedAt,
                        server_entry_date: canonical.entry_date,
                        sync_status: 'synced',
                        sync_error: null,
                        server_payload: canonical,
                        conflict_local_payload: null,
                        last_sync_attempt_at: syncedAt,
                    });

                    setCurrentEntry(syncedEntry);
                    setLastSavedAt(canonical.updated_at);
                } catch {
                    const failedEntry = await upsertLocalEntry({
                        ...localEntry,
                        sync_status: 'failed',
                        sync_error: GENERIC_SYNC_ERROR,
                        server_payload: null,
                        conflict_local_payload: null,
                        last_sync_attempt_at: attemptedAt,
                    });

                    setCurrentEntry(failedEntry);
                    setSyncActionError(BATCH_SYNC_ERROR);
                }
            } else if (hasNonEmptyContent) {
                const nextCount = savedCount + 1;
                localStorage.setItem('save_count', `${nextCount}`);
                setSavedCount(nextCount);
            }

            if (!isKnownUser) {
                const localEntryCount = await countLocalEntries();
                if (localEntryCount >= 3) {
                    setIsKnownUser(true);
                }
            }
        } finally {
            setIsSaving(false);
        }
    };

    const retrySync = async () => {
        setIsRetrying(true);
        setSyncActionError(null);

        try {
            await pushUnsyncedEntries();
        } catch {
            setSyncActionError(BATCH_SYNC_ERROR);
        } finally {
            const refreshedEntry = await getEntryByDate(props.date);
            setCurrentEntry(refreshedEntry ?? null);
            setIsRetrying(false);
        }
    };

    const focusEntryForEdit = () => {
        setSyncActionError(null);
        document.querySelector<HTMLTextAreaElement>('textarea')?.focus();
    };

    const openLocalCopyReview = () => {
        setIsLocalCopyExpanded(true);
    };

    const discardLocalConflictCopy = async () => {
        if (!currentEntry || !window.confirm(DISCARD_CONFLICT_COPY_CONFIRMATION)) {
            return;
        }

        const syncedAt = currentEntry.synced_at ?? Date.now();
        const updatedEntry = await upsertLocalEntry({
            ...currentEntry,
            synced_at: syncedAt,
            sync_status: 'synced',
            sync_error: null,
            conflict_local_payload: null,
            last_sync_attempt_at: syncedAt,
        });

        setCurrentEntry(updatedEntry);
        setIsLocalCopyExpanded(false);
    };

    const formattedDate = new Date(`${props.date}T00:00:00`).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const baseUrl = window.location.origin.replace(/\/+$/, '');
    const todayUrl = `${baseUrl}/today`;
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        '@id': `${todayUrl}#app`,
        name: 'consider.today',
        url: todayUrl,
        description: 'A daily gratitude reflection app with three prompts and optional cross-device sync.',
        applicationCategory: 'LifestyleApplication',
        operatingSystem: 'Any',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
        },
        featureList: [
            'Daily three-prompt gratitude journal',
            'Private by default with local-first storage',
            'Optional sync across devices after sign in',
            'History and reflection flashbacks',
        ],
    };
    const syncStatusAlertEntry = hasActionableSyncStatus(currentEntry) ? currentEntry : null;
    const syncStatusError = syncActionError ?? syncErrorText(currentEntry?.sync_error ?? null);
    const conflictLocalCopy = currentEntry?.sync_status === 'conflict' ? currentEntry.conflict_local_payload : null;

    return (
        <AppShell>
            <SeoHead
                title="Today"
                description="Write your daily gratitude reflection in three short prompts. Entries are private by default and stored locally first."
                canonicalPath="/today"
                noIndex
                structuredData={structuredData}
            />

            <div className="card rounded-2xl border border-base-300/50 bg-base-100 app-card-surface shadow-sm">
                <div className="card-body gap-4 p-6">
                    {!isIntroExpanded ? (
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h1 className="text-2xl font-semibold text-base-content">Welcome Back</h1>
                                <p className="text-sm text-base-content/70">{formattedDate}</p>
                            </div>
                            <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={expandIntro}
                            >
                                Show intro
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between gap-3">
                                <h1 className="text-2xl font-semibold text-base-content">Today</h1>
                                <button
                                    type="button"
                                    aria-label="Close intro"
                                    className="btn btn-ghost btn-sm btn-circle"
                                    onClick={collapseIntro}
                                >
                                    ×
                                </button>
                            </div>
                            <p className="text-sm text-base-content/70">{formattedDate}</p>
                            <p className="text-sm text-base-content/70">This is your 3-prompt gratitude journal.</p>
                            <p className="text-sm text-base-content/70">Private by default. Your entries stay on your local device until you decide otherwise.</p>
                            <p className="text-sm text-base-content/70">
                                Entries can be exported anytime. Sign in to sync so your reflections are available across devices.
                            </p>
                        </>
                    )}
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

            <div className="mt-2 flex flex-col gap-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <button className="btn btn-primary btn-lg w-full rounded-xl sm:w-auto" onClick={saveEntry} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save entry'}
                    </button>
                    <div className="flex flex-col gap-2 text-sm text-base-content/70 sm:flex-row sm:items-center">
                        {lastSavedAt && <p>Last saved {new Date(lastSavedAt).toLocaleTimeString()}</p>}
                        {currentEntry && (
                            <EntrySyncStatus
                                status={currentEntry.sync_status}
                                isSyncing={isSaving && currentEntry.sync_status === 'pending'}
                            />
                        )}
                    </div>
                </div>
                {!props.auth.user && savedCount >= props.loginPromptThreshold && (
                    <div className="alert alert-info py-2">
                        Sync and backup across devices is optional. Use the sign in button in the header.
                    </div>
                )}
                {syncStatusAlertEntry && (
                    <EntrySyncStatus
                        status={syncStatusAlertEntry.sync_status}
                        mode="alert"
                        isSyncing={isRetrying && syncStatusAlertEntry.sync_status === 'failed'}
                        isBusy={isSaving || isRetrying}
                        errorText={syncStatusError}
                        onRetry={syncStatusAlertEntry.sync_status === 'failed' ? retrySync : undefined}
                        onEdit={syncStatusAlertEntry.sync_status === 'rejected' ? focusEntryForEdit : undefined}
                        onReviewLocalCopy={
                            syncStatusAlertEntry.sync_status === 'conflict' ? openLocalCopyReview : undefined
                        }
                        retryLabel="Retry sync"
                        editLabel="Edit entry"
                        reviewLocalCopyLabel="Review local copy"
                    />
                )}
                {conflictLocalCopy && (
                    <details
                        className="rounded-xl border border-base-300/50 bg-base-100 p-4 text-sm"
                        open={isLocalCopyExpanded}
                        onToggle={(event) => setIsLocalCopyExpanded(event.currentTarget.open)}
                    >
                        <summary className="cursor-pointer font-semibold text-base-content">Review local copy</summary>
                        <div className="mt-3 grid gap-3">
                            <div>
                                <p className="font-semibold text-base-content">Who</p>
                                <p className="whitespace-pre-wrap text-base-content/70">{canonicalText(conflictLocalCopy.person) || '-'}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-base-content">Grace</p>
                                <p className="whitespace-pre-wrap text-base-content/70">{canonicalText(conflictLocalCopy.grace) || '-'}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-base-content">Gratitude</p>
                                <p className="whitespace-pre-wrap text-base-content/70">{canonicalText(conflictLocalCopy.gratitude) || '-'}</p>
                            </div>
                            <button
                                type="button"
                                className="btn btn-error btn-sm w-fit rounded-xl"
                                onClick={discardLocalConflictCopy}
                            >
                                Discard local copy
                            </button>
                        </div>
                    </details>
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
