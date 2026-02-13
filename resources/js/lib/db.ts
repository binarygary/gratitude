import Dexie, { type Table } from 'dexie';
import axios from 'axios';

export type LocalEntry = {
    local_id: string;
    entry_date: string;
    person: string;
    grace: string;
    gratitude: string;
    updated_at: number;
    synced_at: number | null;
    server_entry_date: string | null;
};

class GratitudeDb extends Dexie {
    entries!: Table<LocalEntry, string>;

    constructor() {
        super('gratitude_journal');
        this.version(1).stores({
            entries: 'local_id, &entry_date, updated_at, synced_at',
        });
    }
}

export const db = new GratitudeDb();

export function getDeviceId(): string {
    const key = 'gratitude_device_id';
    const existing = localStorage.getItem(key);

    if (existing) {
        return existing;
    }

    const generated = crypto.randomUUID();
    localStorage.setItem(key, generated);
    return generated;
}

export async function getEntryByDate(entryDate: string): Promise<LocalEntry | undefined> {
    return db.entries.where('entry_date').equals(entryDate).first();
}

export async function upsertLocalEntry(
    payload: Omit<LocalEntry, 'local_id'> & { local_id?: string },
): Promise<LocalEntry> {
    const entryDate = payload.entry_date ?? payload.server_entry_date;
    if (!entryDate) {
        throw new Error('entry_date is required to upsert a local entry');
    }

    const existing = await getEntryByDate(entryDate);
    const localId = payload.local_id ?? existing?.local_id ?? crypto.randomUUID();

    const record: LocalEntry = {
        local_id: localId,
        entry_date: entryDate,
        person: payload.person,
        grace: payload.grace,
        gratitude: payload.gratitude,
        updated_at: payload.updated_at,
        synced_at: payload.synced_at,
        server_entry_date: payload.server_entry_date ?? entryDate,
    };

    await db.entries.put(record);

    return record;
}

export async function listAllEntries(): Promise<LocalEntry[]> {
    return db.entries.orderBy('entry_date').reverse().toArray();
}

export async function listUnsyncedEntries(): Promise<LocalEntry[]> {
    return db.entries.filter((entry) => entry.synced_at === null).toArray();
}

export async function markEntriesSynced(entryDates: string[]): Promise<void> {
    const syncedAt = Date.now();
    for (const entryDate of entryDates) {
        const entry = await getEntryByDate(entryDate);
        if (!entry) {
            continue;
        }

        await db.entries.put({
            ...entry,
            synced_at: syncedAt,
            server_entry_date: entry.entry_date,
        });
    }
}

export async function pushUnsyncedEntries(): Promise<void> {
    const unsynced = await listUnsyncedEntries();
    if (unsynced.length === 0) {
        return;
    }

    const response = await axios.post('/api/sync/push', {
        device_id: getDeviceId(),
        entries: unsynced.map((entry) => ({
            entry_date: entry.entry_date,
            person: entry.person,
            grace: entry.grace,
            gratitude: entry.gratitude,
            updated_at: entry.updated_at,
        })),
    });

    const successfulEntryDates: string[] = (response.data?.results ?? [])
        .filter((item: { status: string }) => item.status === 'upserted' || item.status === 'skipped')
        .map((item: { entry_date: string }) => item.entry_date);

    await markEntriesSynced(successfulEntryDates);
}
