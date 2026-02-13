import type { ChangeEvent } from 'react';

type Props = {
    title: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
};

export default function PromptCard({ title, value, onChange, placeholder }: Props) {
    return (
        <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
                <h2 className="card-title">{title}</h2>
                <textarea
                    className="textarea textarea-bordered min-h-28 w-full"
                    value={value}
                    placeholder={placeholder}
                    onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
                />
            </div>
        </div>
    );
}
