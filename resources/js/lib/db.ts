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

export async function countLocalEntries(): Promise<number> {
    return db.entries.count();
}

export async function listUnsyncedEntries(): Promise<LocalEntry[]> {
    return db.entries.filter((entry) => entry.synced_at === null).toArray();
}

type SeedLocalEntriesOptions = {
    days: number;
    endDate?: string;
    clearExisting?: boolean;
};

type SeedLocalEntriesResult = {
    seeded: number;
    startDate: string;
    endDate: string;
};

function parseYmdToUtcDate(value: string): Date | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return null;
    }

    const [yearString, monthString, dayString] = value.split('-');
    const year = Number.parseInt(yearString, 10);
    const month = Number.parseInt(monthString, 10);
    const day = Number.parseInt(dayString, 10);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
        date.getUTCFullYear() !== year
        || date.getUTCMonth() !== month - 1
        || date.getUTCDate() !== day
    ) {
        return null;
    }

    return date;
}

function toYmdUtc(date: Date): string {
    const year = `${date.getUTCFullYear()}`;
    const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
    const day = `${date.getUTCDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export async function seedLocalEntries({
    days,
    endDate,
    clearExisting = false,
}: SeedLocalEntriesOptions): Promise<SeedLocalEntriesResult> {
    const clampedDays = Math.max(1, Math.min(days, 2000));
    const dayMs = 24 * 60 * 60 * 1000;
    const parsedEndDate = endDate ? parseYmdToUtcDate(endDate) : null;
    const resolvedEndDate = parsedEndDate ?? parseYmdToUtcDate(toYmdUtc(new Date()));

    if (!resolvedEndDate) {
        throw new Error('Could not resolve end date for local seeding');
    }

    const startMs = resolvedEndDate.getTime() - (clampedDays - 1) * dayMs;
    const existingEntries = await db.entries.toArray();
    const existingByDate = new Map(existingEntries.map((entry) => [entry.entry_date, entry]));
    const seededAt = Date.now();
    const people = [
        'My partner',
        'A close friend',
        'A coworker',
        'My sibling',
        'A neighbor',
        'A mentor',
    ];
    const graces = [
        'I noticed a quiet moment and slowed down.',
        'I got unexpected help right when I needed it.',
        'I had enough energy to finish something important.',
        'I took a walk and cleared my head.',
        'I felt supported by someone I trust.',
        'I made progress on a long-running task.',
    ];
    const gratitudes = [
        'The chance to start fresh today.',
        'A calm morning and a hot cup of coffee.',
        'A meaningful conversation.',
        'Steady health and a safe place to rest.',
        'Learning something new.',
        'Having work that challenges me.',
    ];
    const seededEntries: LocalEntry[] = [];

    for (let offset = 0; offset < clampedDays; offset++) {
        const currentDate = new Date(startMs + offset * dayMs);
        const entryDate = toYmdUtc(currentDate);
        const existing = existingByDate.get(entryDate);

        seededEntries.push({
            local_id: existing?.local_id ?? crypto.randomUUID(),
            entry_date: entryDate,
            person: people[offset % people.length],
            grace: graces[offset % graces.length],
            gratitude: gratitudes[offset % gratitudes.length],
            updated_at: seededAt,
            synced_at: null,
            server_entry_date: existing?.server_entry_date ?? null,
        });
    }

    await db.transaction('rw', db.entries, async () => {
        if (clearExisting) {
            await db.entries.clear();
        }

        await db.entries.bulkPut(seededEntries);
    });

    return {
        seeded: clampedDays,
        startDate: toYmdUtc(new Date(startMs)),
        endDate: toYmdUtc(resolvedEndDate),
    };
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
