import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AppShell from '../Components/AppShell';
import { formatHumanDate } from '../lib/date';
import { getEntryByDate } from '../lib/db';

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

function ReadOnlySection({ title, value }: { title: string; value: string | null }) {
    return (
        <div className="card bg-base-100 shadow-sm">
            <div className="card-body gap-3">
                <h2 className="card-title text-lg">{title}</h2>
                <p className="whitespace-pre-wrap opacity-90">{value?.trim() || '-'}</p>
            </div>
        </div>
    );
}

export default function HistoryEntry() {
    const { props } = usePage<PageProps>();
    const [resolvedEntry, setResolvedEntry] = useState<Entry>(props.entry);

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
                    setResolvedEntry(server);
                }

                return;
            }

            if (!server || local.updated_at >= server.updated_at) {
                if (!ignore) {
                    setResolvedEntry({
                        entry_date: local.entry_date,
                        person: local.person,
                        grace: local.grace,
                        gratitude: local.gratitude,
                        updated_at: local.updated_at,
                    });
                }

                return;
            }

            if (!ignore) {
                setResolvedEntry(server);
            }
        };

        load();

        return () => {
            ignore = true;
        };
    }, [props.date, props.entry]);

    return (
        <AppShell>
            <Head title="Entry" />

            <div className="card bg-base-100 shadow-sm">
                <div className="card-body gap-4">
                    <div>
                        <h1 className="card-title text-2xl">Entry</h1>
                        <p className="opacity-70">{formatHumanDate(props.date)}</p>
                    </div>
                    <div>
                        <Link href="/history" className="btn btn-sm">
                            Back to History
                        </Link>
                    </div>
                </div>
            </div>

            <ReadOnlySection title="1) Person" value={resolvedEntry?.person ?? null} />
            <ReadOnlySection title="2) Grace" value={resolvedEntry?.grace ?? null} />
            <ReadOnlySection title="3) Gratitude" value={resolvedEntry?.gratitude ?? null} />
        </AppShell>
    );
}
