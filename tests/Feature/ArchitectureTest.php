<?php

declare(strict_types=1);

arch('application and routes use strict types')
    ->expect(['App', 'routes'])
    ->toUseStrictTypes();

arch('application code uses strict equality')
    ->expect('App')
    ->toUseStrictEquality();
