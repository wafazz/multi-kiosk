<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Branch;
use App\Models\Company;
use App\Models\InventoryBalance;
use App\Models\Kiosk;
use App\Models\Order;
use App\Models\Product;
use App\Models\RawMaterial;
use App\Models\RecipeItem;
use App\Models\StockLocation;
use Illuminate\Foundation\Testing\RefreshDatabase;

class OfflineOrderSyncTest extends TestCase
{
    use RefreshDatabase;

    public function test_offline_order_idempotent_sync_and_inventory_deduction(): void
    {
        $company = Company::create(['name' => 'Demo Co', 'code' => 'DCO']);
        $branch = Branch::create(['company_id' => $company->id, 'name' => 'Main Branch', 'code' => 'MB01']);
        $kiosk = Kiosk::create([
            'branch_id' => $branch->id,
            'kiosk_code' => 'K01',
            'kiosk_name' => 'POS 01',
            'status' => 'ONLINE',
        ]);

        $stockLocation = StockLocation::create([
            'company_id' => $company->id,
            'branch_id' => $branch->id,
            'kiosk_id' => $kiosk->id,
            'location_name' => 'Kiosk 01 Stockroom',
            'location_type' => 'KIOSK',
        ]);

        $beans = RawMaterial::create([
            'company_id' => $company->id,
            'sku' => 'RM-BEANS',
            'name' => 'Espresso Beans',
            'category' => 'Coffee',
            'base_uom' => 'g',
            'purchase_uom' => 'kg',
            'conversion_rate' => 1000,
            'standard_cost_per_base_unit' => 0.08,
        ]);

        InventoryBalance::create([
            'location_id' => $stockLocation->id,
            'raw_material_id' => $beans->id,
            'quantity_on_hand' => 1000.00,
        ]);

        $latte = Product::create([
            'company_id' => $company->id,
            'sku' => 'LAT-ICE',
            'name' => 'Iced Latte',
            'category' => 'COFFEE',
            'selling_price' => 12.00,
            'cost_price' => 2.00,
            'is_active' => true,
        ]);

        RecipeItem::create([
            'product_id' => $latte->id,
            'raw_material_id' => $beans->id,
            'quantity_required' => 18.00, // 18g beans
            'unit_of_measure' => 'g',
        ]);

        $clientUuid = 'OFFLINE-SYNC-UUID-999888';

        $payload = [
            'client_uuid' => $clientUuid,
            'kiosk_id' => $kiosk->id,
            'payment_method' => 'CASH',
            'dining_option' => 'TAKEAWAY',
            'discount_amount' => 0.00,
            'ordered_at' => '2026-08-19 09:15:00',
            'items' => [
                [
                    'product_id' => $latte->id,
                    'quantity' => 2, // 2 x 18g = 36g beans
                    'unit_price' => 12.00,
                ],
            ],
        ];

        // 1. First sync submission
        $res1 = $this->postJson('/api/v1/kiosk/order', $payload);
        $res1->assertStatus(200);
        $res1->assertJsonPath('success', true);
        $res1->assertJsonPath('order.uuid', $clientUuid);

        $order = Order::where('uuid', $clientUuid)->first();
        $this->assertNotNull($order);
        $this->assertEquals('2026-08-19 09:15:00', $order->ordered_at->format('Y-m-d H:i:s'));

        // Verify BOM stock was deducted (1000 - 36 = 964)
        $balance = InventoryBalance::where('location_id', $stockLocation->id)
            ->where('raw_material_id', $beans->id)
            ->first();
        $this->assertEquals(964.00, (float)$balance->quantity_on_hand);

        // 2. Second idempotent submission (simulating duplicate retry on flaky network)
        $res2 = $this->postJson('/api/v1/kiosk/order', $payload);
        $res2->assertStatus(200);
        $res2->assertJsonPath('success', true);
        $res2->assertJsonPath('is_duplicate', true);

        // Verify inventory was NOT deducted again (still 964)
        $balance->refresh();
        $this->assertEquals(964.00, (float)$balance->quantity_on_hand);

        // Verify total orders count in database is still 1
        $this->assertEquals(1, Order::where('uuid', $clientUuid)->count());
    }
}
