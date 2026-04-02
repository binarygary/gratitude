<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string|null $timezone
 * @property bool $show_flashbacks
 * @property bool $notifications_enabled
 * @property string|null $notification_channel
 * @property string|null $daily_reminder_time
 * @property Carbon|null $daily_reminder_last_sent_on
 */
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'timezone',
        'show_flashbacks',
        'notifications_enabled',
        'notification_channel',
        'daily_reminder_time',
        'daily_reminder_last_sent_on',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'show_flashbacks' => 'boolean',
            'notifications_enabled' => 'boolean',
            'daily_reminder_last_sent_on' => 'date:Y-m-d',
        ];
    }

    /** @return HasMany<Entry, $this> */
    public function entries(): HasMany
    {
        return $this->hasMany(Entry::class);
    }
}
