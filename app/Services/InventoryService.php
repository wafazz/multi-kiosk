<?php

namespace App\Services;

use App\Models\InventoryBalance;
use App\Models\Kiosk;
use App\Models\Order;
use App\Models\RawMaterial;
use App\Models\StockLocation;
use App\Models\StockTransfer;
use App\Models\Wastage;
use App\Models\AuditLog;
use Illuminate\Support\Facades\DB;
use Exception;

class InventoryService
{
    /**
     * Get or create a StockLocation for a physical kiosk.
     */
    public function getOrCreateKioskStockLocation(Kiosk $kiosk): StockLocation
    {
        return StockLocation::firstOrCreate(
            ['kiosk_id' => $kiosk->id],
            [
                'company_id' => $kiosk->branch->company_id,
                'branch_id' => $kiosk->branch_id,
                'location_name' => "{$kiosk->branch->name} - {$kiosk->kiosk_name} Stockroom",
                'location_type' => 'KIOSK',
                'is_active' => true,
            ]
        );
    }

    /**
     * Automatically deduct raw material stock based on BOM recipes when an order is completed.
     */
    public function deductRecipeStockForOrder(Order $order): array
    {
        $kiosk = $order->kiosk;
        $location = $this->getOrCreateKioskStockLocation($kiosk);
        $deductions = [];
        $totalMaterialCost = 0.0;

        DB::transaction(function () use ($order, $location, &$deductions, &$totalMaterialCost) {
            foreach ($order->items()->with('product.recipeItems.rawMaterial')->get() as $item) {
                $product = $item->product;
                if (!$product) continue;

                $itemQty = $item->quantity;
                $itemMaterialCost = 0.0;

                foreach ($product->recipeItems as $recipeItem) {
                    $rawMaterial = $recipeItem->rawMaterial;
                    if (!$rawMaterial) continue;

                    $qtyToDeduct = (float)$recipeItem->quantity_required * $itemQty;
                    $costPerBaseUnit = (float)$rawMaterial->standard_cost_per_base_unit;
                    $lineCost = $qtyToDeduct * $costPerBaseUnit;
                    $itemMaterialCost += $lineCost;

                    // Decrement or create balance record
                    $balance = InventoryBalance::firstOrCreate(
                        [
                            'location_id' => $location->id,
                            'raw_material_id' => $rawMaterial->id,
                        ],
                        [
                            'quantity_on_hand' => 0.0000,
                        ]
                    );

                    $balance->quantity_on_hand = (float)$balance->quantity_on_hand - $qtyToDeduct;
                    $balance->save();

                    $deductions[] = [
                        'raw_material_id' => $rawMaterial->id,
                        'name' => $rawMaterial->name,
                        'base_uom' => $rawMaterial->base_uom,
                        'deducted_qty' => $qtyToDeduct,
                        'remaining_qty' => $balance->quantity_on_hand,
                        'cost' => $lineCost,
                    ];
                }

                $item->unit_cost_snapshot = $itemQty > 0 ? ($itemMaterialCost / $itemQty) : 0;
                $item->save();

                $totalMaterialCost += $itemMaterialCost;
            }

            $order->total_material_cost = $totalMaterialCost;
            $order->save();
        });

        return [
            'total_material_cost' => round($totalMaterialCost, 2),
            'deductions' => $deductions,
        ];
    }

