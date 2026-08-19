<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Branch;
use App\Models\Company;
use App\Models\InventoryBalance;
use App\Models\Kiosk;
use App\Models\Order;
use App\Models\Product;
use App\Models\RawMaterial;
use App\Services\GrossContributionService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request, GrossContributionService $contributionService): Response
    {
        $company = Company::first();
        if (!$company) {
            $company = Company::create([
                'name' => 'Multi-Kiosk Enterprise',
                'code' => 'MKE01',
                'brand_primary_color' => '#2563eb',
            ]);
        }

        $branchId = $request->input('branch_id');
        $kioskId = $request->input('kiosk_id');

        // Financial & Contribution metrics
        $metrics = $contributionService->calculateGrossContributionMetrics(
            $company->id,
            $branchId ? (int)$branchId : null,
            $kioskId ? (int)$kioskId : null,
            now()->startOfMonth(),
            now()->endOfDay()
        );

        // Kiosks Status
        $kiosks = Kiosk::with('branch')->get()->map(function ($k) {
            return [
                'id' => $k->id,
                'kiosk_code' => $k->kiosk_code,
                'kiosk_name' => $k->kiosk_name,
                'branch_name' => $k->branch->name ?? 'N/A',
                'kiosk_type' => $k->kiosk_type,
                'status' => $k->status,
                'last_heartbeat_at' => $k->last_heartbeat_at ? $k->last_heartbeat_at->diffForHumans() : 'Never',
            ];
        });

        // Low stock alerts
        $rawMaterials = RawMaterial::where('company_id', $company->id)->get();
        $lowStockAlerts = [];
        foreach ($rawMaterials as $mat) {
            $totalStock = (float) InventoryBalance::where('raw_material_id', $mat->id)->sum('quantity_on_hand');
            if ($totalStock <= (float)$mat->min_stock_alert_level) {
                $lowStockAlerts[] = [
                    'id' => $mat->id,
                    'sku' => $mat->sku,
                    'name' => $mat->name,
                    'category' => $mat->category,
                    'base_uom' => $mat->base_uom,
                    'current_stock' => $totalStock,
                    'alert_threshold' => (float)$mat->min_stock_alert_level,
                    'is_critical' => $totalStock <= 0,
                ];
            }
        }

        // Live Open Shifts
        $openShifts = Attendance::with(['staff', 'kioskIn.branch'])
            ->where('company_id', $company->id)
            ->where('status', 'OPEN')
            ->get()
            ->map(function ($att) {
                return [
                    'id' => $att->id,
                    'staff_name' => $att->staff->full_name ?? 'Unknown',
                    'staff_code' => $att->staff->staff_code ?? '',
                    'role' => $att->staff->role ?? '',
                    'kiosk_name' => $att->kioskIn->kiosk_name ?? '',
                    'branch_name' => $att->kioskIn->branch->name ?? '',
                    'clock_in_at' => $att->clock_in_at->format('Y-m-d H:i:s'),
                    'elapsed_minutes' => $att->clock_in_at->diffInMinutes(now()),
                ];
            });

        // Recent Orders
        $recentOrders = Order::with(['kiosk.branch', 'staff'])
            ->where('company_id', $company->id)
            ->latest('ordered_at')
            ->take(8)
            ->get()
            ->map(function ($ord) {
                return [
                    'id' => $ord->id,
                    'order_number' => $ord->order_number,
                    'kiosk_name' => $ord->kiosk->kiosk_name ?? 'Kiosk',
                    'branch_name' => $ord->branch->name ?? '',
                    'staff_name' => $ord->staff->full_name ?? 'Self-Service',
                    'net_amount' => (float)$ord->net_amount,
                    'total_material_cost' => (float)$ord->total_material_cost,
                    'payment_method' => $ord->payment_method,
                    'payment_status' => $ord->payment_status,
                    'ordered_at' => $ord->ordered_at->format('H:i, d M'),
                ];
            });

        $branches = Branch::where('company_id', $company->id)->get(['id', 'name', 'code']);

        return Inertia::render('Dashboard', [
            'company' => $company,
            'metrics' => $metrics,
            'kiosks' => $kiosks,
            'lowStockAlerts' => $lowStockAlerts,
            'openShifts' => $openShifts,
            'recentOrders' => $recentOrders,
            'branches' => $branches,
            'filters' => [
                'branch_id' => $branchId,
                'kiosk_id' => $kioskId,
            ],
        ]);
    }
}
