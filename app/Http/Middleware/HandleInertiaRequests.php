<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $hasCompanies = \Illuminate\Support\Facades\Schema::hasTable('companies');
        $hasStaff = \Illuminate\Support\Facades\Schema::hasTable('staff');
        $hasKiosks = \Illuminate\Support\Facades\Schema::hasTable('kiosks');

        $company = $hasCompanies ? \App\Models\Company::first() : null;
        $authStaffId = session('auth_staff_id');
        $authStaff = ($authStaffId && $hasStaff) ? \App\Models\Staff::find($authStaffId) : null;
        if (!$authStaff && $hasStaff) {
            $authStaff = \App\Models\Staff::where('role', 'SUPER_ADMIN')->first() ?? \App\Models\Staff::first();
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $authStaff ? [
                    'id' => $authStaff->id,
                    'staff_code' => $authStaff->staff_code,
                    'full_name' => $authStaff->full_name,
                    'role' => $authStaff->role,
                    'email' => $authStaff->email,
                ] : null,
            ],
            'company' => $company ? [
                'id' => $company->id,
                'name' => $company->name,
                'code' => $company->code,
                'logo_path' => $company->logo_path,
                'brand_primary_color' => $company->brand_primary_color ?? '#2563eb',
            ] : null,
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'activeKiosksCount' => fn () => $hasKiosks ? \App\Models\Kiosk::where('status', 'ONLINE')->count() : 0,
        ];
    }
}
