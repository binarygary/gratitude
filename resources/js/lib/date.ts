export function todayIso(): string {
    const now = new Date();
    return toIsoDate(now);
}

export function toIsoDate(date: Date): string {
    const y = date.getFullYear();
    const m = `${date.getMonth() + 1}`.padStart(2, '0');
    const d = `${date.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function normalizeEntryDate(rawValue: string): string {
    const match = rawValue.trim().match(/^\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : rawValue;
}

export function formatHumanDate(isoDate: string): string {
    const normalized = normalizeEntryDate(isoDate);
    const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!match) {
        return isoDate;
    }

    const year = Number.parseInt(match[1], 10);
    const month = Number.parseInt(match[2], 10);
    const day = Number.parseInt(match[3], 10);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
        Number.isNaN(date.getTime())
        || date.getUTCFullYear() !== year
        || date.getUTCMonth() !== month - 1
        || date.getUTCDate() !== day
    ) {
        return isoDate;
    }

    return date.toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
    });
}
