import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import AppShell from '../Components/AppShell';
import SeoHead from '../Components/SeoHead';
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

function ReadOnlySection({ title, value }: { title: ReactNode; value: string | null }) {
    return (
        <div className="card rounded-2xl border border-base-300/50 bg-white shadow-sm">
            <div className="card-body gap-4 p-6">
                <h2 className="text-base font-medium text-base-content">{title}</h2>
                <div className="min-h-[120px] whitespace-pre-wrap rounded-xl border border-base-300/70 bg-white p-4 text-base leading-relaxed text-base-content">
                    {value?.trim() || '-'}
                </div>
            </div>
        </div>
    );
}

export default function HistoryEntry() {
    const { props } = usePage<PageProps>();
    const [resolvedEntry, setResolvedEntry] = useState<Entry>(props.entry);
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
            <SeoHead
                title={formattedDate}
                description="Read a previously saved daily reflection."
                canonicalPath={`/history/${props.date}`}
                noIndex
            />

            <div className="card rounded-2xl border border-base-300/50 bg-white shadow-sm">
                <div className="card-body gap-4 p-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-base-content">{formattedDate}</h1>
                        <p className="text-sm text-base-content/70">Saved reflection</p>
                    </div>
                    <div>
                        <Link href="/history" className="btn btn-sm">
                            Back to History
                        </Link>
                    </div>
                </div>
            </div>

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
