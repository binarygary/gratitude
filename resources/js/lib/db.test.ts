import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LocalEntry, SyncStatus } from './db';

const databaseName = 'gratitude_journal';

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

describe('local gratitude IndexedDB sync state', () => {
    beforeEach(async () => {
        vi.resetModules();
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
});
