<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Branch;
use App\Models\Company;
use App\Models\Kiosk;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Staff;
use App\Services\AttendanceService;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Exception;

class KioskTerminalController extends Controller
{
    public function terminal(Request $request, ?int $kioskId = null): Response
    {
        $company = Company::first();

        $allKiosks = Kiosk::with('branch')
            ->whereHas('branch', function ($q) use ($company) {
                $q->where('company_id', $company->id ?? 1);
            })
            ->get();

        $selectedKiosk = null;
        if ($kioskId) {
            $selectedKiosk = $allKiosks->firstWhere('id', $kioskId);
        }
        if (!$selectedKiosk) {
            $selectedKiosk = $allKiosks->first();
        }

        // Fetch sellable products with recipe and modifier groups
        $products = Product::where('company_id', $company->id ?? 1)
            ->where('is_active', true)
            ->with(['recipeItems.rawMaterial', 'modifierGroups.options.recipes.rawMaterial'])
            ->get()
            ->map(function ($p) {
                return [
                    'id' => $p->id,
                    'sku' => $p->sku,
                    'name' => $p->name,
                    'category' => $p->category,
                    'description' => $p->description,
                    'selling_price' => (float)$p->selling_price,
                    'image_url' => $p->image_url,
                    'ingredient_count' => $p->recipeItems->count(),
                    'modifier_groups' => $p->modifierGroups->map(function ($g) {
                        return [
                            'id' => $g->id,
                            'name' => $g->name,
                            'selection_type' => $g->selection_type,
                            'is_required' => $g->is_required,
                            'min_selections' => $g->min_selections,
                            'max_selections' => $g->max_selections,
                            'options' => $g->options->where('is_active', true)->map(function ($opt) {
                                return [
                                    'id' => $opt->id,
                                    'name' => $opt->name,
                                    'price_adjustment' => (float)$opt->price_adjustment,
                                    'bom_cost' => $opt->calculateBomCost(),
                                ];
                            })->values(),
                        ];
                    })->values(),
                ];
            });

        // Active open shifts at this kiosk
        $activeShift = null;
        if ($selectedKiosk) {
            $openAttendance = Attendance::with('staff')
                ->where('kiosk_id_in', $selectedKiosk->id)
                ->where('status', 'OPEN')
                ->latest('clock_in_at')
                ->first();

            if ($openAttendance) {
                $activeShift = [
                    'attendance_id' => $openAttendance->id,
                    'staff_id' => $openAttendance->staff->id,
                    'staff_name' => $openAttendance->staff->full_name,
                    'staff_code' => $openAttendance->staff->staff_code,
                    'clock_in_at' => $openAttendance->clock_in_at->format('Y-m-d H:i:s'),
                ];
            }
        }

        return Inertia::render('Kiosk/Terminal', [
            'company' => $company,
            'kiosks' => $allKiosks,
            'currentKiosk' => $selectedKiosk,
            'products' => $products,
            'activeShift' => $activeShift,
        ]);
    }

    public function processOrder(Request $request, InventoryService $inventoryService)
    {
        $company = Company::first();
        $validated = $request->validate([
            'kiosk_id' => 'required|exists:kiosks,id',
            'staff_id' => 'nullable|exists:staff,id',
            'payment_method' => 'required|in:CASH,CREDIT_CARD,DEBIT_CARD,E_WALLET,QR_PAY,OTHER',
            'discount_amount' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.modifiers' => 'nullable|array',
            'items.*.modifiers.*.modifier_option_id' => 'required|exists:modifier_options,id',
            'items.*.modifiers.*.name' => 'required|string',
            'items.*.modifiers.*.price_adjustment' => 'nullable|numeric',
        ]);

        $kiosk = Kiosk::with('branch')->findOrFail($validated['kiosk_id']);
        $branch = $kiosk->branch;

        $orderNumber = 'ORD-' . $kiosk->kiosk_code . '-' . date('Ymd') . '-' . strtoupper(Str::random(4));

        $totalAmount = 0.0;
        foreach ($validated['items'] as $item) {
            $itemLineTotal = (float)$item['unit_price'] * (int)$item['quantity'];
            $totalAmount += $itemLineTotal;
        }

        $discount = (float)($validated['discount_amount'] ?? 0.0);
        $tax = round(($totalAmount - $discount) * 0.06, 2); // 6% standard tax
        $netAmount = max(0, ($totalAmount - $discount) + $tax);

        $order = Order::create([
            'uuid' => (string) Str::uuid(),
            'company_id' => $company->id ?? 1,
            'branch_id' => $branch->id,
            'kiosk_id' => $kiosk->id,
            'staff_id' => $validated['staff_id'] ?? null,
            'order_number' => $orderNumber,
            'total_amount' => $totalAmount,
            'discount_amount' => $discount,
            'tax_amount' => $tax,
            'net_amount' => $netAmount,
            'total_material_cost' => 0.00,
            'payment_method' => $validated['payment_method'],
            'payment_status' => 'PAID',
            'order_status' => 'COMPLETED',
            'ordered_at' => now(),
        ]);

        foreach ($validated['items'] as $item) {
            $product = Product::find($item['product_id']);
            $orderItem = OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $item['product_id'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'total_price' => (float)$item['unit_price'] * (int)$item['quantity'],
                'unit_cost_snapshot' => $product ? $product->cost_price : 0.00,
            ]);

            if (!empty($item['modifiers'])) {
                foreach ($item['modifiers'] as $mod) {
                    \App\Models\OrderItemModifier::create([
                        'order_item_id' => $orderItem->id,
                        'modifier_option_id' => $mod['modifier_option_id'],
                        'modifier_name_snapshot' => $mod['name'],
                        'price_adjustment_snapshot' => $mod['price_adjustment'] ?? 0.00,
                        'material_cost_snapshot' => 0.00,
                    ]);
                }
            }
        }

