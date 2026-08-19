<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Modifier Groups (e.g. "Coffee Add-ons", "Milk Substitution", "Temperature/Size")
        Schema::create('modifier_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('name'); // e.g. "Extra Shots & Toppings"
            $table->enum('selection_type', ['SINGLE', 'MULTIPLE'])->default('MULTIPLE');
            $table->boolean('is_required')->default(false);
            $table->integer('min_selections')->default(0);
            $table->integer('max_selections')->default(5);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. Modifier Options (e.g. "Extra Espresso Shot", "Oat Milk Swap", "Caramel Drizzle")
        Schema::create('modifier_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('modifier_group_id')->constrained('modifier_groups')->cascadeOnDelete();
            $table->string('name');
            $table->decimal('price_adjustment', 10, 2)->default(0.00); // e.g. +RM 3.00
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 3. Modifier Option BOM Recipes (Linking Add-ons to Raw Material Deductions!)
        Schema::create('modifier_option_recipes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('modifier_option_id')->constrained('modifier_options')->cascadeOnDelete();
            $table->foreignId('raw_material_id')->constrained('raw_materials')->cascadeOnDelete();
            $table->decimal('quantity_required', 12, 4); // in raw material base_uom
            $table->timestamps();

            $table->unique(['modifier_option_id', 'raw_material_id']);
        });

        // 4. Product to Modifier Group Pivot (Mapping products to applicable modifier groups)
        Schema::create('product_modifier_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('modifier_group_id')->constrained('modifier_groups')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['product_id', 'modifier_group_id']);
        });

        // 5. Order Item Modifiers (Capturing applied add-ons on completed sales)
        Schema::create('order_item_modifiers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_item_id')->constrained('order_items')->cascadeOnDelete();
            $table->foreignId('modifier_option_id')->constrained('modifier_options')->cascadeOnDelete();
            $table->string('modifier_name_snapshot');
            $table->decimal('price_adjustment_snapshot', 10, 2)->default(0.00);
            $table->decimal('material_cost_snapshot', 10, 2)->default(0.00);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_item_modifiers');
        Schema::dropIfExists('product_modifier_groups');
        Schema::dropIfExists('modifier_option_recipes');
        Schema::dropIfExists('modifier_options');
        Schema::dropIfExists('modifier_groups');
    }
};
