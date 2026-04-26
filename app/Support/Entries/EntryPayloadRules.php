<?php

namespace App\Support\Entries;

use Carbon\Carbon;
use Closure;

final class EntryPayloadRules
{
    public const string MIN_ENTRY_DATE = '2026-01-01';

    public const int MAX_PROMPT_LENGTH = 5000;

    public const int MAX_BATCH_ENTRIES = 50;

    public const int MAX_DEVICE_ID_LENGTH = 64;

    public const int MAX_FUTURE_SKEW_MILLISECONDS = 900000;

    /** @return array<string, array<int, Closure|string>> */
    public static function rules(): array
    {
        return [
            'entry_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:'.self::MIN_ENTRY_DATE],
            'person' => ['nullable', 'string', 'max:'.self::MAX_PROMPT_LENGTH],
            'grace' => ['nullable', 'string', 'max:'.self::MAX_PROMPT_LENGTH],
            'gratitude' => ['nullable', 'string', 'max:'.self::MAX_PROMPT_LENGTH],
            'updated_at' => [
                'required',
                'integer',
                'min:0',
                static function (string $attribute, mixed $value, Closure $fail): void {
                    if (! is_numeric($value)) {
                        return;
                    }

                    $maximumAllowedTimestamp = (int) Carbon::now()->valueOf() + self::MAX_FUTURE_SKEW_MILLISECONDS;

                    if ((int) $value > $maximumAllowedTimestamp) {
                        $fail('The updated at field cannot be more than 15 minutes in the future.');
                    }
                },
            ],
        ];
    }

    /** @return array<string, list<string>> */
    public static function batchRules(): array
    {
        return [
            'device_id' => ['required', 'string', 'max:'.self::MAX_DEVICE_ID_LENGTH],
            'entries' => ['required', 'array', 'list', 'max:'.self::MAX_BATCH_ENTRIES],
            'entries.*' => ['required', 'array'],
        ];
    }
}