        // Trigger automated recipe BOM deduction (including base recipe + modifiers)
        $deductionResult = $inventoryService->deductRecipeStockForOrder($order);

        return response()->json([
            'success' => true,
            'message' => "Order #{$orderNumber} completed successfully.",
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'total_amount' => $order->total_amount,
                'discount_amount' => $order->discount_amount,
                'tax_amount' => $order->tax_amount,
                'net_amount' => $order->net_amount,
                'payment_method' => $order->payment_method,
                'ordered_at' => $order->ordered_at->format('d M Y, H:i:s'),
                'kiosk_code' => $kiosk->kiosk_code,
                'kiosk_name' => $kiosk->kiosk_name,
                'branch_name' => $branch->name,
                'bom_deductions_count' => count($deductionResult['deductions']),
                'total_material_cost' => $deductionResult['total_material_cost'],
            ],
        ]);
    }

    public function handleClock(Request $request, AttendanceService $attendanceService)
    {
        $validated = $request->validate([
            'pin' => 'required|string|min:4|max:6',
            'kiosk_id' => 'required|exists:kiosks,id',
            'action' => 'required|in:AUTO,CLOCK_IN,CLOCK_OUT',
        ]);

        $company = Company::first();
        $staff = $attendanceService->verifyPin($validated['pin'], $company->id ?? null);

        if (!$staff) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid staff PIN. Please try again.',
            ], 422);
        }

        $kiosk = Kiosk::findOrFail($validated['kiosk_id']);
        $openShift = Attendance::where('staff_id', $staff->id)->where('status', 'OPEN')->first();

        try {
            if ($validated['action'] === 'CLOCK_IN' || ($validated['action'] === 'AUTO' && !$openShift)) {
                $attendance = $attendanceService->clockIn($staff, $kiosk);
                return response()->json([
                    'success' => true,
                    'action' => 'CLOCK_IN',
                    'message' => "Welcome, {$staff->full_name}! Clocked in successfully at {$kiosk->kiosk_name}.",
                    'staff' => [
                        'id' => $staff->id,
                        'full_name' => $staff->full_name,
                        'staff_code' => $staff->staff_code,
                        'role' => $staff->role,
                    ],
                    'clock_in_at' => $attendance->clock_in_at->format('H:i:s'),
                ]);
            } else {
                $attendance = $attendanceService->clockOut($staff, $kiosk);
                return response()->json([
                    'success' => true,
                    'action' => 'CLOCK_OUT',
                    'message' => "Goodbye, {$staff->full_name}! Clocked out successfully. Duration: {$attendance->raw_duration_minutes} mins (Payable: {$attendance->payable_duration_minutes} mins, Gross: RM {$attendance->gross_earnings}).",
                    'staff' => [
                        'id' => $staff->id,
                        'full_name' => $staff->full_name,
                        'staff_code' => $staff->staff_code,
                        'role' => $staff->role,
                    ],
                    'payable_minutes' => $attendance->payable_duration_minutes,
                    'gross_earnings' => $attendance->gross_earnings,
                ]);
            }
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
