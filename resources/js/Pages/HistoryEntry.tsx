import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import AppShell from '../Components/AppShell';
import EntrySyncStatus from '../Components/EntrySyncStatus';
import SeoHead from '../Components/SeoHead';
import { formatHumanDate } from '../lib/date';
import {
    getEntryByDate,
    pushUnsyncedEntries,
    upsertLocalEntry,
    type CanonicalEntryPayload,
    type LocalEntry,
    type SyncErrorPayload,
    type SyncStatus,
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
};

type ResolvedEntry = {
    local_id?: string;
    entry_date: string;
    person: string | null;
    grace: string | null;
    gratitude: string | null;
    updated_at: number;
    synced_at: number | null;
    server_entry_date: string | null;
    sync_status: SyncStatus;
    sync_error: SyncErrorPayload | null;
    server_payload: CanonicalEntryPayload | null;
    conflict_local_payload: CanonicalEntryPayload | null;
} | null;

const DISCARD_CONFLICT_COPY_CONFIRMATION = 'Discard the saved local copy and keep the synced version?';
const BATCH_SYNC_ERROR = 'Sync could not send this batch. Try again in a moment.';

function canonicalText(value: string | null): string {
    return value ?? '';
}

function syncErrorText(syncError: SyncErrorPayload | null): string | null {
    if (!syncError) {
        return null;
    }

    if (typeof syncError === 'string') {
        return syncError;
    }

    return Object.values(syncError).flat()[0] ?? null;
}

function hasDurableLocalStatus(entry: LocalEntry): boolean {
    return entry.sync_status === 'failed'
        || entry.sync_status === 'rejected'
        || entry.sync_status === 'conflict'
        || entry.sync_status === 'pending';
}

function fromServerEntry(entry: NonNullable<Entry>): ResolvedEntry {
    return {
        entry_date: entry.entry_date,
        person: entry.person,
        grace: entry.grace,
        gratitude: entry.gratitude,
        updated_at: entry.updated_at,
        synced_at: Date.now(),
        server_entry_date: entry.entry_date,
        sync_status: 'synced',
        sync_error: null,
        server_payload: entry,
        conflict_local_payload: null,
    };
}

function ReadOnlySection({ title, value }: { title: ReactNode; value: string | null }) {
    return (
        <div className="card rounded-2xl border border-base-300/50 bg-base-100 app-card-surface shadow-sm">
            <div className="card-body gap-4 p-6">
                <h2 className="text-base font-medium text-base-content">{title}</h2>
                <div className="min-h-[120px] whitespace-pre-wrap rounded-xl border border-base-300/70 bg-base-100 app-input-surface p-4 text-base leading-relaxed text-base-content">
                    {value?.trim() || '-'}
                </div>
            </div>
        </div>
    );
}

