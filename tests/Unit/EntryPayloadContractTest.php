<?php

namespace Tests\Unit;

use App\Models\Entry;
use App\Support\Entries\EntryPayload;
use App\Support\Entries\EntryPayloadRules;
use Carbon\Carbon;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class EntryPayloadContractTest extends TestCase
{
    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_entry_payload_rules_define_shared_limits_and_fields(): void
    {
        $rulesClass = $this->entryPayloadRulesClass();

        $this->assertSame('2026-01-01', $rulesClass::MIN_ENTRY_DATE);
        $this->assertSame(5000, $rulesClass::MAX_PROMPT_LENGTH);
        $this->assertSame(50, $rulesClass::MAX_BATCH_ENTRIES);
        $this->assertSame(64, $rulesClass::MAX_DEVICE_ID_LENGTH);
        $this->assertSame(900000, $rulesClass::MAX_FUTURE_SKEW_MILLISECONDS);

        $rules = $rulesClass::rules();

        $this->assertSame(['required', 'date_format:Y-m-d', 'after_or_equal:2026-01-01'], $rules['entry_date']);
        $this->assertContains('nullable', $rules['person']);
        $this->assertContains('string', $rules['person']);
        $this->assertContains('max:5000', $rules['person']);
        $this->assertContains('max:5000', $rules['grace']);
        $this->assertContains('max:5000', $rules['gratitude']);
        $this->assertContains('required', $rules['updated_at']);
        $this->assertContains('integer', $rules['updated_at']);
        $this->assertContains('min:0', $rules['updated_at']);

        $batchRules = $rulesClass::batchRules();

        $this->assertSame(['required', 'string', 'max:64'], $batchRules['device_id']);
        $this->assertSame(['required', 'array', 'list', 'max:50'], $batchRules['entries']);
        $this->assertSame(['required', 'array'], $batchRules['entries.*']);
    }

    public function test_entry_payload_rules_reject_updated_at_more_than_fifteen_minutes_in_the_future(): void
    {
        $rulesClass = $this->entryPayloadRulesClass();
        Carbon::setTestNow(Carbon::parse('2026-04-25 12:00:00 UTC'));

        $validator = Validator::make([
            'entry_date' => '2026-04-25',
            'person' => 'Ada',
            'grace' => 'A quiet morning',
            'gratitude' => 'Coffee',
            'updated_at' => Carbon::now()->addMilliseconds($rulesClass::MAX_FUTURE_SKEW_MILLISECONDS + 1)->valueOf(),
        ], $rulesClass::rules());

        $this->assertTrue($validator->fails());
        $this->assertSame(
            'The updated at field cannot be more than 15 minutes in the future.',
            $validator->errors()->first('updated_at')
        );
    }

    public function test_entry_payload_serializer_returns_canonical_entry_shape(): void
    {
        $payloadClass = $this->entryPayloadClass();
        $updatedAt = Carbon::parse('2026-04-25 12:30:56 UTC');
        $entry = new Entry([
            'entry_date' => '2026-04-25',
            'person' => 'Ada',
            'grace' => 'A quiet morning',
            'gratitude' => 'Coffee',
        ]);
        $entry->updated_at = $updatedAt;

        $this->assertSame([
            'entry_date' => '2026-04-25',
            'person' => 'Ada',
            'grace' => 'A quiet morning',
            'gratitude' => 'Coffee',
            'updated_at' => (int) $updatedAt->valueOf(),
        ], $payloadClass::fromModel($entry));
    }

    /** @return class-string<EntryPayloadRules> */
    private function entryPayloadRulesClass(): string
    {
        $class = EntryPayloadRules::class;

        if (! class_exists($class)) {
            $this->fail('Expected the shared entry payload rules support class to exist.');
        }

        return $class;
    }

    /** @return class-string<EntryPayload> */
    private function entryPayloadClass(): string
    {
        $class = EntryPayload::class;

        if (! class_exists($class)) {
            $this->fail('Expected the canonical entry payload serializer support class to exist.');
        }

        return $class;
    }
}
