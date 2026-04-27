<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('magic_login_tokens', function (Blueprint $table) {
            $table->boolean('remember_device')->default(false)->after('expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('magic_login_tokens', function (Blueprint $table) {
            $table->dropColumn('remember_device');
        });
    }
};
