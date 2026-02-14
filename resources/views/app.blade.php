<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" data-theme="retro">
    <head>
        @php
            $appName = config('app.name', 'consider.today');
            $baseUrl = rtrim((string) (config('app.url') ?: request()->getSchemeAndHttpHost()), '/');

            $meta = match (true) {
                request()->is('help') => [
                    'title' => 'Help',
                    'description' => 'Learn how consider.today stores entries, sync works, and how to use local-first reflection features.',
                    'robots' => 'index,follow',
                ],
                request()->is('policies'), request()->is('privacy') => [
                    'title' => 'Policies',
                    'description' => 'Read privacy, terms, and data handling policies for consider.today.',
                    'robots' => 'index,follow',
                ],
                request()->is('today') => [
                    'title' => 'Today',
                    'description' => 'Write your daily gratitude reflection in three short prompts. Entries are private by default and stored locally first.',
                    'robots' => 'noindex,nofollow',
                ],
                request()->is('history'), request()->is('history/*') => [
                    'title' => 'History',
                    'description' => 'Review your past gratitude entries and revisit your reflections.',
                    'robots' => 'noindex,nofollow',
                ],
                request()->is('settings') => [
                    'title' => 'Settings',
                    'description' => 'Adjust account settings and preferences for consider.today.',
                    'robots' => 'noindex,nofollow',
                ],
                default => [
                    'title' => $appName,
                    'description' => 'consider.today is a local-first daily reflection journal.',
                    'robots' => 'index,follow',
                ],
            };

            $metaTitle = "{$meta['title']} | {$appName}";
            $canonical = request()->url();
            $socialImage = "{$baseUrl}/social-preview.png";
        @endphp

        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="description" content="{{ $meta['description'] }}">
        <meta name="robots" content="{{ $meta['robots'] }}">
        <link rel="canonical" href="{{ $canonical }}">

        <meta property="og:type" content="website">
        <meta property="og:site_name" content="{{ $appName }}">
        <meta property="og:title" content="{{ $metaTitle }}">
        <meta property="og:description" content="{{ $meta['description'] }}">
        <meta property="og:url" content="{{ $canonical }}">
        <meta property="og:image" content="{{ $socialImage }}">
        <meta property="og:image:secure_url" content="{{ $socialImage }}">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta property="og:image:alt" content="consider.today social preview">

        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="{{ $metaTitle }}">
        <meta name="twitter:description" content="{{ $meta['description'] }}">
        <meta name="twitter:image" content="{{ $socialImage }}">
        <meta name="twitter:url" content="{{ $canonical }}">

        <title inertia>{{ $metaTitle }}</title>
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        @inertiaHead
    </head>
    <body class="min-h-screen bg-base-100 text-base-content">
        @inertia
    </body>
</html>
