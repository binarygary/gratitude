<?php

use App\Models\Entry;
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
