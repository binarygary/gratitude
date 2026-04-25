<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;

class RootRedirectController extends Controller
{
    public function __invoke(): RedirectResponse
    {
        return redirect('/today')->header('Cache-Control', 'max-age=300, public');
    }
}
