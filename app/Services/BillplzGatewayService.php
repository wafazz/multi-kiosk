<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Order;
use App\Models\PaymentGateway;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BillplzGatewayService
{
    protected InventoryService $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * Get or initialize Billplz configuration for the company
     */
    public function getConfig(int $companyId = 1): PaymentGateway
    {
        return PaymentGateway::firstOrCreate(
            ['company_id' => $companyId, 'provider' => 'BILLPLZ'],
            [
                'api_key' => 'sandbox_key_demo_kiosk_9988',
                'x_signature_key' => 'sandbox_x_sig_secret_1234',
                'collection_id' => 'sandbox_col_001',
                'is_sandbox' => true,
                'is_active' => true,
            ]
        );
    }

    /**
     * Create Billplz Payment Bill for an order
     */
    public function createBill(Order $order, array $customer = []): array
    {
        $config = $this->getConfig($order->company_id);
        $baseUrl = $config->is_sandbox ? 'https://www.billplz-sandbox.com/api/v3' : 'https://www.billplz.com/api/v3';

        $amountInCents = (int) round((float)$order->net_amount * 100);
        $customerName = $customer['name'] ?? 'Kiosk Customer';
        $customerEmail = $customer['email'] ?? 'kiosk.customer@day3hq.local';
        $customerPhone = $customer['phone'] ?? '+60123456789';

        $callbackUrl = url('/api/v1/payment/billplz/webhook');
        $redirectUrl = url("/kiosk/terminal/{$order->kiosk_id}");

        // In Sandbox / Demo mode or when API key is simulated
        if (empty($config->api_key) || str_starts_with($config->api_key, 'sandbox_key')) {
            $billId = 'bill_' . substr(md5($order->order_number . time()), 0, 10);
            $billUrl = "https://www.billplz-sandbox.com/bills/{$billId}";

            $order->update([
                'billplz_bill_id' => $billId,
                'billplz_url' => $billUrl,
                'payment_method' => 'BILLPLZ',
            ]);

            return [
                'success' => true,
                'is_mock' => true,
                'bill_id' => $billId,
                'bill_url' => $billUrl,
                'amount_cents' => $amountInCents,
                'order_number' => $order->order_number,
            ];
        }

        try {
            $response = Http::withBasicAuth($config->api_key, '')
                ->timeout(10)
                ->post("{$baseUrl}/bills", [
                    'collection_id' => $config->collection_id,
                    'description' => "Order {$order->order_number} at {$order->branch->name}",
                    'email' => $customerEmail,
                    'name' => $customerName,
                    'mobile' => $customerPhone,
                    'amount' => $amountInCents,
                    'callback_url' => $callbackUrl,
                    'redirect_url' => $redirectUrl,
                    'reference_1_label' => 'Order Number',
                    'reference_1' => $order->order_number,
                ]);

            if ($response->successful()) {
                $data = $response->json();
                $billId = $data['id'] ?? null;
                $billUrl = $data['url'] ?? null;

                $order->update([
                    'billplz_bill_id' => $billId,
                    'billplz_url' => $billUrl,
                    'payment_method' => 'BILLPLZ',
                ]);

                return [
                    'success' => true,
                    'is_mock' => false,
                    'bill_id' => $billId,
                    'bill_url' => $billUrl,
                    'amount_cents' => $amountInCents,
                    'order_number' => $order->order_number,
                ];
            } else {
                Log::error('Billplz bill creation failed: ' . $response->body());
                return [
                    'success' => false,
                    'message' => 'Billplz API Error: ' . ($response->json('error.message') ?? 'Could not generate bill.'),
                ];
            }
        } catch (Exception $e) {
            Log::error('Billplz exception: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Network error connecting to Billplz gateway: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Poll real-time status of a Billplz Bill
     */
    public function getBillStatus(string $billId, int $companyId = 1): array
    {
        $order = Order::where('billplz_bill_id', $billId)->first();
        if ($order && $order->payment_status === 'PAID') {
            return [
                'success' => true,
                'paid' => true,
                'order_number' => $order->order_number,
                'paid_at' => $order->paid_at?->format('Y-m-d H:i:s'),
            ];
        }

        $config = $this->getConfig($companyId);
        $baseUrl = $config->is_sandbox ? 'https://www.billplz-sandbox.com/api/v3' : 'https://www.billplz.com/api/v3';

        if (empty($config->api_key) || str_starts_with($config->api_key, 'sandbox_key')) {
            // Simulated response for Sandbox
            return [
                'success' => true,
                'paid' => $order ? ($order->payment_status === 'PAID') : false,
                'is_mock' => true,
            ];
        }

        try {
            $response = Http::withBasicAuth($config->api_key, '')
                ->timeout(8)
                ->get("{$baseUrl}/bills/{$billId}");

            if ($response->successful()) {
                $data = $response->json();
                $isPaid = (bool)($data['paid'] ?? false);

                if ($isPaid && $order && $order->payment_status !== 'PAID') {
                    $this->processPaymentSuccess($order, $data['id'] ?? $billId, $data['paid_at'] ?? null);
                }

                return [
                    'success' => true,
                    'paid' => $isPaid,
                    'state' => $data['state'] ?? 'due',
                    'paid_at' => $data['paid_at'] ?? null,
                ];
            }
        } catch (Exception $e) {
            Log::error("Billplz getBillStatus error: " . $e->getMessage());
        }

        return ['success' => false, 'paid' => false];
    }

    /**
     * Verify Billplz Webhook X-Signature HMAC SHA256
     */
    public function verifyWebhookSignature(array $payload, string $signature, int $companyId = 1): bool
    {
        $config = $this->getConfig($companyId);
        $xSignatureKey = $config->x_signature_key;

        if (empty($xSignatureKey)) {
            return true; // Pass if key is unset in sandbox
        }

        // Billplz signature concatenation algorithm:
        // billplzid + billplzpaid + billplzpaid_at + x_signature_key
        $billId = $payload['id'] ?? '';
        $paid = $payload['paid'] ?? '';
        $paidAt = $payload['paid_at'] ?? '';

        $stringToSign = "billplzid{$billId}|billplzpaid{$paid}|billplzpaid_at{$paidAt}";
        $calculatedSignature = hash_hmac('sha256', $stringToSign, $xSignatureKey);

        return hash_equals($calculatedSignature, $signature);
    }

    /**
     * Process Payment Success, Update Order and Deduct BOM Stock
     */
    public function processPaymentSuccess(Order $order, string $transactionId, ?string $paidAt = null): void
    {
        if ($order->payment_status === 'PAID') {
            return; // Idempotent guard
        }

        $order->update([
            'payment_status' => 'PAID',
            'order_status' => 'COMPLETED',
            'payment_gateway_reference' => $transactionId,
            'paid_at' => $paidAt ? \Carbon\Carbon::parse($paidAt) : now(),
        ]);

        // Deduct raw material BOM inventory for this kiosk location
        try {
            $deduction = $this->inventoryService->deductRecipeStockForOrder($order);
            $order->update([
                'total_material_cost' => $deduction['total_material_cost'],
            ]);
        } catch (Exception $e) {
            Log::warning("BOM deduction warning on Billplz payment: " . $e->getMessage());
        }

        AuditLog::create([
            'company_id' => $order->company_id,
            'staff_id' => $order->staff_id,
            'action' => 'PAYMENT_GATEWAY_SUCCESS',
            'entity_type' => Order::class,
            'entity_id' => $order->id,
            'description' => "Billplz online payment confirmed for Order #{$order->order_number}. Amount: RM {$order->net_amount}. Ref: {$transactionId}.",
        ]);
    }
}
