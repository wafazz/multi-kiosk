<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Branch;
use App\Models\Company;
use App\Models\InventoryBalance;
use App\Models\Kiosk;
use App\Models\Order;
use App\Models\PaymentGateway;
use App\Models\Product;
use App\Models\RawMaterial;
use App\Models\RecipeItem;
use App\Models\StockLocation;
use App\Services\BillplzGatewayService;
use App\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class BillplzPaymentGatewayTest extends TestCase
{
    use RefreshDatabase;

    public function test_billplz_bill_creation_webhook_verification_and_bom_deduction(): void
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
            'quantity_on_hand' => 500.00,
        ]);

        $product = Product::create([
            'company_id' => $company->id,
            'sku' => 'AME-HOT',
            'name' => 'Hot Americano',
            'category' => 'COFFEE',
            'selling_price' => 10.00,
            'cost_price' => 1.44,
            'is_active' => true,
        ]);

        RecipeItem::create([
            'product_id' => $product->id,
            'raw_material_id' => $beans->id,
            'quantity_required' => 18.00, // 18g beans
            'unit_of_measure' => 'g',
        ]);

        $gateway = PaymentGateway::create([
            'company_id' => $company->id,
            'provider' => 'BILLPLZ',
            'api_key' => 'sandbox_key_demo_kiosk_9988',
            'x_signature_key' => 'test_x_sig_secret_123',
            'collection_id' => 'sandbox_col_001',
            'is_sandbox' => true,
            'is_active' => true,
        ]);

        $order = Order::create([
            'company_id' => $company->id,
            'branch_id' => $branch->id,
            'kiosk_id' => $kiosk->id,
            'order_number' => 'ORD-BP-001',
            'total_amount' => 10.00,
            'tax_amount' => 0.60,
            'net_amount' => 10.60,
            'payment_method' => 'BILLPLZ',
            'payment_status' => 'PENDING',
            'order_status' => 'PENDING',
            'dining_option' => 'TAKEAWAY',
            'ordered_at' => now(),
        ]);

        $gatewayService = app(BillplzGatewayService::class);

        // 1. Test Bill Creation
        $billResult = $gatewayService->createBill($order, [
            'name' => 'Fakrul Customer',
            'email' => 'fakrul@example.com',
        ]);

        $this->assertTrue($billResult['success']);
        $this->assertNotEmpty($billResult['bill_id']);
        $order->refresh();
        $this->assertEquals($billResult['bill_id'], $order->billplz_bill_id);

        // 2. Test Signature Verification
        $billId = $order->billplz_bill_id;
        $paidAt = '2026-08-19 16:00:00';
        $stringToSign = "billplzid{$billId}|billplzpaidtrue|billplzpaid_at{$paidAt}";
        $signature = hash_hmac('sha256', $stringToSign, 'test_x_sig_secret_123');

        $isValid = $gatewayService->verifyWebhookSignature([
            'id' => $billId,
            'paid' => 'true',
            'paid_at' => $paidAt,
        ], $signature, $company->id);

        $this->assertTrue($isValid);

        // 3. Test Webhook Callback processing
        $response = $this->postJson('/api/v1/payment/billplz/webhook', [
            'id' => $billId,
            'paid' => 'true',
            'paid_at' => $paidAt,
            'x_signature' => $signature,
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);

        $order->refresh();
        $this->assertEquals('PAID', $order->payment_status);
        $this->assertEquals('COMPLETED', $order->order_status);
        $this->assertNotNull($order->paid_at);

        // 4. Test Idempotent repeated webhook call
        $repeatResponse = $this->postJson('/api/v1/payment/billplz/webhook', [
            'id' => $billId,
            'paid' => 'true',
            'paid_at' => $paidAt,
            'x_signature' => $signature,
        ]);
        $repeatResponse->assertStatus(200);
    }
}
