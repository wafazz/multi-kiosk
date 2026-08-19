<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Company;
use App\Models\InventoryBalance;
use App\Models\RawMaterial;
use App\Models\Staff;
use App\Models\StockLocation;
use App\Models\StockTransfer;
use App\Models\StockTransferItem;
use App\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

class StockTransferLifecycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_stock_transfer_lifecycle_moves_inventory_atomically(): void
    {
        $company = Company::create(['name' => 'Demo Co', 'code' => 'DCO']);
        $warehouse = StockLocation::create([
            'company_id' => $company->id,
            'location_name' => 'Central Warehouse',
            'location_type' => 'CENTRAL_WAREHOUSE',
        ]);
        $kioskStore = StockLocation::create([
            'company_id' => $company->id,
            'location_name' => 'Kiosk Stockroom',
            'location_type' => 'KIOSK',
        ]);

        $material = RawMaterial::create([
            'company_id' => $company->id,
            'sku' => 'RM-MILK',
            'name' => 'Fresh Milk',
            'category' => 'Dairy',
            'base_uom' => 'ml',
            'purchase_uom' => 'liter',
            'conversion_rate' => 1000,
            'standard_cost_per_base_unit' => 0.0070,
        ]);

        // Warehouse has 50,000ml, Kiosk has 0ml
        InventoryBalance::create(['location_id' => $warehouse->id, 'raw_material_id' => $material->id, 'quantity_on_hand' => 50000.0]);
        InventoryBalance::create(['location_id' => $kioskStore->id, 'raw_material_id' => $material->id, 'quantity_on_hand' => 0.0]);

        $staff = Staff::create([
            'company_id' => $company->id,
            'staff_code' => 'STF-01',
            'full_name' => 'Logistics Staff',
            'pin_hash' => Hash::make('1234'),
            'role' => 'SUPER_ADMIN',
        ]);

        $transfer = StockTransfer::create([
            'transfer_number' => 'TRF-TEST-001',
            'company_id' => $company->id,
            'source_location_id' => $warehouse->id,
            'dest_location_id' => $kioskStore->id,
            'requested_by' => $staff->id,
            'status' => 'REQUESTED',
        ]);

        $item = StockTransferItem::create([
            'transfer_id' => $transfer->id,
            'raw_material_id' => $material->id,
            'quantity_requested' => 10000.0, // 10L
        ]);

        $inventoryService = new InventoryService();

        // 1. Dispatch
        $inventoryService->advanceTransferStatus($transfer, 'DISPATCHED', $staff->id);
        $this->assertEquals('DISPATCHED', $transfer->fresh()->status);

        // Warehouse stock deducted (50000 - 10000 = 40000)
        $warehouseBal = InventoryBalance::where('location_id', $warehouse->id)->where('raw_material_id', $material->id)->first();
        $this->assertEquals(40000.0, (float)$warehouseBal->quantity_on_hand);

        // 2. Receive
        $inventoryService->advanceTransferStatus($transfer, 'RECEIVED', $staff->id);
        $this->assertEquals('RECEIVED', $transfer->fresh()->status);

        // Kiosk stock credited (0 + 10000 = 10000)
        $kioskBal = InventoryBalance::where('location_id', $kioskStore->id)->where('raw_material_id', $material->id)->first();
        $this->assertEquals(10000.0, (float)$kioskBal->quantity_on_hand);
    }
}
