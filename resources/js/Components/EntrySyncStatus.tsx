import type { SyncStatus } from '../lib/db';

type Mode = 'inline' | 'alert';

type Props = {
    status: SyncStatus;
    mode?: Mode;
    isSyncing?: boolean;
    isBusy?: boolean;
    errorText?: string | null;
    onRetry?: () => void;
    onEdit?: () => void;
    onReviewLocalCopy?: () => void;
    retryLabel?: string;
    editLabel?: string;
    reviewLocalCopyLabel?: string;
};

type StatusConfig = {
    label: string;
    copy: string;
    dotClassName: string;
    indicatorClassName: string;
    calloutClassName: string;
};

const STATUS_CONFIG: Record<SyncStatus, StatusConfig> = {
    local: {
        label: 'Local',
        copy: 'Saved on this device.',
        dotClassName: 'bg-base-content/40',
        indicatorClassName: 'border-base-300/70 bg-base-100 text-base-content/70',
        calloutClassName: 'border-base-300/70 bg-base-100',
    },
    pending: {
        label: 'Pending',
        copy: 'Waiting to sync when you are signed in and online.',
        dotClassName: 'bg-primary',
        indicatorClassName: 'border-primary/30 bg-primary/5 text-primary',
        calloutClassName: 'border-primary/30 bg-primary/5',
    },
    synced: {
        label: 'Synced',
        copy: 'Synced backup is up to date.',
        dotClassName: 'bg-primary',
        indicatorClassName: 'border-primary/30 bg-primary/5 text-primary',
        calloutClassName: 'border-primary/30 bg-primary/5',
    },
    failed: {
        label: 'Failed',
        copy: 'This entry is saved on this device, but sync did not finish.',
        dotClassName: 'bg-warning',
        indicatorClassName: 'border-warning/40 bg-warning/10 text-base-content',
        calloutClassName: 'border-warning/40 bg-warning/10',
    },
    rejected: {
        label: 'Rejected',
        copy: 'This entry is saved on this device, but it needs changes before it can sync.',
        dotClassName: 'bg-error',
        indicatorClassName: 'border-error/30 bg-error/5 text-base-content',
        calloutClassName: 'border-error/30 bg-error/5',
    },
    conflict: {
        label: 'Conflict',
        copy: 'A newer synced version exists. The synced version is shown, and your local copy is preserved for review.',
        dotClassName: 'bg-warning',
        indicatorClassName: 'border-warning/40 bg-warning/10 text-base-content',
        calloutClassName: 'border-warning/40 bg-warning/10',
    },
};

function classNames(...values: Array<string | false | null | undefined>): string {
    return values.filter(Boolean).join(' ');
}

export default function EntrySyncStatus({
    status,
    mode = 'inline',
    isSyncing = false,
    isBusy = false,
    errorText = null,
    onRetry,
    onEdit,
    onReviewLocalCopy,
    retryLabel = 'Retry sync',
    editLabel = 'Edit entry',
    reviewLocalCopyLabel = 'Review local copy',
}: Props) {
    const config = STATUS_CONFIG[status];
    const copy = isSyncing ? 'Syncing entry.' : config.copy;
    const label = isSyncing ? 'Syncing' : config.label;
    const actionDisabled = isBusy || isSyncing;
    const action = (() => {
        if (status === 'failed' && onRetry) {
            return (
                <button
                    type="button"
                    className="btn btn-primary btn-sm min-w-28 rounded-xl"
                    disabled={actionDisabled}
                    onClick={onRetry}
                >
                    {retryLabel}
                </button>
            );
        }

        if (status === 'rejected' && onEdit) {
            return (
                <button
                    type="button"
                    className="btn btn-primary btn-sm min-w-28 rounded-xl"
                    disabled={actionDisabled}
                    onClick={onEdit}
                >
                    {editLabel}
                </button>
            );
        }

        if (status === 'conflict' && onReviewLocalCopy) {
            return (
                <button
                    type="button"
                    className="btn btn-warning btn-sm min-w-36 rounded-xl"
                    disabled={actionDisabled}
                    onClick={onReviewLocalCopy}
                >
                    {reviewLocalCopyLabel}
                </button>
            );
        }

        return null;
    })();

    if (mode === 'alert') {
        const isAssertiveAlert = status === 'rejected' || status === 'conflict';

        return (
            <div className="flex flex-col gap-2">
                <div
                    className={classNames(config.calloutClassName, 'min-w-0 rounded-xl border p-3 text-sm text-base-content')}
                    role={isAssertiveAlert ? 'alert' : 'status'}
                    aria-live={isAssertiveAlert ? undefined : 'polite'}
                >
                    <div className="flex items-start gap-2">
                        <span
                            className={classNames(config.dotClassName, 'mt-1.5 size-2.5 shrink-0 rounded-full')}
                            aria-hidden="true"
                        />
                        <div className="min-w-0 space-y-1">
                            <p className="font-medium leading-snug">{label}</p>
                            <p className="leading-relaxed text-base-content/75">{copy}</p>
                            {errorText && <p className="leading-relaxed text-base-content/70">{errorText}</p>}
                        </div>
                    </div>
                </div>

                {action && <div className="flex shrink-0 justify-start">{action}</div>}
            </div>
        );
    }

    return (
        <span
            className="inline-flex items-center"
            role="status"
            aria-live="polite"
        >
            <span
                className={classNames(
                    config.indicatorClassName,
                    'inline-flex min-h-6 items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium leading-none',
                )}
                aria-label={copy}
                title={copy}
            >
                <span
                    className={classNames(config.dotClassName, 'size-1.5 shrink-0 rounded-full')}
                    aria-hidden="true"
                />
                <span>{label}</span>
            </span>
        </span>
    );
}
