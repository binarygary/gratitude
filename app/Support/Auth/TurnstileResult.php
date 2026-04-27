<?php

namespace App\Support\Auth;

final readonly class TurnstileResult
{
    /**
     * @param  array<int, string>  $errorCodes
     */
    public function __construct(
        public bool $successful,
        public array $errorCodes = [],
        public ?string $hostname = null,
        public ?string $action = null,
    ) {}
}
