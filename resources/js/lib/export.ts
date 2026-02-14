import { listAllEntries, type LocalEntry } from './db';

type ExportFormat = 'json' | 'csv' | 'pdf';

function getTimestampForFileName(): string {
    return new Date().toISOString().replace(/[:.]/g, '-');
}

function triggerDownload(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function buildJson(entries: LocalEntry[]): string {
    const payload = {
        exported_at: new Date().toISOString(),
        entry_count: entries.length,
        entries: entries.map((entry) => ({
            entry_date: entry.entry_date,
            person: entry.person,
            grace: entry.grace,
            gratitude: entry.gratitude,
            updated_at: entry.updated_at,
        })),
    };

    return JSON.stringify(payload, null, 2);
}

function escapeCsv(value: string): string {
    if (/[",\n\r]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`;
    }

    return value;
}

function buildCsv(entries: LocalEntry[]): string {
    const header = ['entry_date', 'person', 'grace', 'gratitude', 'updated_at_iso'];
    const rows = entries.map((entry) => [
        entry.entry_date,
        entry.person,
        entry.grace,
        entry.gratitude,
        new Date(entry.updated_at).toISOString(),
    ]);

    return [header, ...rows].map((columns) => columns.map((column) => escapeCsv(column ?? '')).join(',')).join('\n');
}

function escapePdfText(value: string): string {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)')
        .replace(/[^\x20-\x7E]/g, '?');
}

function wrapText(text: string, maxCharsPerLine = 95): string[] {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
        return [''];
    }

    const lines: string[] = [];
    let current = '';

    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (candidate.length <= maxCharsPerLine) {
            current = candidate;
        } else {
            if (current) {
                lines.push(current);
            }
            if (word.length <= maxCharsPerLine) {
                current = word;
                continue;
            }

            const chunks = word.match(new RegExp(`.{1,${maxCharsPerLine - 1}}`, 'g')) ?? [];
            const lastChunkIndex = chunks.length - 1;

            for (let index = 0; index < lastChunkIndex; index++) {
                lines.push(`${chunks[index]}-`);
            }

            current = chunks[lastChunkIndex] ?? '';
        }
    }

    if (current) {
        lines.push(current);
    }

    return lines;
}

function buildPdfLines(entries: LocalEntry[]): string[] {
    const lines: string[] = [];
    lines.push('consider.today Export');
    lines.push(`Exported: ${new Date().toLocaleString()}`);
    lines.push(`Entries: ${entries.length}`);
    lines.push('');

    for (const entry of entries) {
        lines.push(`Date: ${entry.entry_date}`);

        for (const [label, content] of [
            ['Person', entry.person],
            ['Grace', entry.grace],
            ['Gratitude', entry.gratitude],
        ] as const) {
            const wrapped = wrapText(content || '-');
            lines.push(`${label}: ${wrapped[0]}`);
            for (const continuation of wrapped.slice(1)) {
                lines.push(`  ${continuation}`);
            }
        }

        lines.push('');
    }

    return lines;
}

function buildPdf(entries: LocalEntry[]): Uint8Array {
    const lines = buildPdfLines(entries);
    const linesPerPage = 48;
    const pageChunks: string[][] = [];

    for (let i = 0; i < lines.length; i += linesPerPage) {
        pageChunks.push(lines.slice(i, i + linesPerPage));
    }

    if (pageChunks.length === 0) {
        pageChunks.push(['consider.today Export', 'No entries found.']);
    }

    const fontObjectId = 3;
    const firstPageObjectId = 4;
    const objectCount = 3 + pageChunks.length * 2;
    const objects = new Map<number, string>();

    objects.set(1, '<< /Type /Catalog /Pages 2 0 R >>');

    const pageRefs: string[] = [];
    for (let pageIndex = 0; pageIndex < pageChunks.length; pageIndex++) {
        const pageObjectId = firstPageObjectId + pageIndex * 2;
        const contentObjectId = pageObjectId + 1;
        pageRefs.push(`${pageObjectId} 0 R`);

        const commands = [
            'BT',
            '/F1 11 Tf',
            '50 760 Td',
            '14 TL',
            ...pageChunks[pageIndex].map((line) => `(${escapePdfText(line)}) Tj\nT*`),
            'ET',
            '',
        ].join('\n');

        objects.set(
            contentObjectId,
            `<< /Length ${new TextEncoder().encode(commands).length} >>\nstream\n${commands}endstream`,
        );
        objects.set(
            pageObjectId,
            `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`,
        );
    }

    objects.set(2, `<< /Type /Pages /Kids [${pageRefs.join(' ')}] /Count ${pageChunks.length} >>`);
    objects.set(fontObjectId, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

    const parts: string[] = ['%PDF-1.4\n'];
    const offsets: number[] = [0];
    let length = parts[0].length;

    for (let objectId = 1; objectId <= objectCount; objectId++) {
        const content = objects.get(objectId) ?? '<< >>';
        const section = `${objectId} 0 obj\n${content}\nendobj\n`;
        offsets.push(length);
        parts.push(section);
        length += section.length;
    }

    const xrefStart = length;
    const xrefRows = ['0000000000 65535 f '];
    for (let objectId = 1; objectId <= objectCount; objectId++) {
        xrefRows.push(`${offsets[objectId].toString().padStart(10, '0')} 00000 n `);
    }

    const xref = `xref\n0 ${objectCount + 1}\n${xrefRows.join('\n')}\n`;
    const trailer = `trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
    const pdf = [...parts, xref, trailer].join('');

    return new TextEncoder().encode(pdf);
}

export async function exportEntries(format: ExportFormat): Promise<number> {
    const entries = await listAllEntries();
    const stamp = getTimestampForFileName();

    if (format === 'json') {
        const json = buildJson(entries);
        triggerDownload(new Blob([json], { type: 'application/json;charset=utf-8' }), `consider-today-export-${stamp}.json`);
        return entries.length;
    }

    if (format === 'csv') {
        const csv = buildCsv(entries);
        triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `consider-today-export-${stamp}.csv`);
        return entries.length;
    }

    const pdfBytes = buildPdf(entries);
    triggerDownload(new Blob([pdfBytes], { type: 'application/pdf' }), `consider-today-export-${stamp}.pdf`);
    return entries.length;
}
