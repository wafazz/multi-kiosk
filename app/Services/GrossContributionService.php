<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Order;
use App\Models\Wastage;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class GrossContributionService
{
    /**
     * Calculate comprehensive Gross Contribution BI metrics.
     * Formula: Gross Revenue - Raw Material (BOM) Cost - Direct Labour Cost = Gross Contribution
     */
    public function calculateGrossContributionMetrics(
        int $companyId,
        ?int $branchId = null,
        ?int $kioskId = null,
        ?Carbon $startDate = null,
        ?Carbon $endDate = null
    ): array {
        $start = $startDate ?? now()->startOfMonth();
        $end = $endDate ?? now()->endOfDay();

        // 1. Orders / Revenue Query
        $orderQuery = Order::where('company_id', $companyId)
            ->where('payment_status', 'PAID')
            ->where('order_status', 'COMPLETED')
            ->whereBetween('ordered_at', [$start, $end]);

        if ($branchId) {
            $orderQuery->where('branch_id', $branchId);
        }
        if ($kioskId) {
            $orderQuery->where('kiosk_id', $kioskId);
        }

        $grossRevenue = (float) $orderQuery->sum('net_amount');
        $bomMaterialCost = (float) $orderQuery->sum('total_material_cost');
        $totalOrdersCount = (int) $orderQuery->count();

        // 2. Direct Labour Cost Query (from Attendances)
        $attendanceQuery = Attendance::where('company_id', $companyId)
            ->whereIn('status', ['COMPLETED', 'ADJUSTED'])
            ->whereBetween('clock_in_at', [$start, $end]);

        if ($kioskId) {
            $attendanceQuery->where('kiosk_id_in', $kioskId);
        } elseif ($branchId) {
            $attendanceQuery->whereHas('kioskIn', function ($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }

        $directLabourCost = (float) $attendanceQuery->sum('gross_earnings');
        $totalWorkedHours = round(((float) $attendanceQuery->sum('payable_duration_minutes')) / 60.0, 1);

        // 3. Wastage Cost Impact
        $wastageQuery = Wastage::where('company_id', $companyId)
            ->whereBetween('created_at', [$start, $end]);
        if ($branchId) {
            $wastageQuery->whereHas('location', function ($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }
        $wastageCost = (float) $wastageQuery->sum('cost_impact');

        // 4. Gross Contribution Calculations
        $grossContribution = $grossRevenue - $bomMaterialCost - $directLabourCost;
        $marginPercentage = $grossRevenue > 0 ? round(($grossContribution / $grossRevenue) * 100, 1) : 0.0;
        $materialCostPercentage = $grossRevenue > 0 ? round(($bomMaterialCost / $grossRevenue) * 100, 1) : 0.0;
        $labourCostPercentage = $grossRevenue > 0 ? round(($directLabourCost / $grossRevenue) * 100, 1) : 0.0;

        return [
            'gross_revenue' => round($grossRevenue, 2),
            'bom_material_cost' => round($bomMaterialCost, 2),
            'direct_labour_cost' => round($directLabourCost, 2),
            'wastage_cost' => round($wastageCost, 2),
            'gross_contribution' => round($grossContribution, 2),
            'margin_percentage' => $marginPercentage,
            'material_cost_percentage' => $materialCostPercentage,
            'labour_cost_percentage' => $labourCostPercentage,
            'total_orders_count' => $totalOrdersCount,
            'total_worked_hours' => $totalWorkedHours,
            'period_start' => $start->toDateString(),
            'period_end' => $end->toDateString(),
        ];
    }
}
