<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Company;
use App\Models\Order;
use App\Models\OrderItem;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class KitchenDisplayController extends Controller
{
    public function index(Request $request): Response
    {
        $company = Company::first();

        $branches = Branch::where('company_id', $company->id ?? 1)
            ->where('is_active', true)
            ->get(['id', 'name', 'code']);

        $selectedBranchId = $request->input('branch_id', $branches->first()->id ?? 1);

        return Inertia::render('KDS/Screen', [
            'company' => $company,
            'branches' => $branches,
            'selectedBranchId' => (int)$selectedBranchId,
        ]);
    }

    public function apiGetTickets(Request $request)
    {
        $branchId = $request->input('branch_id');
        $statusFilter = $request->input('status', 'ACTIVE'); // 'ACTIVE' (PENDING, PREPARING, READY), 'COMPLETED'

        $query = Order::with(['kiosk', 'items.product', 'items.modifiers'])
            ->where('order_status', 'COMPLETED') // Paid orders
            ->latest('ordered_at');

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        if ($statusFilter === 'ACTIVE') {
            $query->whereIn('fulfillment_status', ['PENDING', 'PREPARING', 'READY']);
        } elseif ($statusFilter === 'COMPLETED') {
            $query->where('fulfillment_status', 'COMPLETED')->limit(15);
        } elseif ($statusFilter !== 'ALL') {
            $query->where('fulfillment_status', $statusFilter);
        }

        $orders = $query->get()->map(function ($order) {
            $now = Carbon::now();
            $orderedAt = Carbon::parse($order->ordered_at);
            $elapsedSeconds = $now->diffInSeconds($orderedAt);

            return [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'kiosk_code' => $order->kiosk->kiosk_code ?? 'POS',
                'kiosk_name' => $order->kiosk->kiosk_name ?? 'Terminal',
                'fulfillment_status' => $order->fulfillment_status,
                'dining_option' => $order->dining_option ?? 'TAKEAWAY',
                'ordered_at' => $order->ordered_at->format('H:i:s'),
                'elapsed_seconds' => $elapsedSeconds,
                'elapsed_minutes' => floor($elapsedSeconds / 60),
                'preparation_started_at' => $order->preparation_started_at?->format('H:i:s'),
                'ready_at' => $order->ready_at?->format('H:i:s'),
                'total_items_count' => $order->items->sum('quantity'),
                'items' => $order->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'product_name' => $item->product->name ?? 'Item',
                        'product_category' => $item->product->category ?? 'General',
                        'quantity' => $item->quantity,
                        'is_prepared' => (bool)$item->is_prepared,
                        'modifiers' => $item->modifiers->map(function ($m) {
                            return [
                                'id' => $m->id,
                                'name' => $m->modifier_name_snapshot,
                            ];
                        }),
                    ];
                }),
            ];
        });

        return response()->json([
            'success' => true,
            'server_time' => now()->format('Y-m-d H:i:s'),
            'tickets' => $orders,
        ]);
    }

    public function apiUpdateOrderStatus(Request $request, Order $order)
    {
        $validated = $request->validate([
            'status' => 'required|in:PENDING,PREPARING,READY,COMPLETED,RECALL',
        ]);

        $status = $validated['status'];

        if ($status === 'PREPARING') {
            $order->update([
                'fulfillment_status' => 'PREPARING',
                'preparation_started_at' => now(),
            ]);
        } elseif ($status === 'READY') {
            $order->update([
                'fulfillment_status' => 'READY',
                'ready_at' => now(),
            ]);
        } elseif ($status === 'COMPLETED') {
            $order->update([
                'fulfillment_status' => 'COMPLETED',
                'completed_at' => now(),
            ]);
        } elseif ($status === 'RECALL') {
            // Revert back from completed to READY
            $order->update([
                'fulfillment_status' => 'READY',
                'completed_at' => null,
            ]);
        } elseif ($status === 'PENDING') {
            $order->update([
                'fulfillment_status' => 'PENDING',
                'preparation_started_at' => null,
                'ready_at' => null,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => "Order {$order->order_number} status updated to {$order->fulfillment_status}",
            'fulfillment_status' => $order->fulfillment_status,
        ]);
    }

    public function apiToggleItemPrepared(Request $request, OrderItem $item)
    {
        $item->is_prepared = !$item->is_prepared;
        $item->save();

        return response()->json([
            'success' => true,
            'item_id' => $item->id,
            'is_prepared' => $item->is_prepared,
        ]);
    }
}
