<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Product;
use App\Models\RawMaterial;
use App\Models\RecipeItem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductCatalogController extends Controller
{
    public function index(): Response
    {
        $company = Company::first();
        $products = Product::with(['recipeItems.rawMaterial'])
            ->where('company_id', $company->id ?? 1)
            ->get()
            ->map(function ($p) {
                $bomCost = 0.0;
                $ingredients = [];

                foreach ($p->recipeItems as $r) {
                    if ($r->rawMaterial) {
                        $cost = (float)$r->quantity_required * (float)$r->rawMaterial->standard_cost_per_base_unit;
                        $bomCost += $cost;
                        $ingredients[] = [
                            'id' => $r->id,
                            'raw_material_id' => $r->raw_material_id,
                            'raw_material_name' => $r->rawMaterial->name,
                            'base_uom' => $r->rawMaterial->base_uom,
                            'quantity_required' => (float)$r->quantity_required,
                            'unit_cost' => (float)$r->rawMaterial->standard_cost_per_base_unit,
                            'line_cost' => round($cost, 3),
                        ];
                    }
                }

                $sellingPrice = (float)$p->selling_price;
                $grossMargin = $sellingPrice > 0 ? round((($sellingPrice - $bomCost) / $sellingPrice) * 100, 1) : 0;

                return [
                    'id' => $p->id,
                    'sku' => $p->sku,
                    'name' => $p->name,
                    'category' => $p->category,
                    'description' => $p->description,
                    'selling_price' => $sellingPrice,
                    'cost_price' => round($bomCost, 2),
                    'gross_margin_percent' => $grossMargin,
                    'image_url' => $p->image_url,
                    'is_active' => $p->is_active,
                    'ingredients' => $ingredients,
                ];
            });

        $rawMaterials = RawMaterial::where('company_id', $company->id ?? 1)
            ->where('is_active', true)
            ->get(['id', 'sku', 'name', 'category', 'base_uom', 'standard_cost_per_base_unit']);

        return Inertia::render('Products/Index', [
            'products' => $products,
            'rawMaterials' => $rawMaterials,
        ]);
    }

    public function storeProduct(Request $request)
    {
        $company = Company::first();
        $validated = $request->validate([
            'sku' => 'required|string|max:100',
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'description' => 'nullable|string',
            'selling_price' => 'required|numeric|min:0',
            'image_url' => 'nullable|string',
        ]);

        $product = Product::create([
            'company_id' => $company->id ?? 1,
            'sku' => strtoupper($validated['sku']),
            'name' => $validated['name'],
            'category' => $validated['category'],
            'description' => $validated['description'] ?? null,
            'selling_price' => $validated['selling_price'],
            'cost_price' => 0.00,
            'image_url' => $validated['image_url'] ?? null,
            'is_active' => true,
        ]);

        return redirect()->back()->with('success', "Product '{$product->name}' created successfully.");
    }

    public function updateProduct(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'description' => 'nullable|string',
            'selling_price' => 'required|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $product->update($validated);
        return redirect()->back()->with('success', "Product '{$product->name}' updated.");
    }

    public function syncRecipe(Request $request, Product $product)
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.raw_material_id' => 'required|exists:raw_materials,id',
            'items.*.quantity_required' => 'required|numeric|min:0.0001',
        ]);

        // Clear existing items and repopulate
        $product->recipeItems()->delete();

        foreach ($validated['items'] as $item) {
            RecipeItem::create([
                'product_id' => $product->id,
                'raw_material_id' => $item['raw_material_id'],
                'quantity_required' => $item['quantity_required'],
            ]);
        }

        // Recalculate and update cost price snapshot
        $bomCost = $product->calculateBomCost();
        $product->cost_price = $bomCost;
        $product->save();

        return redirect()->back()->with('success', "Recipe BOM updated for '{$product->name}' (Calculated Unit Cost: RM {$bomCost}).");
    }

    public function destroyProduct(Product $product)
    {
        $name = $product->name;
        $product->delete();
        return redirect()->back()->with('success', "Product '{$name}' deleted successfully.");
    }
}
