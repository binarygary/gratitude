import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import AppShell from '../Components/AppShell';
import { formatHumanDate } from '../lib/date';
import { listAllEntries, pushUnsyncedEntries } from '../lib/db';

type ServerEntry = {
    entry_date: string;
    person_snippet: string;
    grace_snippet: string;
    gratitude_snippet: string;
    updated_at: number;
};

type PageProps = {
    entries: ServerEntry[];
    auth: {
        user: {
            id: number;
        } | null;
    };
};

function normalizeEntryDate(rawValue: string): string {
    const match = rawValue.match(/\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : rawValue;
}

export default function History() {
    const { props } = usePage<PageProps>();
    const [localEntries, setLocalEntries] = useState<ServerEntry[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

    useEffect(() => {
        listAllEntries().then((entries) => {
            setLocalEntries(
                entries.map((entry) => ({
                    entry_date: normalizeEntryDate(entry.entry_date),
                    person_snippet: entry.person,
                    grace_snippet: entry.grace,
                    gratitude_snippet: entry.gratitude,
                    updated_at: entry.updated_at,
                })),
            );
        });

        if (props.auth.user) {
            pushUnsyncedEntries().catch(() => null);
        }
    }, [props.auth.user]);

    const mergedEntries = useMemo(() => {
        const map = new Map<string, ServerEntry>();

        for (const rawEntry of [...props.entries, ...localEntries]) {
            const entryDate = normalizeEntryDate(rawEntry.entry_date);
            const entry = {
                ...rawEntry,
                entry_date: entryDate,
            };
            const existing = map.get(entryDate);
            if (!existing || entry.updated_at >= existing.updated_at) {
                map.set(entryDate, entry);
            }
        }

        return Array.from(map.values()).sort((a, b) => b.entry_date.localeCompare(a.entry_date));
    }, [localEntries, props.entries]);

    const visibleEntries = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        const filtered = query
            ? mergedEntries.filter((entry) =>
                  [entry.entry_date, entry.person_snippet, entry.grace_snippet, entry.gratitude_snippet]
                      .join(' ')
                      .toLowerCase()
                      .includes(query),
              )
            : mergedEntries;

        return [...filtered].sort((a, b) =>
            sortBy === 'newest' ? b.entry_date.localeCompare(a.entry_date) : a.entry_date.localeCompare(b.entry_date),
        );
    }, [mergedEntries, searchQuery, sortBy]);

    return (
        <AppShell>
            <Head title="History" />

            <div className="card rounded-2xl border border-base-300/50 bg-white shadow-sm">
                <div className="card-body gap-5 p-6">
                    <h1 className="text-3xl font-semibold text-base-content">History</h1>
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                        <label className="input input-bordered flex items-center gap-2 rounded-xl">
                            <span className="text-sm text-base-content/55">Search</span>
                            <input
                                type="search"
                                className="grow"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder="Search by date or snippet"
                            />
                        </label>
                        <select
                            className="select select-bordered rounded-xl"
                            value={sortBy}
                            onChange={(event) => setSortBy(event.target.value as 'newest' | 'oldest')}
                        >
                            <option value="newest">Newest first</option>
                            <option value="oldest">Oldest first</option>
                        </select>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="table table-md">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Person</th>
                                    <th>Grace</th>
                                    <th>Gratitude</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleEntries.map((entry) => (
                                    <tr key={entry.entry_date}>
                                        <td className="font-medium text-base-content">{formatHumanDate(entry.entry_date)}</td>
                                        <td className="text-base-content/70">{entry.person_snippet || '-'}</td>
                                        <td className="text-base-content/70">{entry.grace_snippet || '-'}</td>
                                        <td className="text-base-content/70">{entry.gratitude_snippet || '-'}</td>
                                        <td>
                                            <Link href={`/today?date=${entry.entry_date}`} className="btn btn-sm">
                                                Open
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {visibleEntries.length === 0 && <p className="text-sm text-base-content/60">No entries yet.</p>}
                </div>
            </div>
        </AppShell>
    );
}
