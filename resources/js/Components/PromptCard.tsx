import { useId, type ChangeEvent, type ReactNode } from 'react';

type Props = {
    title: ReactNode;
    helperText?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
};

export default function PromptCard({ title, helperText, value, onChange, placeholder }: Props) {
    const titleId = useId();
    const helperTextId = useId();

    return (
        <div className="card rounded-2xl border border-base-300/50 bg-white shadow-sm">
            <div className="card-body gap-4 p-6">
                <h2 id={titleId} className="text-base font-medium text-base-content">
                    {title}
                </h2>
                {helperText && (
                    <p id={helperTextId} className="text-sm text-base-content/70">
                        {helperText}
                    </p>
                )}
                <textarea
                    className="textarea textarea-bordered min-h-[120px] w-full rounded-xl bg-white text-base leading-relaxed text-base-content shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={value}
                    placeholder={placeholder}
                    aria-labelledby={titleId}
                    aria-describedby={helperText ? helperTextId : undefined}
                    onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
                />
            </div>
        </div>
    );
}
