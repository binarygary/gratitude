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

export default function History() {
    const { props } = usePage<PageProps>();
    const [localEntries, setLocalEntries] = useState<ServerEntry[]>([]);

    useEffect(() => {
        listAllEntries().then((entries) => {
            setLocalEntries(
                entries.map((entry) => ({
                    entry_date: entry.entry_date,
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

        for (const entry of [...props.entries, ...localEntries]) {
            const existing = map.get(entry.entry_date);
            if (!existing || entry.updated_at >= existing.updated_at) {
                map.set(entry.entry_date, entry);
            }
        }

        return Array.from(map.values()).sort((a, b) => (a.entry_date > b.entry_date ? -1 : 1));
    }, [localEntries, props.entries]);

    return (
        <AppShell>
            <Head title="History" />

            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <h1 className="card-title text-2xl">History</h1>
                    <div className="overflow-x-auto">
                        <table className="table table-zebra">
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
                                {mergedEntries.map((entry) => (
                                    <tr key={entry.entry_date}>
                                        <td>{formatHumanDate(entry.entry_date)}</td>
                                        <td>{entry.person_snippet || '-'}</td>
                                        <td>{entry.grace_snippet || '-'}</td>
                                        <td>{entry.gratitude_snippet || '-'}</td>
                                        <td>
                                            <Link href={`/history/${entry.entry_date}`} className="btn btn-sm">
                                                Open
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {mergedEntries.length === 0 && <p className="opacity-70">No entries yet.</p>}
                </div>
            </div>
        </AppShell>
    );
}
