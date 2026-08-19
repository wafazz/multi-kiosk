<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\RawMaterial;
use App\Models\Staff;
use App\Models\StockLocation;
use App\Models\StockTransfer;
use App\Models\StockTransferItem;
use App\Models\Wastage;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Exception;

class InventoryController extends Controller
{
    public function index(Request $request): Response
    {
        $company = Company::first();

        // Transfers
        $transfers = StockTransfer::with([
            'sourceLocation',
            'destLocation',
            'requester',
            'approver',
            'dispatcher',
            'receiver',
            'items.rawMaterial',
        ])
            ->where('company_id', $company->id ?? 1)
            ->latest()
            ->get()
            ->map(function ($t) {
                return [
                    'id' => $t->id,
                    'transfer_number' => $t->transfer_number,
                    'source_location' => $t->sourceLocation->location_name ?? 'N/A',
                    'source_location_id' => $t->source_location_id,
                    'dest_location' => $t->destLocation->location_name ?? 'N/A',
                    'dest_location_id' => $t->dest_location_id,
                    'requested_by_name' => $t->requester->full_name ?? 'Staff',
                    'status' => $t->status,
                    'notes' => $t->notes,
                    'created_at' => $t->created_at->format('Y-m-d H:i'),
                    'dispatched_at' => $t->dispatched_at ? $t->dispatched_at->format('Y-m-d H:i') : null,
                    'received_at' => $t->received_at ? $t->received_at->format('Y-m-d H:i') : null,
                    'items' => $t->items->map(function ($i) {
                        return [
                            'id' => $i->id,
                            'raw_material_id' => $i->raw_material_id,
                            'raw_material_name' => $i->rawMaterial->name ?? 'Item',
                            'base_uom' => $i->rawMaterial->base_uom ?? '',
                            'quantity_requested' => (float)$i->quantity_requested,
                            'quantity_dispatched' => (float)$i->quantity_dispatched,
                            'quantity_received' => (float)$i->quantity_received,
                        ];
                    }),
                ];
            });

        // Wastages
        $wastages = Wastage::with(['location', 'staff', 'rawMaterial'])
            ->where('company_id', $company->id ?? 1)
            ->latest()
            ->get()
            ->map(function ($w) {
                return [
                    'id' => $w->id,
                    'location_name' => $w->location->location_name ?? 'N/A',
                    'staff_name' => $w->staff->full_name ?? 'N/A',
                    'raw_material_name' => $w->rawMaterial->name ?? 'N/A',
                    'base_uom' => $w->rawMaterial->base_uom ?? '',
                    'quantity' => (float)$w->quantity,
                    'cost_impact' => (float)$w->cost_impact,
                    'reason' => $w->reason,
                    'notes' => $w->notes,
                    'created_at' => $w->created_at->format('Y-m-d H:i'),
                ];
            });

        $stockLocations = StockLocation::where('company_id', $company->id ?? 1)->get();
        $rawMaterials = RawMaterial::where('company_id', $company->id ?? 1)->where('is_active', true)->get();
        $staffMembers = Staff::where('company_id', $company->id ?? 1)->where('is_active', true)->get(['id', 'full_name', 'role']);

        return Inertia::render('Inventory/Transfers', [
            'transfers' => $transfers,
            'wastages' => $wastages,
            'stockLocations' => $stockLocations,
            'rawMaterials' => $rawMaterials,
            'staffMembers' => $staffMembers,
        ]);
    }

    public function storeTransfer(Request $request)
    {
        $company = Company::first();
        $validated = $request->validate([
            'source_location_id' => 'required|exists:stock_locations,id',
            'dest_location_id' => 'required|exists:stock_locations,id|different:source_location_id',
            'requested_by' => 'required|exists:staff,id',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.raw_material_id' => 'required|exists:raw_materials,id',
            'items.*.quantity_requested' => 'required|numeric|min:0.0001',
        ]);

        $transferNumber = 'TRF-' . date('Ymd') . '-' . strtoupper(Str::random(4));

        $transfer = StockTransfer::create([
            'transfer_number' => $transferNumber,
            'company_id' => $company->id ?? 1,
            'source_location_id' => $validated['source_location_id'],
            'dest_location_id' => $validated['dest_location_id'],
            'requested_by' => $validated['requested_by'],
            'status' => 'REQUESTED',
            'notes' => $validated['notes'] ?? null,
        ]);

        foreach ($validated['items'] as $item) {
            StockTransferItem::create([
                'transfer_id' => $transfer->id,
                'raw_material_id' => $item['raw_material_id'],
                'quantity_requested' => $item['quantity_requested'],
            ]);
        }

        return redirect()->back()->with('success', "Stock Transfer '{$transferNumber}' requested.");
    }

    public function updateTransferStatus(Request $request, StockTransfer $transfer, InventoryService $inventoryService)
    {
        $validated = $request->validate([
            'status' => 'required|in:APPROVED,DISPATCHED,RECEIVED,CANCELLED',
            'staff_id' => 'required|exists:staff,id',
            'items' => 'nullable|array',
        ]);

        try {
            $inventoryService->advanceTransferStatus(
                $transfer,
                $validated['status'],
                (int)$validated['staff_id'],
                $validated['items'] ?? null
            );
            return redirect()->back()->with('success', "Transfer status advanced to {$validated['status']}.");
        } catch (Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function storeWastage(Request $request, InventoryService $inventoryService)
    {
        $company = Company::first();
        $validated = $request->validate([
            'location_id' => 'required|exists:stock_locations,id',
            'staff_id' => 'required|exists:staff,id',
            'raw_material_id' => 'required|exists:raw_materials,id',
            'quantity' => 'required|numeric|min:0.0001',
            'reason' => 'required|in:EXPIRED,DAMAGED_TRANSIT,SPILLAGE_PREP,DEFECTIVE_BATCH,WRONG_ORDER_REMAKE,OTHER',
            'notes' => 'nullable|string',
        ]);

        try {
            $wastage = $inventoryService->recordWastage(
                $company->id ?? 1,
                (int)$validated['location_id'],
                (int)$validated['staff_id'],
                (int)$validated['raw_material_id'],
                (float)$validated['quantity'],
                $validated['reason'],
                $validated['notes'] ?? null
            );

            return redirect()->back()->with('success', "Wastage of RM {$wastage->cost_impact} recorded.");
        } catch (Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }
}
