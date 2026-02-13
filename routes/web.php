<?php

use App\Http\Controllers\Api\SyncController;
use App\Http\Controllers\Auth\MagicLinkController;
use App\Http\Controllers\EntryController;
use App\Http\Controllers\HistoryController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\TodayController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/today');

Route::get('/today', [TodayController::class, 'show'])->name('today.show');
Route::get('/history', [HistoryController::class, 'index'])->name('history.index');

Route::middleware('throttle:5,15')->group(function () {
    Route::post('/auth/magic-link/request', [MagicLinkController::class, 'request'])->name('auth.magic.request');
});

Route::get('/auth/magic-link/{token}', [MagicLinkController::class, 'consume'])
    ->middleware('signed:relative')
    ->name('auth.magic.consume');
Route::post('/logout', [MagicLinkController::class, 'logout'])
    ->middleware('auth')
    ->name('logout');

Route::post('/entries/upsert', [EntryController::class, 'upsert'])
    ->middleware('auth')
    ->name('entries.upsert');

Route::post('/api/sync/push', [SyncController::class, 'push'])
    ->middleware('auth')
    ->name('api.sync.push');

Route::middleware('auth')->group(function () {
    Route::get('/settings', [SettingsController::class, 'show'])->name('settings.show');
    Route::post('/settings', [SettingsController::class, 'update'])->name('settings.update');
});
