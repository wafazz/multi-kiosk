<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Company;
use App\Models\Product;
use App\Models\RawMaterial;
use App\Models\RecipeItem;
use Illuminate\Foundation\Testing\RefreshDatabase;

class BOMCalculationTest extends TestCase
{
    use RefreshDatabase;

    public function test_bom_dynamic_cost_calculation(): void
    {
        $company = Company::create([
            'name' => 'Test Coffee Co',
            'code' => 'TCC',
        ]);

        // Coffee Beans: RM 0.08 / gram
        $beans = RawMaterial::create([
            'company_id' => $company->id,
            'sku' => 'RM-BEANS',
            'name' => 'Arabica Beans',
            'category' => 'Coffee',
            'base_uom' => 'g',
            'purchase_uom' => 'kg',
            'conversion_rate' => 1000,
            'standard_cost_per_base_unit' => 0.0800,
        ]);

        // Milk: RM 0.007 / ml
        $milk = RawMaterial::create([
            'company_id' => $company->id,
            'sku' => 'RM-MILK',
            'name' => 'Fresh Milk',
            'category' => 'Dairy',
            'base_uom' => 'ml',
            'purchase_uom' => 'liter',
            'conversion_rate' => 1000,
            'standard_cost_per_base_unit' => 0.0070,
        ]);

        // Cold Cup: RM 0.45 / unit
        $cup = RawMaterial::create([
            'company_id' => $company->id,
            'sku' => 'RM-CUP',
            'name' => '16oz Cold Cup',
            'category' => 'Packaging',
            'base_uom' => 'unit',
            'purchase_uom' => 'sleeve',
            'conversion_rate' => 50,
            'standard_cost_per_base_unit' => 0.4500,
        ]);

        // Create Latte (18g beans = 1.44 + 180ml milk = 1.26 + 1 cup = 0.45 -> total = RM 3.15)
        $latte = Product::create([
            'company_id' => $company->id,
            'sku' => 'LATTE-16',
            'name' => 'Iced Latte 16oz',
            'category' => 'Beverage',
            'selling_price' => 12.00,
        ]);

        RecipeItem::create(['product_id' => $latte->id, 'raw_material_id' => $beans->id, 'quantity_required' => 18.0]);
        RecipeItem::create(['product_id' => $latte->id, 'raw_material_id' => $milk->id, 'quantity_required' => 180.0]);
        RecipeItem::create(['product_id' => $latte->id, 'raw_material_id' => $cup->id, 'quantity_required' => 1.0]);

        $calculatedCost = $latte->calculateBomCost();
        $this->assertEquals(3.15, $calculatedCost);
    }
}
