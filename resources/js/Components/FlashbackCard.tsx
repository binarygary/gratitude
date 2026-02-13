import { formatHumanDate } from '../lib/date';

type Flashback = {
    entry_date: string;
    snippet: string;
} | null;

type Props = {
    title: string;
    flashback: Flashback;
};

export default function FlashbackCard({ title, flashback }: Props) {
    return (
        <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
                <h3 className="card-title text-lg">{title}</h3>
                {flashback ? (
                    <>
                        <p className="text-sm opacity-70">{formatHumanDate(flashback.entry_date)}</p>
                        <p>{flashback.snippet}</p>
                    </>
                ) : (
                    <p className="opacity-70">No entry yet.</p>
                )}
            </div>
        </div>
    );
}
