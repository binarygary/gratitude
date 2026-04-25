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
    copy: string;
    badgeClassName: string;
    alertClassName: string;
};

const STATUS_CONFIG: Record<SyncStatus, StatusConfig> = {
    local: {
        copy: 'Saved on this device.',
        badgeClassName: 'badge badge-ghost text-base-content/70',
        alertClassName: 'alert border-base-300/50 bg-base-100 text-base-content',
    },
    pending: {
        copy: 'Waiting to sync when you are signed in and online.',
        badgeClassName: 'badge badge-primary badge-outline',
        alertClassName: 'alert alert-info',
    },
    synced: {
        copy: 'Synced backup is up to date.',
        badgeClassName: 'badge badge-success badge-outline',
        alertClassName: 'alert alert-success',
    },
    failed: {
        copy: 'This entry is saved on this device, but sync did not finish.',
        badgeClassName: 'badge badge-warning badge-outline',
        alertClassName: 'alert alert-warning',
    },
    rejected: {
        copy: 'This entry is saved on this device, but it needs changes before it can sync.',
        badgeClassName: 'badge badge-error badge-outline',
        alertClassName: 'alert alert-error',
    },
    conflict: {
        copy: 'A newer synced version exists. The synced version is shown, and your local copy is preserved for review.',
        badgeClassName: 'badge badge-warning badge-outline',
        alertClassName: 'alert alert-warning',
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
                    className="btn btn-error btn-sm min-w-28 rounded-xl"
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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <div
                    className={classNames(config.alertClassName, 'min-w-0 flex-1 items-start rounded-xl py-3 text-sm')}
                    role={isAssertiveAlert ? 'alert' : 'status'}
                    aria-live={isAssertiveAlert ? undefined : 'polite'}
                >
                    <div className="space-y-1">
                        <span className={classNames(config.badgeClassName, 'h-auto min-h-6 whitespace-normal rounded-lg text-left leading-snug')}>
                            {copy}
                        </span>
                        {errorText && <p className="text-sm text-base-content/70">{errorText}</p>}
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
            <span className={classNames(config.badgeClassName, 'h-auto min-h-6 whitespace-normal rounded-lg text-left leading-snug')}>
                {copy}
            </span>
        </span>
    );
}
