import { describe, expect, it } from 'vitest';
import { mergeHistoryRows } from './History';

describe('History merging', () => {
    it('prefers pending local rows over synced server rows for the same date', () => {
        const merged = mergeHistoryRows(
            [
                {
                    entry_date: '2026-04-18',
                    person_snippet: 'Server person',
                    grace_snippet: 'Server grace',
                    gratitude_snippet: 'Server gratitude',
                    updated_at: 200,
                    sync_status: 'synced',
                    sync_error: null,
                    conflict_local_payload: null,
                    isLocal: false,
                },
            ],
            [
                {
                    entry_date: '2026-04-18',
                    person_snippet: 'Pending local person',
                    grace_snippet: 'Pending local grace',
                    gratitude_snippet: 'Pending local gratitude',
                    updated_at: 100,
                    sync_status: 'pending',
                    sync_error: null,
                    conflict_local_payload: null,
                    isLocal: true,
                },
            ],
        );

        expect(merged).toHaveLength(1);
        expect(merged[0]).toMatchObject({
            person_snippet: 'Pending local person',
            sync_status: 'pending',
            isLocal: true,
        });
    });
});
