<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Order;
use App\Models\PaymentGateway;
use App\Services\BillplzGatewayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class PaymentGatewayController extends Controller
{
    public function settings(Request $request, BillplzGatewayService $gatewayService): Response
    {
        $company = Company::first();
        $gateway = $gatewayService->getConfig($company->id ?? 1);

        $webhookUrl = url('/api/v1/payment/billplz/webhook');

        return Inertia::render('Settings/PaymentGateways', [
            'company' => $company,
            'gateway' => $gateway,
            'webhookUrl' => $webhookUrl,
        ]);
    }

    public function update(Request $request, BillplzGatewayService $gatewayService)
    {
        $company = Company::first();
        $validated = $request->validate([
            'api_key' => 'nullable|string',
            'x_signature_key' => 'nullable|string',
            'collection_id' => 'nullable|string',
            'is_sandbox' => 'required|boolean',
            'is_active' => 'required|boolean',
        ]);

        $gateway = $gatewayService->getConfig($company->id ?? 1);
        $gateway->update($validated);

        return redirect()->route('settings.gateways.index')->with('success', 'Payment gateway configuration updated successfully.');
    }

    public function apiCreateBill(Request $request, BillplzGatewayService $gatewayService)
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'customer_name' => 'nullable|string',
            'customer_email' => 'nullable|email',
            'customer_phone' => 'nullable|string',
        ]);

        $order = Order::with('branch')->findOrFail($validated['order_id']);

        $customer = [
            'name' => $validated['customer_name'] ?? 'Kiosk Customer',
            'email' => $validated['customer_email'] ?? 'kiosk.customer@day3hq.local',
            'phone' => $validated['customer_phone'] ?? '+60123456789',
        ];

        $billResult = $gatewayService->createBill($order, $customer);

        return response()->json($billResult);
    }

    public function apiCheckStatus(Request $request, string $billId, BillplzGatewayService $gatewayService)
    {
        $company = Company::first();
        $status = $gatewayService->getBillStatus($billId, $company->id ?? 1);

        return response()->json($status);
    }

    public function apiWebhook(Request $request, BillplzGatewayService $gatewayService)
    {
        $payload = $request->all();
        $signature = $request->header('X-Signature') ?? $request->input('x_signature');

        Log::info('Billplz webhook callback received:', $payload);

        $billId = $payload['id'] ?? null;
        if (!$billId) {
            return response()->json(['success' => false, 'message' => 'Missing bill ID.'], 400);
        }

        $order = Order::where('billplz_bill_id', $billId)->first();
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Order not found.'], 404);
        }

        // Verify HMAC SHA256 Signature
        if ($signature && !$gatewayService->verifyWebhookSignature($payload, $signature, $order->company_id)) {
            Log::warning("Billplz webhook signature verification failed for bill {$billId}");
            return response()->json(['success' => false, 'message' => 'Invalid signature.'], 403);
        }

        $isPaid = filter_var($payload['paid'] ?? false, FILTER_VALIDATE_BOOLEAN);

        if ($isPaid) {
            $gatewayService->processPaymentSuccess($order, $billId, $payload['paid_at'] ?? null);
        }

        return response()->json(['success' => true, 'message' => 'Webhook processed.']);
    }
}
