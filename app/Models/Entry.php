<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $user_id
 * @property CarbonInterface|string $entry_date
 * @property string|null $person
 * @property string|null $grace
 * @property string|null $gratitude
 */
class Entry extends Model
{
    protected $fillable = [
        'user_id',
        'entry_date',
        'person',
        'grace',
        'gratitude',
    ];

    protected function casts(): array
    {
        return [
            'entry_date' => 'date:Y-m-d',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
