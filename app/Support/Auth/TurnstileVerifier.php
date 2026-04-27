<?php

namespace App\Support\Auth;

interface TurnstileVerifier
{
    public function verify(string $token, ?string $ip = null): TurnstileResult;
}
