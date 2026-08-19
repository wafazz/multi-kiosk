<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Branch;
use App\Models\Company;
use App\Models\Staff;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PayrollReportController extends Controller
{
    public function index(Request $request): Response
    {
        $company = Company::first();

        $startDate = $request->input('start_date') ? Carbon::parse($request->input('start_date'))->startOfDay() : now()->startOfMonth();
        $endDate = $request->input('end_date') ? Carbon::parse($request->input('end_date'))->endOfDay() : now()->endOfDay();
        $branchId = $request->input('branch_id');

        $staffQuery = Staff::with(['primaryBranch'])
            ->where('company_id', $company->id ?? 1)
            ->where('is_active', true);

        if ($branchId) {
            $staffQuery->where('primary_branch_id', $branchId);
        }

        $allStaff = $staffQuery->get();

        $payrollSummaries = [];
        $grandTotalPayableMinutes = 0;
        $grandTotalGrossEarnings = 0.0;

        foreach ($allStaff as $staff) {
            $attendances = Attendance::where('staff_id', $staff->id)
                ->whereIn('status', ['COMPLETED', 'ADJUSTED'])
                ->whereBetween('clock_in_at', [$startDate, $endDate])
                ->get();

            $totalRawMins = (int)$attendances->sum('raw_duration_minutes');
            $totalPayableMins = (int)$attendances->sum('payable_duration_minutes');
            $totalGross = (float)$attendances->sum('gross_earnings');
            $totalShifts = $attendances->count();

            $grandTotalPayableMinutes += $totalPayableMins;
            $grandTotalGrossEarnings += $totalGross;

            $payrollSummaries[] = [
                'staff_id' => $staff->id,
                'staff_code' => $staff->staff_code,
                'full_name' => $staff->full_name,
                'role' => $staff->role,
                'salary_type' => $staff->salary_type,
                'hourly_rate' => (float)$staff->hourly_rate,
                'primary_branch_name' => $staff->primaryBranch->name ?? 'All Branches (HQ)',
                'total_shifts' => $totalShifts,
                'total_raw_hours' => round($totalRawMins / 60.0, 2),
                'total_payable_hours' => round($totalPayableMins / 60.0, 2),
                'gross_earnings' => round($totalGross, 2),
            ];
        }

        $branches = Branch::where('company_id', $company->id ?? 1)->get(['id', 'name']);

        return Inertia::render('Payroll/Index', [
            'payrollSummaries' => $payrollSummaries,
            'grandTotals' => [
                'total_payable_hours' => round($grandTotalPayableMinutes / 60.0, 2),
                'total_gross_earnings' => round($grandTotalGrossEarnings, 2),
                'staff_count' => count($payrollSummaries),
            ],
            'branches' => $branches,
            'filters' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'branch_id' => $branchId,
            ],
        ]);
    }
}