    /**
     * Advance Stock Transfer Workflow State Machine.
     */
    public function advanceTransferStatus(StockTransfer $transfer, string $newStatus, int $staffId, ?array $itemsPayload = null): StockTransfer
    {
        return DB::transaction(function () use ($transfer, $newStatus, $staffId, $itemsPayload) {
            $oldStatus = $transfer->status;

            switch ($newStatus) {
                case 'APPROVED':
                    if ($oldStatus !== 'REQUESTED') {
                        throw new Exception("Only REQUESTED transfers can be APPROVED.");
                    }
                    $transfer->status = 'APPROVED';
                    $transfer->approved_by = $staffId;
                    break;

                case 'DISPATCHED':
                    if (!in_array($oldStatus, ['REQUESTED', 'APPROVED'])) {
                        throw new Exception("Transfer must be REQUESTED or APPROVED to be DISPATCHED.");
                    }

                    // Deduct stock from source location
                    foreach ($transfer->items as $item) {
                        $qty = $itemsPayload[$item->id]['quantity_dispatched'] ?? $item->quantity_requested;
                        $item->quantity_dispatched = $qty;
                        $item->save();

                        $sourceBalance = InventoryBalance::firstOrCreate(
                            ['location_id' => $transfer->source_location_id, 'raw_material_id' => $item->raw_material_id],
                            ['quantity_on_hand' => 0.0]
                        );
                        $sourceBalance->quantity_on_hand -= (float)$qty;
                        $sourceBalance->save();
                    }

                    $transfer->status = 'DISPATCHED';
                    $transfer->dispatched_by = $staffId;
                    $transfer->dispatched_at = now();
                    break;

                case 'RECEIVED':
                    if ($oldStatus !== 'DISPATCHED') {
                        throw new Exception("Transfer must be in DISPATCHED status to be RECEIVED.");
                    }

                    // Credit stock to destination location
                    foreach ($transfer->items as $item) {
                        $qtyReceived = $itemsPayload[$item->id]['quantity_received'] ?? ($item->quantity_dispatched ?? $item->quantity_requested);
                        $item->quantity_received = $qtyReceived;
                        $item->save();

                        $destBalance = InventoryBalance::firstOrCreate(
                            ['location_id' => $transfer->dest_location_id, 'raw_material_id' => $item->raw_material_id],
                            ['quantity_on_hand' => 0.0]
                        );
                        $destBalance->quantity_on_hand += (float)$qtyReceived;
                        $destBalance->save();
                    }

                    $transfer->status = 'RECEIVED';
                    $transfer->received_by = $staffId;
                    $transfer->received_at = now();
                    break;

                case 'CANCELLED':
                    if (in_array($oldStatus, ['RECEIVED', 'CANCELLED'])) {
                        throw new Exception("Cannot cancel a completed or already cancelled transfer.");
                    }
                    if ($oldStatus === 'DISPATCHED') {
                        // Revert source deduction
                        foreach ($transfer->items as $item) {
                            if ($item->quantity_dispatched > 0) {
                                $sourceBalance = InventoryBalance::firstOrCreate(
                                    ['location_id' => $transfer->source_location_id, 'raw_material_id' => $item->raw_material_id],
                                    ['quantity_on_hand' => 0.0]
                                );
                                $sourceBalance->quantity_on_hand += (float)$item->quantity_dispatched;
                                $sourceBalance->save();
                            }
                        }
                    }
                    $transfer->status = 'CANCELLED';
                    break;

                default:
                    throw new Exception("Invalid transfer status: {$newStatus}");
            }

            $transfer->save();

            AuditLog::log(
                $transfer->company_id,
                'TRANSFER_STATUS_CHANGE',
                'StockTransfer',
                (string)$transfer->id,
                ['status' => $oldStatus],
                ['status' => $newStatus],
                $staffId
            );

            return $transfer;
        });
    }

    /**
     * Record wastage and deduct inventory with cost calculation.
     */
    public function recordWastage(
        int $companyId,
        int $locationId,
        int $staffId,
        int $rawMaterialId,
        float $quantity,
        string $reason,
        ?string $notes = null
    ): Wastage {
        return DB::transaction(function () use ($companyId, $locationId, $staffId, $rawMaterialId, $quantity, $reason, $notes) {
            $rawMaterial = RawMaterial::findOrFail($rawMaterialId);
            $costImpact = round($quantity * (float)$rawMaterial->standard_cost_per_base_unit, 2);

            $wastage = Wastage::create([
                'company_id' => $companyId,
                'location_id' => $locationId,
                'staff_id' => $staffId,
                'raw_material_id' => $rawMaterialId,
                'quantity' => $quantity,
                'cost_impact' => $costImpact,
                'reason' => $reason,
                'notes' => $notes,
            ]);

            // Deduct stock from location
            $balance = InventoryBalance::firstOrCreate(
                ['location_id' => $locationId, 'raw_material_id' => $rawMaterialId],
                ['quantity_on_hand' => 0.0]
            );
            $balance->quantity_on_hand -= $quantity;
            $balance->save();

            AuditLog::log(
                $companyId,
                'WASTAGE_RECORDED',
                'Wastage',
                (string)$wastage->id,
                null,
                ['raw_material_id' => $rawMaterialId, 'quantity' => $quantity, 'cost_impact' => $costImpact, 'reason' => $reason],
                $staffId
            );

            return $wastage;
        });
    }
}
