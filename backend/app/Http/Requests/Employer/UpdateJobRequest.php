<?php

declare(strict_types=1);

namespace App\Http\Requests\Employer;

/**
 * Editing a job validates exactly as posting one does.
 *
 * The fields are the same and so are the constraints: a listing edited into
 * an invalid state is no better than one created that way. Status is the one
 * exception — it is inherited from the existing job rather than resent, so an
 * edit cannot quietly move a listing between states.
 */
class UpdateJobRequest extends StoreJobRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $rules = parent::rules();

        unset($rules['status']);

        return $rules;
    }
}
