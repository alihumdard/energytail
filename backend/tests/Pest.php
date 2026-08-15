<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case Bindings
|--------------------------------------------------------------------------
|
| Feature tests boot the full application and hit real routes, so they need
| Laravel's TestCase and a migrated database. Unit tests stay plain PHPUnit
| so they remain fast and framework-free.
|
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');
