import { formatHumanDate } from '../lib/date';

type Flashback = {
    entry_date: string;
    person: string;
    grace: string;
    gratitude: string;
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
                        <p>
                            <span className="font-semibold">Person:</span> {flashback.person.trim() || '-'}
                        </p>
                        <p>
                            <span className="font-semibold">Grace:</span> {flashback.grace.trim() || '-'}
                        </p>
                        <p>
                            <span className="font-semibold">Gratitude:</span> {flashback.gratitude.trim() || '-'}
                        </p>
                    </>
                ) : (
                    <p className="opacity-70">No entry yet.</p>
                )}
            </div>
        </div>
    );
}
