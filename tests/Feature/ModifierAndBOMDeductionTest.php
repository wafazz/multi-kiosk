<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Branch;
use App\Models\Company;
use App\Models\InventoryBalance;
use App\Models\Kiosk;
use App\Models\ModifierGroup;
use App\Models\ModifierOption;
use App\Models\ModifierOptionRecipe;
use App\Models\Product;
use App\Models\RawMaterial;
use App\Models\RecipeItem;
use App\Models\StockLocation;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ModifierAndBOMDeductionTest extends TestCase
{
    use RefreshDatabase;

    public function test_kiosk_order_with_modifiers_deducts_base_and_modifier_boms(): void
    {
        $company = Company::create(['name' => 'Demo Co', 'code' => 'DCO']);
        $branch = Branch::create(['company_id' => $company->id, 'name' => 'Main Branch', 'code' => 'MB01']);
        $kiosk = Kiosk::create([
            'branch_id' => $branch->id,
            'kiosk_code' => 'K01',
            'kiosk_name' => 'POS 01',
            'status' => 'ONLINE',
        ]);

        $kioskLocation = StockLocation::create([
            'company_id' => $company->id,
            'branch_id' => $branch->id,
            'kiosk_id' => $kiosk->id,
            'location_name' => 'Kiosk 01 Stockroom',
            'location_type' => 'KIOSK',
        ]);

        // Raw Material 1: Coffee Beans (1000g stock)
        $beans = RawMaterial::create([
            'company_id' => $company->id,
            'sku' => 'RM-BEANS',
            'name' => 'Arabica Coffee Beans',
            'category' => 'Coffee',
            'base_uom' => 'g',
            'purchase_uom' => 'kg',
            'conversion_rate' => 1000,
            'standard_cost_per_base_unit' => 0.0800,
        ]);
        InventoryBalance::create(['location_id' => $kioskLocation->id, 'raw_material_id' => $beans->id, 'quantity_on_hand' => 1000.0]);

        // Raw Material 2: Fresh Milk (5000ml stock)
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
        InventoryBalance::create(['location_id' => $kioskLocation->id, 'raw_material_id' => $milk->id, 'quantity_on_hand' => 5000.0]);

        // Product: Iced Latte (18g beans + 180ml milk)
        $latte = Product::create([
            'company_id' => $company->id,
            'sku' => 'LATTE-01',
            'name' => 'Iced Latte',
            'category' => 'Coffee',
            'selling_price' => 12.00,
            'cost_price' => 2.70,
        ]);
        RecipeItem::create(['product_id' => $latte->id, 'raw_material_id' => $beans->id, 'quantity_required' => 18.0]);
        RecipeItem::create(['product_id' => $latte->id, 'raw_material_id' => $milk->id, 'quantity_required' => 180.0]);

        // Modifier: Extra Espresso Shot (+RM 3.00, +18g beans)
        $modGroup = ModifierGroup::create([
            'company_id' => $company->id,
            'name' => 'Espresso Shots',
            'selection_type' => 'MULTIPLE',
        ]);
        $modGroup->products()->sync([$latte->id]);

        $extraShot = ModifierOption::create([
            'modifier_group_id' => $modGroup->id,
            'name' => 'Extra Espresso Shot (18g)',
            'price_adjustment' => 3.00,
        ]);
        ModifierOptionRecipe::create([
            'modifier_option_id' => $extraShot->id,
            'raw_material_id' => $beans->id,
            'quantity_required' => 18.0,
        ]);

        // Place POS Order: 1x Iced Latte with 1x Extra Shot
        // Total price = 12.00 + 3.00 = 15.00
        // Expected Coffee Beans Deduction = 18g (Base) + 18g (Modifier) = 36g
        // Expected Milk Deduction = 180ml
        $response = $this->postJson('/api/v1/kiosk/order', [
            'kiosk_id' => $kiosk->id,
            'payment_method' => 'CASH',
            'items' => [
                [
                    'product_id' => $latte->id,
                    'quantity' => 1,
                    'unit_price' => 15.00,
                    'modifiers' => [
                        [
                            'modifier_option_id' => $extraShot->id,
                            'name' => $extraShot->name,
                            'price_adjustment' => 3.00,
                        ],
                    ],
                ],
            ],
        ]);

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);

        // Check Bean Balance: 1000 - 36 = 964.0g
        $beanBalance = InventoryBalance::where('location_id', $kioskLocation->id)->where('raw_material_id', $beans->id)->first();
        $this->assertEquals(964.0, (float)$beanBalance->quantity_on_hand);

        // Check Milk Balance: 5000 - 180 = 4820.0ml
        $milkBalance = InventoryBalance::where('location_id', $kioskLocation->id)->where('raw_material_id', $milk->id)->first();
        $this->assertEquals(4820.0, (float)$milkBalance->quantity_on_hand);

        // Verify Order Item Modifier was recorded
        $this->assertDatabaseHas('order_item_modifiers', [
            'modifier_option_id' => $extraShot->id,
            'modifier_name_snapshot' => $extraShot->name,
            'price_adjustment_snapshot' => 3.00,
        ]);
    }
}
