import type { ChangeEvent, ReactNode } from 'react';

type Props = {
    title: ReactNode;
    helperText?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
};

export default function PromptCard({ title, helperText, value, onChange, placeholder }: Props) {
    return (
        <div className="card rounded-2xl border border-base-300/50 bg-white shadow-sm">
            <div className="card-body gap-4 p-6">
                <h2 className="text-base font-medium text-base-content">{title}</h2>
                {helperText && <p className="text-sm text-base-content/60">{helperText}</p>}
                <textarea
                    className="textarea textarea-bordered min-h-[120px] w-full rounded-xl bg-white text-base leading-relaxed text-base-content shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={value}
                    placeholder={placeholder}
                    onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
                />
            </div>
        </div>
    );
}
