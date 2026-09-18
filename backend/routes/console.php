<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
 * Job alert digests.
 *
 * Hourly rather than once a day: each alert is due relative to its own last
 * send, so running every hour spreads the mail out instead of putting the
 * whole platform's digests into one spike. withoutOverlapping stops a slow
 * run from being started again on top of itself.
 */
Schedule::command('jobs:send-alerts')
    ->hourly()
    ->withoutOverlapping()
    ->runInBackground();

/*
 * Expire listings whose closing date has passed.
 *
 * Hourly rather than daily so a deadline is honoured within the hour: a
 * vacancy that closed at nine should not still be taking applications at
 * five. The query is indexed and touches only what has actually expired.
 */
Schedule::command('jobs:expire')
    ->hourly()
    ->withoutOverlapping();
