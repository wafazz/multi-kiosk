<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\InventoryBalance;
use App\Models\RawMaterial;
use App\Models\StockLocation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RawMaterialController extends Controller
{
    public function index(): Response
    {
        $company = Company::first();
        $materials = RawMaterial::with(['balances.location'])
            ->where('company_id', $company->id ?? 1)
            ->get()
            ->map(function ($m) {
                $totalStock = (float) $m->balances->sum('quantity_on_hand');
                $totalCostValue = $totalStock * (float)$m->standard_cost_per_base_unit;

                $locationBreakdown = $m->balances->map(function ($b) {
                    return [
                        'location_id' => $b->location_id,
                        'location_name' => $b->location->location_name ?? 'Location',
                        'location_type' => $b->location->location_type ?? '',
                        'quantity' => (float)$b->quantity_on_hand,
                    ];
                });

                return [
                    'id' => $m->id,
                    'sku' => $m->sku,
                    'name' => $m->name,
                    'category' => $m->category,
                    'base_uom' => $m->base_uom,
                    'purchase_uom' => $m->purchase_uom,
                    'conversion_rate' => (float)$m->conversion_rate,
                    'standard_cost_per_base_unit' => (float)$m->standard_cost_per_base_unit,
                    'purchase_cost_calculated' => round((float)$m->standard_cost_per_base_unit * (float)$m->conversion_rate, 2),
                    'min_stock_alert_level' => (float)$m->min_stock_alert_level,
                    'total_stock' => $totalStock,
                    'total_valuation' => round($totalCostValue, 2),
                    'is_low_stock' => $totalStock <= (float)$m->min_stock_alert_level,
                    'is_active' => $m->is_active,
                    'locations' => $locationBreakdown,
                ];
            });

        $stockLocations = StockLocation::where('company_id', $company->id ?? 1)->get();

        return Inertia::render('RawMaterials/Index', [
            'materials' => $materials,
            'stockLocations' => $stockLocations,
        ]);
    }

    public function store(Request $request)
    {
        $company = Company::first();
        $validated = $request->validate([
            'sku' => 'required|string|max:100',
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'base_uom' => 'required|string|max:20',
            'purchase_uom' => 'required|string|max:20',
            'conversion_rate' => 'required|numeric|min:0.0001',
            'standard_cost_per_base_unit' => 'required|numeric|min:0',
            'min_stock_alert_level' => 'required|numeric|min:0',
        ]);

        $material = RawMaterial::create([
            'company_id' => $company->id ?? 1,
            'sku' => strtoupper($validated['sku']),
            'name' => $validated['name'],
            'category' => $validated['category'],
            'base_uom' => $validated['base_uom'],
            'purchase_uom' => $validated['purchase_uom'],
            'conversion_rate' => $validated['conversion_rate'],
            'standard_cost_per_base_unit' => $validated['standard_cost_per_base_unit'],
            'min_stock_alert_level' => $validated['min_stock_alert_level'],
            'is_active' => true,
        ]);

        return redirect()->back()->with('success', "Raw Material '{$material->name}' added.");
    }

    public function update(Request $request, RawMaterial $rawMaterial)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'base_uom' => 'required|string|max:20',
            'purchase_uom' => 'required|string|max:20',
            'conversion_rate' => 'required|numeric|min:0.0001',
            'standard_cost_per_base_unit' => 'required|numeric|min:0',
            'min_stock_alert_level' => 'required|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $rawMaterial->update($validated);
        return redirect()->back()->with('success', "Raw Material '{$rawMaterial->name}' updated.");
    }

    public function adjustStock(Request $request)
    {
        $validated = $request->validate([
            'location_id' => 'required|exists:stock_locations,id',
            'raw_material_id' => 'required|exists:raw_materials,id',
            'quantity_on_hand' => 'required|numeric',
        ]);

        $balance = InventoryBalance::firstOrCreate(
            ['location_id' => $validated['location_id'], 'raw_material_id' => $validated['raw_material_id']],
            ['quantity_on_hand' => 0.0]
        );

        $balance->quantity_on_hand = $validated['quantity_on_hand'];
        $balance->save();

        return redirect()->back()->with('success', "Stock balance updated.");
    }
}
