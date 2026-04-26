import Dexie from 'dexie';
import axios from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CanonicalEntryPayload, LocalEntry, SyncErrorPayload, SyncStatus } from './db';

vi.mock('axios', () => ({
    default: {
        post: vi.fn(),
    },
}));

const databaseName = 'gratitude_journal';
const mockedAxiosPost = vi.mocked(axios.post);

type DbModule = typeof import('./db');

type LegacyEntry = {
    local_id: string;
    entry_date: string;
    person: string;
    grace: string;
    gratitude: string;
    updated_at: number;
    synced_at: number | null;
    server_entry_date: string | null;
};

let currentModule: DbModule | null = null;

function installLocalStorage(): void {
    const items = new Map<string, string>();
    const storage: Storage = {
        get length() {
            return items.size;
        },
        clear: () => items.clear(),
        getItem: (key: string) => items.get(key) ?? null,
        key: (index: number) => Array.from(items.keys())[index] ?? null,
        removeItem: (key: string) => items.delete(key),
        setItem: (key: string, value: string) => items.set(key, value),
    };

    Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: storage,
    });
}

function deleteDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(databaseName);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error ?? new Error('Could not delete IndexedDB database'));
        request.onblocked = () => reject(new Error('IndexedDB database deletion was blocked'));
    });
}

async function importFreshDb(): Promise<DbModule> {
    const module = await import('./db');
    currentModule = module;

    return module;
}

function makeEntry(syncStatus: SyncStatus, offset: number): LocalEntry {
    const entryDate = `2026-04-${String(offset + 1).padStart(2, '0')}`;

    return {
        local_id: `entry-${syncStatus}`,
        entry_date: entryDate,
        person: `Person ${syncStatus}`,
        grace: `Grace ${syncStatus}`,
        gratitude: `Gratitude ${syncStatus}`,
        updated_at: offset,
        synced_at: syncStatus === 'synced' ? offset : null,
        server_entry_date: null,
        sync_status: syncStatus,
        sync_error: null,
        server_payload: null,
        conflict_local_payload: null,
        last_sync_attempt_at: null,
    };
}

function makeLocalEntry(overrides: Partial<LocalEntry> = {}): LocalEntry {
    return {
        local_id: 'entry-local',
        entry_date: '2026-04-10',
        person: 'Local person',
        grace: 'Local grace',
        gratitude: 'Local gratitude',
        updated_at: 100,
        synced_at: null,
        server_entry_date: null,
        sync_status: 'local',
        sync_error: null,
        server_payload: null,
        conflict_local_payload: null,
        last_sync_attempt_at: null,
        ...overrides,
    };
}

function makeCanonicalEntry(overrides: Partial<CanonicalEntryPayload> = {}): CanonicalEntryPayload {
    return {
        entry_date: '2026-04-10',
        person: 'Server person',
        grace: 'Server grace',
        gratitude: 'Server gratitude',
        updated_at: 200,
        ...overrides,
    };
}

