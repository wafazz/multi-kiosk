<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Company;
use App\Models\Kiosk;
use App\Models\KioskShift;
use App\Models\Staff;
use App\Services\ShiftService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class ShiftController extends Controller
{
    public function index(Request $request): Response
    {
        $company = Company::first();

        $query = KioskShift::with(['kiosk.branch', 'openedByStaff', 'closedByStaff'])
            ->where('company_id', $company->id ?? 1)
            ->latest('opened_at');

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->input('branch_id'));
        }

        if ($request->filled('kiosk_id')) {
            $query->where('kiosk_id', $request->input('kiosk_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $shifts = $query->paginate(20)->withQueryString();

        $branches = Branch::where('company_id', $company->id ?? 1)->where('is_active', true)->get(['id', 'name', 'code']);
        $kiosks = Kiosk::with('branch')->whereHas('branch', fn($q) => $q->where('company_id', $company->id ?? 1))->get(['id', 'branch_id', 'kiosk_code', 'kiosk_name']);

        // Aggregate statistics
        $totalSales = KioskShift::where('company_id', $company->id ?? 1)->sum('total_sales_gross');
        $totalCash = KioskShift::where('company_id', $company->id ?? 1)->sum('total_cash_sales');
        $totalVariance = KioskShift::where('company_id', $company->id ?? 1)->where('status', 'CLOSED')->sum('cash_variance');
        $openShiftsCount = KioskShift::where('company_id', $company->id ?? 1)->where('status', 'OPEN')->count();

        return Inertia::render('Shifts/Index', [
            'shifts' => $shifts,
            'branches' => $branches,
            'kiosks' => $kiosks,
            'filters' => $request->only(['branch_id', 'kiosk_id', 'status']),
            'stats' => [
                'total_sales' => (float)$totalSales,
                'total_cash' => (float)$totalCash,
                'total_variance' => (float)$totalVariance,
                'open_shifts_count' => $openShiftsCount,
            ],
        ]);
    }

    public function apiOpenShift(Request $request, ShiftService $shiftService)
    {
        $validated = $request->validate([
            'kiosk_id' => 'required|exists:kiosks,id',
            'pin' => 'required|string',
            'opening_float' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $kiosk = Kiosk::with('branch')->findOrFail($validated['kiosk_id']);

        // Verify Staff PIN
        $staffMembers = Staff::where('is_active', true)->get();
        $matchedStaff = null;
        foreach ($staffMembers as $staff) {
            if (Hash::check($validated['pin'], $staff->pin_hash)) {
                $matchedStaff = $staff;
                break;
            }
        }

        if (!$matchedStaff) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid staff PIN. Authorization failed.',
            ], 401);
        }

        $shift = $shiftService->openShift($kiosk, $matchedStaff, (float)$validated['opening_float'], $validated['notes'] ?? null);

        return response()->json([
            'success' => true,
            'message' => "Shift #{$shift->id} opened with starting float RM " . number_format($shift->opening_cash_float, 2),
            'shift' => [
                'id' => $shift->id,
                'opened_at' => $shift->opened_at->format('Y-m-d H:i:s'),
                'opening_float' => (float)$shift->opening_cash_float,
                'staff_name' => $matchedStaff->full_name,
                'staff_code' => $matchedStaff->staff_code,
            ],
        ]);
    }

    public function apiLiveXReport(Request $request, ShiftService $shiftService)
    {
        $validated = $request->validate([
            'kiosk_id' => 'required|exists:kiosks,id',
        ]);

        $kiosk = Kiosk::with('branch')->findOrFail($validated['kiosk_id']);
        $shift = $shiftService->getActiveShift($kiosk);

        if (!$shift) {
            return response()->json([
                'success' => false,
                'message' => 'No active shift is currently open at this kiosk.',
            ], 404);
        }

        $xReport = $shiftService->computeLiveXReport($shift);

        return response()->json([
            'success' => true,
            'report_type' => 'X_REPORT',
            'data' => $xReport,
        ]);
    }

    public function apiCloseShift(Request $request, ShiftService $shiftService)
    {
        $validated = $request->validate([
            'kiosk_id' => 'required|exists:kiosks,id',
            'pin' => 'required|string',
            'closing_cash_counted' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $kiosk = Kiosk::with('branch')->findOrFail($validated['kiosk_id']);
        $shift = $shiftService->getActiveShift($kiosk);

        if (!$shift) {
            return response()->json([
                'success' => false,
                'message' => 'No active shift is currently open at this kiosk.',
            ], 404);
        }

        // Verify Staff PIN
        $staffMembers = Staff::where('is_active', true)->get();
        $matchedStaff = null;
        foreach ($staffMembers as $staff) {
            if (Hash::check($validated['pin'], $staff->pin_hash)) {
                $matchedStaff = $staff;
                break;
            }
        }

        if (!$matchedStaff) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid staff PIN. Authorization failed.',
            ], 401);
        }

        $closedShift = $shiftService->closeShift($shift, $matchedStaff, (float)$validated['closing_cash_counted'], $validated['notes'] ?? null);

        return response()->json([
            'success' => true,
            'message' => "Shift #{$closedShift->id} closed successfully.",
            'z_report' => [
                'shift_id' => $closedShift->id,
                'kiosk_code' => $kiosk->kiosk_code,
                'kiosk_name' => $kiosk->kiosk_name,
                'branch_name' => $kiosk->branch->name,
                'opened_at' => $closedShift->opened_at->format('Y-m-d H:i:s'),
                'closed_at' => $closedShift->closed_at->format('Y-m-d H:i:s'),
                'opened_by' => $closedShift->openedByStaff->full_name ?? 'Staff',
                'closed_by' => $matchedStaff->full_name,
                'opening_float' => (float)$closedShift->opening_cash_float,
                'closing_counted' => (float)$closedShift->closing_cash_counted,
                'expected_cash' => (float)$closedShift->expected_cash_total,
                'cash_variance' => (float)$closedShift->cash_variance,
                'gross_sales' => (float)$closedShift->total_sales_gross,
                'tax_collected' => (float)$closedShift->total_tax_collected,
                'cash_sales' => (float)$closedShift->total_cash_sales,
                'card_sales' => (float)$closedShift->total_card_sales,
                'qr_sales' => (float)$closedShift->total_qr_sales,
                'orders_count' => $closedShift->total_orders_count,
            ],
        ]);
    }
}
