<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Branch;
use App\Models\Company;
use App\Models\InventoryBalance;
use App\Models\Kiosk;
use App\Models\Product;
use App\Models\RawMaterial;
use App\Models\RecipeItem;
use App\Models\StockLocation;
use Illuminate\Foundation\Testing\RefreshDatabase;

class KioskOrderAndInventoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_kiosk_order_processes_and_deducts_bom_stock(): void
    {
        $company = Company::create(['name' => 'Demo Co', 'code' => 'DCO']);
        $branch = Branch::create(['company_id' => $company->id, 'name' => 'Main Branch', 'code' => 'MB01']);
        $kiosk = Kiosk::create([
            'branch_id' => $branch->id,
            'kiosk_code' => 'K01',
            'kiosk_name' => 'POS 01',
            'status' => 'ONLINE',
        ]);

        $kioskLocation = StockLocation::create([
            'company_id' => $company->id,
            'branch_id' => $branch->id,
            'kiosk_id' => $kiosk->id,
            'location_name' => 'Kiosk 01 Stockroom',
            'location_type' => 'KIOSK',
        ]);

        $coffeeBeans = RawMaterial::create([
            'company_id' => $company->id,
            'sku' => 'RM-BEANS',
            'name' => 'Coffee Beans',
            'category' => 'Coffee',
            'base_uom' => 'g',
            'purchase_uom' => 'kg',
            'conversion_rate' => 1000,
            'standard_cost_per_base_unit' => 0.0800,
        ]);

        // Initial stock: 1000g
        InventoryBalance::create([
            'location_id' => $kioskLocation->id,
            'raw_material_id' => $coffeeBeans->id,
            'quantity_on_hand' => 1000.0,
        ]);

        // Product: Espresso (18g beans)
        $espresso = Product::create([
            'company_id' => $company->id,
            'sku' => 'ESP-01',
            'name' => 'Single Espresso',
            'category' => 'Coffee',
            'selling_price' => 8.00,
            'cost_price' => 1.44,
        ]);

        RecipeItem::create([
            'product_id' => $espresso->id,
            'raw_material_id' => $coffeeBeans->id,
            'quantity_required' => 18.0,
        ]);

        // Place Order of 2x Espressos (18g * 2 = 36g deduction)
        $response = $this->postJson('/api/v1/kiosk/order', [
            'kiosk_id' => $kiosk->id,
            'payment_method' => 'CASH',
            'items' => [
                [
                    'product_id' => $espresso->id,
                    'quantity' => 2,
                    'unit_price' => 8.00,
                ],
            ],
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
        ]);

        // Verify remaining inventory balance: 1000 - 36 = 964.0g
        $balance = InventoryBalance::where('location_id', $kioskLocation->id)
            ->where('raw_material_id', $coffeeBeans->id)
            ->first();

        $this->assertEquals(964.0, (float)$balance->quantity_on_hand);
    }
}
