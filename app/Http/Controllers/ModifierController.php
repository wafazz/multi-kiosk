<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\ModifierGroup;
use App\Models\ModifierOption;
use App\Models\ModifierOptionRecipe;
use App\Models\Product;
use App\Models\RawMaterial;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ModifierController extends Controller
{
    public function index(): Response
    {
        $company = Company::first();

        $groups = ModifierGroup::with(['options.recipes.rawMaterial', 'products'])
            ->where('company_id', $company->id ?? 1)
            ->get()
            ->map(function ($g) {
                return [
                    'id' => $g->id,
                    'name' => $g->name,
                    'selection_type' => $g->selection_type,
                    'is_required' => $g->is_required,
                    'min_selections' => $g->min_selections,
                    'max_selections' => $g->max_selections,
                    'is_active' => $g->is_active,
                    'products_count' => $g->products->count(),
                    'products' => $g->products->map(fn($p) => ['id' => $p->id, 'name' => $p->name, 'sku' => $p->sku]),
                    'options' => $g->options->map(function ($opt) {
                        $bomCost = $opt->calculateBomCost();
                        return [
                            'id' => $opt->id,
                            'name' => $opt->name,
                            'price_adjustment' => (float)$opt->price_adjustment,
                            'is_active' => $opt->is_active,
                            'calculated_bom_cost' => $bomCost,
                            'recipes' => $opt->recipes->map(function ($r) {
                                return [
                                    'id' => $r->id,
                                    'raw_material_id' => $r->raw_material_id,
                                    'raw_material_name' => $r->rawMaterial->name ?? 'Material',
                                    'base_uom' => $r->rawMaterial->base_uom ?? '',
                                    'quantity_required' => (float)$r->quantity_required,
                                    'unit_cost' => (float)($r->rawMaterial->standard_cost_per_base_unit ?? 0),
                                    'line_cost' => round((float)$r->quantity_required * (float)($r->rawMaterial->standard_cost_per_base_unit ?? 0), 3),
                                ];
                            }),
                        ];
                    }),
                ];
            });

        $products = Product::where('company_id', $company->id ?? 1)->where('is_active', true)->get(['id', 'name', 'sku', 'category']);
        $rawMaterials = RawMaterial::where('company_id', $company->id ?? 1)->where('is_active', true)->get(['id', 'name', 'sku', 'base_uom', 'standard_cost_per_base_unit']);

        return Inertia::render('Modifiers/Index', [
            'modifierGroups' => $groups,
            'products' => $products,
            'rawMaterials' => $rawMaterials,
        ]);
    }

    public function storeGroup(Request $request)
    {
        $company = Company::first();
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'selection_type' => 'required|in:SINGLE,MULTIPLE',
            'is_required' => 'boolean',
            'min_selections' => 'integer|min:0',
            'max_selections' => 'integer|min:1',
            'product_ids' => 'nullable|array',
        ]);

        $group = ModifierGroup::create([
            'company_id' => $company->id ?? 1,
            'name' => $validated['name'],
            'selection_type' => $validated['selection_type'],
            'is_required' => $validated['is_required'] ?? false,
            'min_selections' => $validated['min_selections'] ?? 0,
            'max_selections' => $validated['max_selections'] ?? 1,
            'is_active' => true,
        ]);

        if (!empty($validated['product_ids'])) {
            $group->products()->sync($validated['product_ids']);
        }

        return redirect()->back()->with('success', "Modifier group '{$group->name}' created.");
    }

    public function updateGroup(Request $request, ModifierGroup $group)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'selection_type' => 'required|in:SINGLE,MULTIPLE',
            'is_required' => 'boolean',
            'min_selections' => 'integer|min:0',
            'max_selections' => 'integer|min:1',
            'product_ids' => 'nullable|array',
        ]);

        $group->update($validated);

        if (isset($validated['product_ids'])) {
            $group->products()->sync($validated['product_ids']);
        }

        return redirect()->back()->with('success', "Modifier group '{$group->name}' updated.");
    }

    public function destroyGroup(ModifierGroup $group)
    {
        $name = $group->name;
        $group->delete();
        return redirect()->back()->with('success', "Modifier group '{$name}' deleted.");
    }

    public function storeOption(Request $request)
    {
        $validated = $request->validate([
            'modifier_group_id' => 'required|exists:modifier_groups,id',
            'name' => 'required|string|max:255',
            'price_adjustment' => 'required|numeric|min:0',
            'recipes' => 'nullable|array',
            'recipes.*.raw_material_id' => 'required|exists:raw_materials,id',
            'recipes.*.quantity_required' => 'required|numeric|min:0.0001',
        ]);

        $option = ModifierOption::create([
            'modifier_group_id' => $validated['modifier_group_id'],
            'name' => $validated['name'],
            'price_adjustment' => $validated['price_adjustment'],
            'is_active' => true,
        ]);

        if (!empty($validated['recipes'])) {
            foreach ($validated['recipes'] as $recipe) {
                ModifierOptionRecipe::create([
                    'modifier_option_id' => $option->id,
                    'raw_material_id' => $recipe['raw_material_id'],
                    'quantity_required' => $recipe['quantity_required'],
                ]);
            }
        }

        return redirect()->back()->with('success', "Modifier option '{$option->name}' added with BOM recipe.");
    }

    public function syncOptionRecipe(Request $request, ModifierOption $option)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price_adjustment' => 'required|numeric|min:0',
            'recipes' => 'required|array',
            'recipes.*.raw_material_id' => 'required|exists:raw_materials,id',
            'recipes.*.quantity_required' => 'required|numeric|min:0.0001',
        ]);

        $option->update([
            'name' => $validated['name'],
            'price_adjustment' => $validated['price_adjustment'],
        ]);

        $option->recipes()->delete();

        foreach ($validated['recipes'] as $recipe) {
            ModifierOptionRecipe::create([
                'modifier_option_id' => $option->id,
                'raw_material_id' => $recipe['raw_material_id'],
                'quantity_required' => $recipe['quantity_required'],
            ]);
        }

        $bomCost = $option->calculateBomCost();
        return redirect()->back()->with('success', "BOM recipe updated for option '{$option->name}' (Add-on BOM Cost: RM {$bomCost}).");
    }

    public function destroyOption(ModifierOption $option)
    {
        $name = $option->name;
        $option->delete();
        return redirect()->back()->with('success', "Modifier option '{$name}' deleted.");
    }
}
