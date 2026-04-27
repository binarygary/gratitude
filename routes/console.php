<?php

use App\Models\Entry;
use App\Models\MagicLoginToken;
use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('metrics:counts', function () {
    $this->line('Users: '.User::query()->count());
    $this->line('Entries: '.Entry::query()->count());
})->purpose('Display total counts for users and entries');

Artisan::command('auth:prune-magic-links', function () {
    $deleted = MagicLoginToken::query()
        ->where(fn ($query) => $query
            ->whereNotNull('used_at')
            ->orWhere('expires_at', '<=', now()))
        ->delete();

    $this->line("Pruned {$deleted} magic login tokens.");
})->purpose('Prune used and expired magic login tokens');
