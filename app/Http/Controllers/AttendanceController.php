<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Branch;
use App\Models\Company;
use App\Models\Kiosk;
use App\Models\Staff;
use App\Services\AttendanceService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Exception;

class AttendanceController extends Controller
{
    public function index(Request $request): Response
    {
        $company = Company::first();

        $query = Attendance::with(['staff', 'kioskIn.branch', 'kioskOut', 'adjuster'])
            ->where('company_id', $company->id ?? 1);

        if ($request->filled('staff_id')) {
            $query->where('staff_id', $request->input('staff_id'));
        }
        if ($request->filled('kiosk_id')) {
            $query->where(function ($q) use ($request) {
                $q->where('kiosk_id_in', $request->input('kiosk_id'))
                  ->orWhere('kiosk_id_out', $request->input('kiosk_id'));
            });
        }
        if ($request->filled('branch_id')) {
            $query->whereHas('kioskIn', function ($q) use ($request) {
                $q->where('branch_id', $request->input('branch_id'));
            });
        }
        if ($request->filled('date')) {
            $query->whereDate('clock_in_at', $request->input('date'));
        }

        $attendances = $query->latest('clock_in_at')
            ->take(50)
            ->get()
            ->map(function ($a) {
                return [
                    'id' => $a->id,
                    'staff_name' => $a->staff->full_name ?? 'N/A',
                    'staff_code' => $a->staff->staff_code ?? '',
                    'salary_type' => $a->staff->salary_type ?? 'NONE',
                    'kiosk_in_name' => $a->kioskIn->kiosk_name ?? 'N/A',
                    'kiosk_out_name' => $a->kioskOut->kiosk_name ?? ($a->status === 'OPEN' ? 'Active' : 'N/A'),
                    'clock_in_at' => $a->clock_in_at->format('Y-m-d H:i:s'),
                    'clock_out_at' => $a->clock_out_at ? $a->clock_out_at->format('Y-m-d H:i:s') : null,
                    'raw_duration_minutes' => (int)$a->raw_duration_minutes,
                    'payable_duration_minutes' => (int)$a->payable_duration_minutes,
                    'hourly_rate_snapshot' => (float)$a->hourly_rate_snapshot,
                    'gross_earnings' => (float)$a->gross_earnings,
                    'status' => $a->status,
                    'adjusted_by_name' => $a->adjuster->full_name ?? null,
                    'adjustment_reason' => $a->adjustment_reason,
                ];
            });

        $staffMembers = Staff::where('company_id', $company->id ?? 1)->get(['id', 'full_name', 'staff_code']);
        $branches = Branch::where('company_id', $company->id ?? 1)->get(['id', 'name']);
        $kiosks = Kiosk::all(['id', 'kiosk_name', 'kiosk_code']);

        return Inertia::render('Attendance/Index', [
            'attendances' => $attendances,
            'staffMembers' => $staffMembers,
            'branches' => $branches,
            'kiosks' => $kiosks,
            'filters' => $request->only(['staff_id', 'kiosk_id', 'branch_id', 'date']),
        ]);
    }

    public function adjust(Request $request, Attendance $attendance, AttendanceService $attendanceService)
    {
        $validated = $request->validate([
            'clock_in_at' => 'required|date',
            'clock_out_at' => 'required|date|after:clock_in_at',
            'adjusted_by' => 'required|exists:staff,id',
            'adjustment_reason' => 'required|string|min:5',
        ]);

        try {
            $attendanceService->adjustAttendance(
                $attendance,
                Carbon::parse($validated['clock_in_at']),
                Carbon::parse($validated['clock_out_at']),
                (int)$validated['adjusted_by'],
                $validated['adjustment_reason']
            );

            return redirect()->back()->with('success', "Attendance record #{$attendance->id} adjusted successfully.");
        } catch (Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }
}
