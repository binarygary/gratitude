<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('notifications_enabled')->default(false)->after('show_flashbacks');
            $table->string('notification_channel')->nullable()->after('notifications_enabled');
            $table->time('daily_reminder_time')->nullable()->after('notification_channel');
            $table->date('daily_reminder_last_sent_on')->nullable()->after('daily_reminder_time');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'notifications_enabled',
                'notification_channel',
                'daily_reminder_time',
                'daily_reminder_last_sent_on',
            ]);
        });
    }
};
