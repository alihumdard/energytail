<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

abstract class Controller
{
    // Laravel 11+ leaves the base controller empty. Policies are the
    // authorization strategy here, so $this->authorize() has to be available
    // to every controller rather than imported case by case.
    use AuthorizesRequests;
}
