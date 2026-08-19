<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Branch;
use App\Models\Company;
use App\Models\Kiosk;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;

class KitchenDisplaySystemTest extends TestCase
{
    use RefreshDatabase;

    public function test_kds_ticket_lifecycle_and_item_prepared_toggle(): void
    {
        $company = Company::create(['name' => 'Demo Co', 'code' => 'DCO']);
        $branch = Branch::create(['company_id' => $company->id, 'name' => 'Main Branch', 'code' => 'MB01']);
        $kiosk = Kiosk::create([
            'branch_id' => $branch->id,
            'kiosk_code' => 'K01',
            'kiosk_name' => 'POS 01',
            'status' => 'ONLINE',
        ]);

        $product = Product::create([
            'company_id' => $company->id,
            'sku' => 'LAT-ICE',
            'name' => 'Iced Caffe Latte',
            'category' => 'COFFEE',
            'selling_price' => 12.00,
            'cost_price' => 2.50,
            'is_active' => true,
        ]);

        $order = Order::create([
            'company_id' => $company->id,
            'branch_id' => $branch->id,
            'kiosk_id' => $kiosk->id,
            'order_number' => 'ORD-TEST-001',
            'total_amount' => 12.00,
            'tax_amount' => 0.72,
            'net_amount' => 12.72,
            'payment_method' => 'CASH',
            'payment_status' => 'PAID',
            'order_status' => 'COMPLETED',
            'fulfillment_status' => 'PENDING',
            'dining_option' => 'TAKEAWAY',
            'ordered_at' => now(),
        ]);

        $item = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 2,
            'unit_price' => 12.00,
            'total_price' => 24.00,
            'unit_cost_snapshot' => 2.50,
            'is_prepared' => false,
        ]);

        // 1. API: Get KDS Tickets
        $response = $this->getJson("/api/v1/kds/tickets?branch_id={$branch->id}&status=ACTIVE");
        $response->assertStatus(200);
        $response->assertJsonPath('tickets.0.id', $order->id);
        $response->assertJsonPath('tickets.0.fulfillment_status', 'PENDING');

        // 2. API: Update Status to PREPARING
        $prepResp = $this->postJson("/api/v1/kds/order/{$order->id}/status", ['status' => 'PREPARING']);
        $prepResp->assertStatus(200);
        $order->refresh();
        $this->assertEquals('PREPARING', $order->fulfillment_status);
        $this->assertNotNull($order->preparation_started_at);

        // 3. API: Toggle Item Prepared
        $toggleResp = $this->postJson("/api/v1/kds/item/{$item->id}/toggle");
        $toggleResp->assertStatus(200);
        $item->refresh();
        $this->assertTrue($item->is_prepared);

        // 4. API: Update Status to READY
        $readyResp = $this->postJson("/api/v1/kds/order/{$order->id}/status", ['status' => 'READY']);
        $readyResp->assertStatus(200);
        $order->refresh();
        $this->assertEquals('READY', $order->fulfillment_status);
        $this->assertNotNull($order->ready_at);

        // 5. API: Complete and Bump
        $compResp = $this->postJson("/api/v1/kds/order/{$order->id}/status", ['status' => 'COMPLETED']);
        $compResp->assertStatus(200);
        $order->refresh();
        $this->assertEquals('COMPLETED', $order->fulfillment_status);
        $this->assertNotNull($order->completed_at);

        // 6. API: Recall Ticket
        $recallResp = $this->postJson("/api/v1/kds/order/{$order->id}/status", ['status' => 'RECALL']);
        $recallResp->assertStatus(200);
        $order->refresh();
        $this->assertEquals('READY', $order->fulfillment_status);
        $this->assertNull($order->completed_at);
    }
}
