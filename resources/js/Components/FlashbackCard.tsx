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
        <div className="card rounded-2xl border border-base-300/50 bg-white shadow-sm">
            <div className="card-body gap-3 p-5">
                <h3 className="text-base font-medium text-base-content">{title}</h3>
                {flashback ? (
                    <>
                        <p className="text-sm text-base-content/70">{formatHumanDate(flashback.entry_date)}</p>
                        <p className="text-sm text-base-content/80">
                            <span className="font-semibold text-base-content">Who:</span> {flashback.person.trim() || '-'}
                        </p>
                        <p className="text-sm text-base-content/80">
                            <span className="font-semibold text-base-content">Grace:</span> {flashback.grace.trim() || '-'}
                        </p>
                        <p className="text-sm text-base-content/80">
                            <span className="font-semibold text-base-content">Grateful:</span> {flashback.gratitude.trim() || '-'}
                        </p>
                    </>
                ) : (
                    <>
                        <p className="text-sm text-base-content/70">No reflection from this day yet.</p>
                        <p className="text-sm text-base-content/70">Come back soon — these will start to stack.</p>
                    </>
                )}
            </div>
        </div>
    );
}