export default function HistoryEntry() {
    const { props } = usePage<PageProps>();
    const [resolvedEntry, setResolvedEntry] = useState<ResolvedEntry>(() => (
        props.entry ? fromServerEntry(props.entry) : null
    ));
    const [isLocalCopyExpanded, setIsLocalCopyExpanded] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);
    const [syncActionError, setSyncActionError] = useState<string | null>(null);
    const formattedDate = formatHumanDate(props.date);

    useEffect(() => {
        let ignore = false;

        const load = async () => {
            const local = await getEntryByDate(props.date);
            const server = props.entry;

            if (!local && !server) {
                if (!ignore) {
                    setResolvedEntry(null);
                }

                return;
            }

            if (!local) {
                if (!ignore) {
                    setResolvedEntry(server ? fromServerEntry(server) : null);
                }

                return;
            }

            if (!server || hasDurableLocalStatus(local) || local.updated_at >= server.updated_at) {
                if (!ignore) {
                    setResolvedEntry(local);
                }

                return;
            }

            if (!ignore) {
                setResolvedEntry(fromServerEntry(server));
            }
        };

        load();

        return () => {
            ignore = true;
        };
    }, [props.date, props.entry]);

    const discardLocalConflictCopy = async () => {
        if (!resolvedEntry?.local_id || !window.confirm(DISCARD_CONFLICT_COPY_CONFIRMATION)) {
            return;
        }

        const syncedAt = resolvedEntry.synced_at ?? Date.now();
        const updatedEntry = await upsertLocalEntry({
            local_id: resolvedEntry.local_id,
            entry_date: resolvedEntry.entry_date,
            person: canonicalText(resolvedEntry.person),
            grace: canonicalText(resolvedEntry.grace),
            gratitude: canonicalText(resolvedEntry.gratitude),
            updated_at: resolvedEntry.updated_at,
            synced_at: syncedAt,
            server_entry_date: resolvedEntry.server_entry_date ?? resolvedEntry.entry_date,
            sync_status: 'synced',
            sync_error: null,
            server_payload: resolvedEntry.server_payload,
            conflict_local_payload: null,
            last_sync_attempt_at: syncedAt,
        });

        setResolvedEntry(updatedEntry);
        setIsLocalCopyExpanded(false);
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

            if (refreshedEntry) {
                setResolvedEntry(refreshedEntry);
            }

            setIsRetrying(false);
        }
    };

    const visitEditEntry = () => {
        window.location.assign(`/today?date=${resolvedEntry?.entry_date ?? props.date}`);
    };

    const conflictLocalCopy = resolvedEntry?.sync_status === 'conflict'
        ? resolvedEntry.conflict_local_payload
        : null;
    const syncStatusError = syncActionError ?? syncErrorText(resolvedEntry?.sync_error ?? null);

    return (
        <AppShell>
            <SeoHead
                title={formattedDate}
                description="Read a previously saved daily reflection."
                canonicalPath={`/history/${props.date}`}
                noIndex
            />

            <div className="card rounded-2xl border border-base-300/50 bg-base-100 app-card-surface shadow-sm">
                <div className="card-body gap-4 p-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-base-content">{formattedDate}</h1>
                        <p className="text-sm text-base-content/70">Saved reflection</p>
                        {resolvedEntry && (
                            <div className="mt-2">
                                <EntrySyncStatus
                                    status={resolvedEntry.sync_status}
                                    isSyncing={isRetrying && resolvedEntry.sync_status === 'failed'}
                                />
                            </div>
                        )}
                    </div>
                    <div>
                        <Link href="/history" className="btn btn-sm">
                            Back to History
                        </Link>
                    </div>
                </div>
            </div>

            {resolvedEntry && (
                resolvedEntry.sync_status === 'failed'
                || resolvedEntry.sync_status === 'rejected'
                || resolvedEntry.sync_status === 'conflict'
            ) && (
                <EntrySyncStatus
                    status={resolvedEntry.sync_status}
                    mode="alert"
                    isSyncing={isRetrying && resolvedEntry.sync_status === 'failed'}
                    isBusy={isRetrying}
                    errorText={syncStatusError}
                    onRetry={resolvedEntry.sync_status === 'failed' ? retrySync : undefined}
                    onEdit={resolvedEntry.sync_status === 'rejected' ? visitEditEntry : undefined}
                    onReviewLocalCopy={
                        resolvedEntry.sync_status === 'conflict' ? () => setIsLocalCopyExpanded(true) : undefined
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

            <ReadOnlySection
                title={
                    <>
                        <span className="font-semibold">Who</span> are you grateful for today?
                    </>
                }
                value={resolvedEntry?.person ?? null}
            />
            <ReadOnlySection
                title={
                    <>
                        What moment of <span className="font-semibold">grace</span> did you notice?
                    </>
                }
                value={resolvedEntry?.grace ?? null}
            />
            <ReadOnlySection
                title={
                    <>
                        What else are you <span className="font-semibold">grateful</span> for?
                    </>
                }
                value={resolvedEntry?.gratitude ?? null}
            />
        </AppShell>
    );
}