describe('local gratitude IndexedDB sync state', () => {
    beforeEach(async () => {
        vi.resetModules();
        mockedAxiosPost.mockReset();
        installLocalStorage();
        await deleteDatabase();
        currentModule = null;
    });

    afterEach(async () => {
        currentModule?.db.close();
        currentModule = null;
        await deleteDatabase();
    });

    it('migrates legacy version 1 entries to explicit synced and local statuses without changing prompt text', async () => {
        const legacyDb = new Dexie(databaseName);
        legacyDb.version(1).stores({
            entries: 'local_id, &entry_date, updated_at, synced_at',
        });

        await legacyDb.table<LegacyEntry, string>('entries').bulkPut([
            {
                local_id: 'legacy-synced',
                entry_date: '2026-04-01',
                person: 'Synced person',
                grace: 'Synced grace',
                gratitude: 'Synced gratitude',
                updated_at: 100,
                synced_at: 200,
                server_entry_date: '2026-04-01',
            },
            {
                local_id: 'legacy-local',
                entry_date: '2026-04-02',
                person: 'Local person',
                grace: 'Local grace',
                gratitude: 'Local gratitude',
                updated_at: 300,
                synced_at: null,
                server_entry_date: null,
            },
        ]);
        legacyDb.close();

        const { db } = await importFreshDb();
        const entries = await db.entries.orderBy('entry_date').toArray();

        expect(entries).toHaveLength(2);
        expect(entries[0]).toMatchObject({
            local_id: 'legacy-synced',
            person: 'Synced person',
            grace: 'Synced grace',
            gratitude: 'Synced gratitude',
            sync_status: 'synced',
            sync_error: null,
            server_payload: null,
            conflict_local_payload: null,
            last_sync_attempt_at: null,
        });
        expect(entries[1]).toMatchObject({
            local_id: 'legacy-local',
            person: 'Local person',
            grace: 'Local grace',
            gratitude: 'Local gratitude',
            sync_status: 'local',
            sync_error: null,
            server_payload: null,
            conflict_local_payload: null,
            last_sync_attempt_at: null,
        });
    });

    it('defaults new local saves to local and canonical synced saves to synced', async () => {
        const { getEntryByDate, upsertLocalEntry } = await importFreshDb();

        await upsertLocalEntry({
            entry_date: '2026-04-03',
            person: 'Local person',
            grace: 'Local grace',
            gratitude: 'Local gratitude',
            updated_at: 400,
            synced_at: null,
            server_entry_date: null,
        });

        await upsertLocalEntry({
            entry_date: '2026-04-04',
            person: 'Synced person',
            grace: 'Synced grace',
            gratitude: 'Synced gratitude',
            updated_at: 500,
            synced_at: 600,
            server_entry_date: '2026-04-04',
        });

        await expect(getEntryByDate('2026-04-03')).resolves.toMatchObject({
            sync_status: 'local',
            sync_error: null,
            server_payload: null,
            conflict_local_payload: null,
            last_sync_attempt_at: null,
        });
        await expect(getEntryByDate('2026-04-04')).resolves.toMatchObject({
            sync_status: 'synced',
            sync_error: null,
            server_payload: null,
            conflict_local_payload: null,
            last_sync_attempt_at: null,
        });
    });

    it('lists only local and failed entries for automatic retry', async () => {
        const { db, listUnsyncedEntries } = await importFreshDb();
        const statuses: SyncStatus[] = ['local', 'failed', 'pending', 'synced', 'rejected', 'conflict'];

        await db.entries.bulkPut(statuses.map((status, index) => makeEntry(status, index)));

        const retryable = await listUnsyncedEntries();

        expect(retryable.map((entry) => entry.sync_status).sort()).toEqual(['failed', 'local']);
        expect(retryable.map((entry) => entry.sync_status)).not.toContain('pending');
        expect(retryable.map((entry) => entry.sync_status)).not.toContain('synced');
        expect(retryable.map((entry) => entry.sync_status)).not.toContain('rejected');
        expect(retryable.map((entry) => entry.sync_status)).not.toContain('conflict');
    });

    it('applySyncResult_stores_canonical_upserted_entries', async () => {
        const { applySyncResult, db, getEntryByDate } = await importFreshDb();
        const local = makeLocalEntry({
            sync_error: 'Previous failure',
            server_payload: makeCanonicalEntry({ person: 'Old server person', updated_at: 50 }),
            conflict_local_payload: makeCanonicalEntry({ person: 'Old conflict person', updated_at: 60 }),
        });
        const canonical = makeCanonicalEntry();

        await db.entries.put(local);

        const updated = await applySyncResult(
            local,
            { entry_date: canonical.entry_date, status: 'upserted', entry: canonical },
            1234,
        );
        const stored = await getEntryByDate(canonical.entry_date);

        expect(updated).toMatchObject({
            entry_date: canonical.entry_date,
            person: canonical.person,
            grace: canonical.grace,
            gratitude: canonical.gratitude,
            updated_at: canonical.updated_at,
            synced_at: 1234,
            server_entry_date: canonical.entry_date,
            sync_status: 'synced',
            sync_error: null,
            server_payload: canonical,
            conflict_local_payload: null,
        });
        expect(stored).toMatchObject(updated);
    });

    it('applySyncResult_marks_identical_skipped_entries_synced', async () => {
        const { applySyncResult, db, getEntryByDate } = await importFreshDb();
        const canonical = makeCanonicalEntry({
            person: 'Same person',
            grace: 'Same grace',
            gratitude: 'Same gratitude',
        });
        const local = makeLocalEntry({
            person: canonical.person ?? '',
            grace: canonical.grace ?? '',
            gratitude: canonical.gratitude ?? '',
            updated_at: canonical.updated_at,
            sync_status: 'failed',
            sync_error: 'Sync request failed. Try again.',
        });

        await db.entries.put(local);

        await applySyncResult(
            local,
            { entry_date: canonical.entry_date, status: 'skipped', entry: canonical },
            2345,
        );
        const stored = await getEntryByDate(canonical.entry_date);

        expect(stored).toMatchObject({
            person: canonical.person,
            grace: canonical.grace,
            gratitude: canonical.gratitude,
            updated_at: canonical.updated_at,
            synced_at: 2345,
            server_entry_date: canonical.entry_date,
            sync_status: 'synced',
            sync_error: null,
            server_payload: canonical,
            conflict_local_payload: null,
        });
    });

    it('applySyncResult_preserves_local_copy_for_server_newer_conflicts', async () => {
        const { applySyncResult, db, getEntryByDate, listUnsyncedEntries } = await importFreshDb();
        const local = makeLocalEntry({
            entry_date: '2026-04-11',
            person: 'Losing local person',
            grace: 'Losing local grace',
            gratitude: 'Losing local gratitude',
            updated_at: 300,
        });
        const canonical = makeCanonicalEntry({
            entry_date: '2026-04-11',
            person: 'Winning server person',
            grace: 'Winning server grace',
            gratitude: 'Winning server gratitude',
            updated_at: 400,
        });

        await db.entries.put(local);

        await applySyncResult(
            local,
            { entry_date: canonical.entry_date, status: 'skipped', entry: canonical },
            3456,
        );
        const stored = await getEntryByDate(canonical.entry_date);
        const retryable = await listUnsyncedEntries();

        expect(stored).toMatchObject({
            person: canonical.person,
            grace: canonical.grace,
            gratitude: canonical.gratitude,
            updated_at: canonical.updated_at,
            synced_at: 3456,
            server_entry_date: canonical.entry_date,
            sync_status: 'conflict',
            sync_error: null,
            server_payload: canonical,
            conflict_local_payload: {
                entry_date: local.entry_date,
                person: local.person,
                grace: local.grace,
                gratitude: local.gratitude,
                updated_at: local.updated_at,
            },
        });
        expect(retryable).toHaveLength(0);
    });

    it('applySyncResult_ignores_stale_results_after_newer_local_edits', async () => {
        const { applySyncResult, db, getEntryByDate } = await importFreshDb();
        const pending = makeLocalEntry({
            entry_date: '2026-04-15',
            person: 'Pending person',
            grace: 'Pending grace',
            gratitude: 'Pending gratitude',
            sync_status: 'pending',
            last_sync_attempt_at: 7777,
        });
        const newerLocal = {
            ...pending,
            person: 'Newer local person',
            grace: 'Newer local grace',
            gratitude: 'Newer local gratitude',
            updated_at: 900,
            sync_status: 'local' as const,
            last_sync_attempt_at: null,
        };
        const canonical = makeCanonicalEntry({
            entry_date: '2026-04-15',
            person: 'Older server person',
            grace: 'Older server grace',
            gratitude: 'Older server gratitude',
            updated_at: 800,
        });

        await db.entries.put(pending);
        await db.entries.put(newerLocal);

        const updated = await applySyncResult(
            pending,
            { entry_date: canonical.entry_date, status: 'skipped', entry: canonical },
            7777,
        );
        const stored = await getEntryByDate(canonical.entry_date);

        expect(updated).toMatchObject(newerLocal);
        expect(stored).toMatchObject(newerLocal);
    });

    it('applySyncResult_preserves_current_local_copy_for_conflicts', async () => {
        const { applySyncResult, db, getEntryByDate } = await importFreshDb();
        const pending = makeLocalEntry({
            entry_date: '2026-04-16',
            person: 'Stale pending person',
            grace: 'Stale pending grace',
            gratitude: 'Stale pending gratitude',
            sync_status: 'pending',
            last_sync_attempt_at: 8888,
        });
        const current = {
            ...pending,
            person: 'Current pending person',
            grace: 'Current pending grace',
            gratitude: 'Current pending gratitude',
            updated_at: 950,
        };
        const canonical = makeCanonicalEntry({
            entry_date: '2026-04-16',
            person: 'Winning server person',
            grace: 'Winning server grace',
            gratitude: 'Winning server gratitude',
            updated_at: 1000,
        });

        await db.entries.put(pending);
        await db.entries.put(current);

        await applySyncResult(
            pending,
            { entry_date: canonical.entry_date, status: 'skipped', entry: canonical },
            8888,
        );
        const stored = await getEntryByDate(canonical.entry_date);

        expect(stored?.conflict_local_payload).toMatchObject({
            entry_date: current.entry_date,
            person: current.person,
            grace: current.grace,
            gratitude: current.gratitude,
            updated_at: current.updated_at,
        });
    });

    it('applySyncResult_marks_rejected_entries_non_retryable', async () => {
        const { applySyncResult, db, getEntryByDate, listUnsyncedEntries } = await importFreshDb();
        const local = makeLocalEntry({
            entry_date: '2026-04-12',
            person: 'Invalid local person',
            grace: 'Invalid local grace',
            gratitude: 'Invalid local gratitude',
            updated_at: 500,
        });
        const errors: SyncErrorPayload = {
            person: ['The person field must not be greater than 5000 characters.'],
        };

        await db.entries.put(local);

        await applySyncResult(local, { entry_date: local.entry_date, status: 'rejected', errors }, 4567);
        const stored = await getEntryByDate(local.entry_date);
        const retryable = await listUnsyncedEntries();

        expect(stored).toMatchObject({
            person: local.person,
            grace: local.grace,
            gratitude: local.gratitude,
            updated_at: local.updated_at,
            synced_at: null,
            sync_status: 'rejected',
            sync_error: errors,
            server_payload: null,
            conflict_local_payload: null,
            last_sync_attempt_at: 4567,
        });
        expect(retryable).toHaveLength(0);
    });

    it('pushUnsyncedEntries_marks_attempted_entries_failed_when_the_request_fails', async () => {
        const { db, getEntryByDate, listUnsyncedEntries, pushUnsyncedEntries } = await importFreshDb();
        const local = makeLocalEntry({
            entry_date: '2026-04-13',
            person: 'Private local person',
            grace: 'Private local grace',
            gratitude: 'Private local gratitude',
        });
        const alreadyFailed = makeLocalEntry({
            local_id: 'entry-failed',
            entry_date: '2026-04-14',
            sync_status: 'failed',
            sync_error: 'Previous request failed.',
        });

        await db.entries.bulkPut([local, alreadyFailed]);
        mockedAxiosPost.mockRejectedValueOnce(new Error('network down'));

        await expect(pushUnsyncedEntries()).rejects.toThrow('network down');

        const failedLocal = await getEntryByDate(local.entry_date);
        const failedRetry = await getEntryByDate(alreadyFailed.entry_date);
        const retryable = await listUnsyncedEntries();

        expect(mockedAxiosPost).toHaveBeenCalledWith('/api/sync/push', {
            device_id: expect.any(String),
            entries: expect.arrayContaining([
                expect.objectContaining({ entry_date: local.entry_date }),
                expect.objectContaining({ entry_date: alreadyFailed.entry_date }),
            ]),
        });
        expect(failedLocal).toMatchObject({
            sync_status: 'failed',
            sync_error: 'Sync request failed. Try again.',
        });
        expect(failedRetry).toMatchObject({
            sync_status: 'failed',
            sync_error: 'Sync request failed. Try again.',
        });
        expect(String(failedLocal?.sync_error)).not.toContain('Private local person');
        expect(failedLocal?.last_sync_attempt_at).toEqual(expect.any(Number));
        expect(failedRetry?.last_sync_attempt_at).toEqual(expect.any(Number));
        expect(retryable.map((entry) => entry.entry_date).sort()).toEqual([
            alreadyFailed.entry_date,
            local.entry_date,
        ].sort());
    });
});
