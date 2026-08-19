<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Kiosk;
use App\Models\KioskShift;
use App\Models\Order;
use App\Models\Staff;
use Illuminate\Support\Facades\DB;

class ShiftService
{
    /**
     * Open a new kiosk shift with an initial cash till float.
     */
    public function openShift(Kiosk $kiosk, Staff $staff, float $openingFloat = 0.0, ?string $notes = null): KioskShift
    {
        $existingOpen = KioskShift::where('kiosk_id', $kiosk->id)
            ->where('status', 'OPEN')
            ->first();

        if ($existingOpen) {
            return $existingOpen;
        }

        $shift = KioskShift::create([
            'company_id' => $kiosk->branch->company_id ?? 1,
            'branch_id' => $kiosk->branch_id,
            'kiosk_id' => $kiosk->id,
            'opened_by_staff_id' => $staff->id,
            'opened_at' => now(),
            'opening_cash_float' => $openingFloat,
            'status' => 'OPEN',
            'closing_notes' => $notes,
        ]);

        AuditLog::create([
            'company_id' => $shift->company_id,
            'staff_id' => $staff->id,
            'action' => 'SHIFT_OPENED',
            'entity_type' => KioskShift::class,
            'entity_id' => $shift->id,
            'description' => "Shift #{$shift->id} opened at kiosk '{$kiosk->kiosk_code}' with RM {$openingFloat} cash float by {$staff->full_name}.",
        ]);

        return $shift;
    }

    /**
     * Get currently active open shift for a given kiosk.
     */
    public function getActiveShift(Kiosk $kiosk): ?KioskShift
    {
        return KioskShift::with(['openedByStaff', 'kiosk.branch'])
            ->where('kiosk_id', $kiosk->id)
            ->where('status', 'OPEN')
            ->latest('opened_at')
            ->first();
    }

    /**
     * Compute real-time live X-Report financial totals for an ongoing shift.
     */
    public function computeLiveXReport(KioskShift $shift): array
    {
        $orders = Order::where('kiosk_shift_id', $shift->id)
            ->where('order_status', 'COMPLETED')
            ->get();

        $grossSales = 0.0;
        $taxTotal = 0.0;
        $discountTotal = 0.0;
        $materialCostTotal = 0.0;
        $cashSales = 0.0;
        $cardSales = 0.0;
        $qrSales = 0.0;

        foreach ($orders as $order) {
            $grossSales += (float)$order->total_amount;
            $taxTotal += (float)$order->tax_amount;
            $discountTotal += (float)$order->discount_amount;
            $materialCostTotal += (float)$order->total_material_cost;

            if ($order->payment_method === 'CASH') {
                $cashSales += (float)$order->net_amount;
            } elseif (in_array($order->payment_method, ['CREDIT_CARD', 'DEBIT_CARD'])) {
                $cardSales += (float)$order->net_amount;
            } else {
                $qrSales += (float)$order->net_amount;
            }
        }

        $openingFloat = (float)$shift->opening_cash_float;
        $expectedCashInTill = $openingFloat + $cashSales;
        $grossContribution = ($grossSales - $discountTotal) - $materialCostTotal;

        return [
            'shift_id' => $shift->id,
            'kiosk_code' => $shift->kiosk->kiosk_code ?? 'N/A',
            'kiosk_name' => $shift->kiosk->kiosk_name ?? 'N/A',
            'branch_name' => $shift->branch->name ?? 'N/A',
            'cashier_name' => $shift->openedByStaff->full_name ?? 'Staff',
            'opened_at' => $shift->opened_at->format('Y-m-d H:i:s'),
            'opening_cash_float' => round($openingFloat, 2),
            'total_orders_count' => $orders->count(),
            'gross_sales' => round($grossSales, 2),
            'tax_collected' => round($taxTotal, 2),
            'discount_given' => round($discountTotal, 2),
            'net_sales' => round($grossSales - $discountTotal + $taxTotal, 2),
            'material_cost' => round($materialCostTotal, 2),
            'gross_contribution' => round($grossContribution, 2),
            'cash_sales' => round($cashSales, 2),
            'card_sales' => round($cardSales, 2),
            'qr_sales' => round($qrSales, 2),
            'expected_cash_in_till' => round($expectedCashInTill, 2),
        ];
    }

    /**
     * Close a kiosk shift with a blind physical cash count and generate Z-Report.
     */
    public function closeShift(KioskShift $shift, Staff $staff, float $closingCashCounted, ?string $notes = null): KioskShift
    {
        return DB::transaction(function () use ($shift, $staff, $closingCashCounted, $notes) {
            $liveTotals = $this->computeLiveXReport($shift);

            $expectedCash = $liveTotals['expected_cash_in_till'];
            $variance = round($closingCashCounted - $expectedCash, 2);

            $shift->update([
                'closed_by_staff_id' => $staff->id,
                'closed_at' => now(),
                'closing_cash_counted' => $closingCashCounted,
                'expected_cash_total' => $expectedCash,
                'cash_variance' => $variance,
                'total_sales_gross' => $liveTotals['gross_sales'],
                'total_tax_collected' => $liveTotals['tax_collected'],
                'total_discount_given' => $liveTotals['discount_given'],
                'total_material_cost' => $liveTotals['material_cost'],
                'total_cash_sales' => $liveTotals['cash_sales'],
                'total_card_sales' => $liveTotals['card_sales'],
                'total_qr_sales' => $liveTotals['qr_sales'],
                'total_orders_count' => $liveTotals['total_orders_count'],
                'status' => 'CLOSED',
                'closing_notes' => $notes,
            ]);

            $varianceSign = $variance >= 0 ? "+RM {$variance}" : "-RM " . abs($variance);
            AuditLog::create([
                'company_id' => $shift->company_id,
                'staff_id' => $staff->id,
                'action' => 'SHIFT_CLOSED_Z_REPORT',
                'entity_type' => KioskShift::class,
                'entity_id' => $shift->id,
                'description' => "Shift #{$shift->id} closed at kiosk '{$shift->kiosk->kiosk_code}'. Counted: RM {$closingCashCounted}, Expected: RM {$expectedCash}, Variance: {$varianceSign} by {$staff->full_name}.",
            ]);

            return $shift;
        });
    }
}
