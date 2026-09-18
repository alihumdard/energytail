<?php

/*
|--------------------------------------------------------------------------
| Modules, Actions and Roles
|--------------------------------------------------------------------------
|
| Single source of truth for the permission matrix. The admin
| Roles & Permissions screen renders modules as rows and actions as columns,
| and the seeder builds permissions from exactly this array — so the UI and
| the backend cannot drift apart.
|
| Permission names follow "module.action" (e.g. jobs.approve).
|
| A module lists only the actions that make sense for it. Audit logs, for
| instance, can be viewed and exported but never edited — those cells render
| as unavailable in the matrix rather than as unchecked boxes.
|
*/

return [

    'actions' => [
        'view' => 'Can view the module',
        'add' => 'Can create new records',
        'edit' => 'Can edit existing records',
        'delete' => 'Can delete records',
        'approve' => 'Can approve or reject records',
        'export' => 'Can export data',
        'settings' => 'Can manage module settings',
    ],

    'modules' => [
        'dashboard' => [
            'label' => 'Dashboard',
            'description' => 'View dashboard and analytics',
            'actions' => ['view', 'export'],
        ],
        'users' => [
            'label' => 'Users',
            'description' => 'Manage platform users',
            'actions' => ['view', 'add', 'edit', 'delete', 'export'],
        ],
        'companies' => [
            'label' => 'Companies',
            'description' => 'Manage companies',
            'actions' => ['view', 'add', 'edit', 'delete', 'approve', 'export'],
        ],
        'jobs' => [
            'label' => 'Jobs',
            'description' => 'Manage job listings',
            'actions' => ['view', 'add', 'edit', 'delete', 'approve', 'export'],
        ],
        'articles' => [
            'label' => 'Articles',
            'description' => 'Manage articles and content',
            'actions' => ['view', 'add', 'edit', 'delete', 'approve', 'export'],
        ],
        'comments' => [
            'label' => 'Comments',
            'description' => 'Moderate reader comments',
            'actions' => ['view', 'edit', 'delete', 'approve'],
        ],
        'taxonomy' => [
            'label' => 'Categories',
            'description' => 'Manage categories and taxonomy',
            'actions' => ['view', 'add', 'edit', 'delete', 'export'],
        ],
        'settings' => [
            'label' => 'Settings',
            'description' => 'Manage system settings',
            'actions' => ['view', 'edit', 'settings'],
        ],
        'roles' => [
            'label' => 'Roles & Permissions',
            'description' => 'Manage roles and permissions',
            'actions' => ['view', 'add', 'edit', 'export', 'settings'],
        ],
        'audit_logs' => [
            'label' => 'Audit Logs',
            'description' => 'View audit logs',
            'actions' => ['view', 'export'],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | System Roles
    |--------------------------------------------------------------------------
    |
    | Seeded on install and flagged is_system so an administrator cannot
    | delete them. The client can still create additional roles from the
    | admin panel — the design's "Add New Role" button is real.
    |
    | 'permissions' => '*' grants everything, including any module added later.
    |
    */

    'roles' => [

        'administrator' => [
            'label' => 'Administrator',
            'description' => 'Full access to all features',
            'permissions' => '*',
        ],

        'employer' => [
            'label' => 'Employer',
            'description' => 'Manage company and jobs',
            // Employers act on their own company only — ownership is enforced
            // by policy, not by permission name.
            'permissions' => [
                'dashboard.view',
                // companies.add is for setting up their own profile the first
                // time — without it an employer with no company could never
                // create one, and posting a job requires having one.
                'companies.view', 'companies.add', 'companies.edit',
                'jobs.view', 'jobs.add', 'jobs.edit', 'jobs.delete',
            ],
        ],

        'job_seeker' => [
            'label' => 'Job Seeker',
            'description' => 'Search and apply for jobs',
            'permissions' => [
                'dashboard.view',
                'jobs.view',
                'companies.view',
                'articles.view',
            ],
        ],

        'author' => [
            'label' => 'Article Author',
            'description' => 'Create and manage articles',
            'permissions' => [
                'dashboard.view',
                'articles.view', 'articles.add', 'articles.edit',
                'comments.view',
            ],
        ],

        'guest' => [
            'label' => 'Guest',
            'description' => 'Limited public access',
            'permissions' => [],
        ],

    ],

];
