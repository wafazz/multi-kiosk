<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Company;
use App\Models\Staff;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class StaffController extends Controller
{
    public function index(): Response
    {
        $company = Company::first();
        $staffMembers = Staff::with(['primaryBranch', 'currentOpenAttendance.kioskIn'])
            ->where('company_id', $company->id ?? 1)
            ->get()
            ->map(function ($s) {
                return [
                    'id' => $s->id,
                    'staff_code' => $s->staff_code,
                    'full_name' => $s->full_name,
                    'email' => $s->email,
                    'phone' => $s->phone,
                    'role' => $s->role,
                    'salary_type' => $s->salary_type,
                    'hourly_rate' => (float)$s->hourly_rate,
                    'daily_rate' => (float)$s->daily_rate,
                    'monthly_rate' => (float)$s->monthly_rate,
                    'primary_branch_id' => $s->primary_branch_id,
                    'primary_branch_name' => $s->primaryBranch->name ?? 'All Branches (HQ)',
                    'is_active' => $s->is_active,
                    'is_clocked_in' => $s->currentOpenAttendance !== null,
                    'current_kiosk' => $s->currentOpenAttendance->kioskIn->kiosk_name ?? null,
                    'clocked_in_at' => $s->currentOpenAttendance ? $s->currentOpenAttendance->clock_in_at->format('H:i, d M') : null,
                ];
            });

        $branches = Branch::where('company_id', $company->id ?? 1)->get(['id', 'name', 'code']);

        return Inertia::render('Staff/Index', [
            'staffMembers' => $staffMembers,
            'branches' => $branches,
        ]);
    }

    public function store(Request $request)
    {
        $company = Company::first();
        $validated = $request->validate([
            'staff_code' => 'required|string|max:50',
            'full_name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'pin' => 'required|string|min:4|max:6',
            'role' => 'required|in:SUPER_ADMIN,HQ_ADMIN,BRANCH_MANAGER,KIOSK_MANAGER,STAFF,FINANCE',
            'salary_type' => 'required|in:HOURLY,DAILY,MONTHLY,NONE',
            'hourly_rate' => 'nullable|numeric|min:0',
            'daily_rate' => 'nullable|numeric|min:0',
            'monthly_rate' => 'nullable|numeric|min:0',
            'primary_branch_id' => 'nullable|exists:branches,id',
        ]);

        $staff = Staff::create([
            'company_id' => $company->id ?? 1,
            'primary_branch_id' => $validated['primary_branch_id'] ?? null,
            'staff_code' => strtoupper($validated['staff_code']),
            'full_name' => $validated['full_name'],
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'pin_hash' => Hash::make($validated['pin']),
            'password' => Hash::make('password123'),
            'role' => $validated['role'],
            'salary_type' => $validated['salary_type'],
            'hourly_rate' => $validated['hourly_rate'] ?? 0.00,
            'daily_rate' => $validated['daily_rate'] ?? 0.00,
            'monthly_rate' => $validated['monthly_rate'] ?? 0.00,
            'is_active' => true,
        ]);

        return redirect()->back()->with('success', "Staff '{$staff->full_name}' ({$staff->staff_code}) registered.");
    }

    public function update(Request $request, Staff $staff)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'role' => 'required|in:SUPER_ADMIN,HQ_ADMIN,BRANCH_MANAGER,KIOSK_MANAGER,STAFF,FINANCE',
            'salary_type' => 'required|in:HOURLY,DAILY,MONTHLY,NONE',
            'hourly_rate' => 'nullable|numeric|min:0',
            'daily_rate' => 'nullable|numeric|min:0',
            'monthly_rate' => 'nullable|numeric|min:0',
            'primary_branch_id' => 'nullable|exists:branches,id',
            'is_active' => 'boolean',
            'pin' => 'nullable|string|min:4|max:6',
        ]);

        $updateData = [
            'full_name' => $validated['full_name'],
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'role' => $validated['role'],
            'salary_type' => $validated['salary_type'],
            'hourly_rate' => $validated['hourly_rate'] ?? 0.00,
            'daily_rate' => $validated['daily_rate'] ?? 0.00,
            'monthly_rate' => $validated['monthly_rate'] ?? 0.00,
            'primary_branch_id' => $validated['primary_branch_id'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ];

        if (!empty($validated['pin'])) {
            $updateData['pin_hash'] = Hash::make($validated['pin']);
        }

        $staff->update($updateData);
        return redirect()->back()->with('success', "Staff '{$staff->full_name}' updated.");
    }
}
