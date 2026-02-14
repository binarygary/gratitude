<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class PoliciesController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('Policies');
    }
}
