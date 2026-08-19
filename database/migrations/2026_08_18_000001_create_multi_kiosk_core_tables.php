<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Companies (Tenants / Organization & Branding)
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('name');
            $table->string('code', 50)->unique();
            $table->string('logo_path')->nullable();
            $table->string('brand_primary_color', 50)->default('#2563eb');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. Branches (Physical Business Locations)
        Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('name');
            $table->string('code', 50);
            $table->text('address')->nullable();
            $table->string('phone', 50)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['company_id', 'code']);
        });

        // 3. Kiosks (Physical Hardware Terminals)
        Schema::create('kiosks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->string('kiosk_code', 50);
            $table->string('kiosk_name');
            $table->string('custom_logo_path')->nullable();
            $table->string('device_uid')->nullable()->unique();
            $table->string('api_token_hash')->nullable();
            $table->enum('kiosk_type', ['COUNTER_POS', 'CUSTOMER_SELF_SERVICE', 'HYBRID'])->default('COUNTER_POS');
            $table->enum('status', ['ONLINE', 'OFFLINE', 'MAINTENANCE', 'INACTIVE'])->default('INACTIVE');
            $table->timestamp('last_heartbeat_at')->nullable();
            $table->string('app_version', 50)->nullable();
            $table->timestamps();

            $table->unique(['branch_id', 'kiosk_code']);
        });

        // 4. Staff & Workers
        Schema::create('staff', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('primary_branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->string('staff_code', 50);
            $table->string('full_name');
            $table->string('email')->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('pin_hash');
            $table->string('password')->nullable();
            $table->enum('role', ['SUPER_ADMIN', 'HQ_ADMIN', 'BRANCH_MANAGER', 'KIOSK_MANAGER', 'STAFF', 'FINANCE'])->default('STAFF');
            $table->enum('salary_type', ['HOURLY', 'DAILY', 'MONTHLY', 'NONE'])->default('NONE');
            $table->decimal('hourly_rate', 10, 2)->default(0.00);
            $table->decimal('daily_rate', 10, 2)->default(0.00);
            $table->decimal('monthly_rate', 10, 2)->default(0.00);
            $table->boolean('is_active')->default(true);
            $table->rememberToken();
            $table->timestamps();

            $table->unique(['company_id', 'staff_code']);
        });

        // 5. Attendances & Shift Timekeeping
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('staff_id')->constrained('staff')->cascadeOnDelete();
            $table->foreignId('kiosk_id_in')->constrained('kiosks')->cascadeOnDelete();
            $table->foreignId('kiosk_id_out')->nullable()->constrained('kiosks')->nullOnDelete();
            $table->timestamp('clock_in_at');
            $table->timestamp('clock_out_at')->nullable();
            $table->integer('raw_duration_minutes')->default(0);
            $table->integer('payable_duration_minutes')->default(0);
            $table->decimal('hourly_rate_snapshot', 10, 2)->default(0.00);
            $table->decimal('gross_earnings', 10, 2)->default(0.00);
            $table->enum('status', ['OPEN', 'COMPLETED', 'AUTO_CLOSED', 'ADJUSTED'])->default('OPEN');
            $table->foreignId('adjusted_by')->nullable()->constrained('staff')->nullOnDelete();
            $table->text('adjustment_reason')->nullable();
            $table->timestamps();

            $table->index(['staff_id', 'clock_in_at']);
        });

        // 6. Raw Materials Master (Inventory Catalog)
        Schema::create('raw_materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('sku', 100);
            $table->string('name');
            $table->string('category', 100);
            $table->string('base_uom', 20);           // e.g. 'g', 'ml', 'unit'
            $table->string('purchase_uom', 20);       // e.g. 'kg', 'liter', 'box'
            $table->decimal('conversion_rate', 12, 4); // 1 purchase_uom = conversion_rate * base_uom (e.g. 1000)
            $table->decimal('standard_cost_per_base_unit', 12, 4)->default(0.0000);
            $table->decimal('min_stock_alert_level', 12, 4)->default(0.0000);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['company_id', 'sku']);
        });

        // 7. Stock Locations (Central Warehouses, Branch Stockrooms, Kiosk Stockrooms)
        Schema::create('stock_locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignId('kiosk_id')->nullable()->constrained('kiosks')->nullOnDelete();
            $table->string('location_name');
            $table->enum('location_type', ['CENTRAL_WAREHOUSE', 'BRANCH_STORE', 'KIOSK'])->default('KIOSK');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 8. Inventory Balances (Real-time stock ledger per location)
        Schema::create('inventory_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('location_id')->constrained('stock_locations')->cascadeOnDelete();
            $table->foreignId('raw_material_id')->constrained('raw_materials')->cascadeOnDelete();
            $table->decimal('quantity_on_hand', 14, 4)->default(0.0000); // Stored in base_uom
            $table->timestamps();

            $table->unique(['location_id', 'raw_material_id']);
        });

        // 9. Products (Sellable Catalog Items)
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('sku', 100);
            $table->string('name');
            $table->string('category', 100);
            $table->text('description')->nullable();
            $table->decimal('selling_price', 10, 2);
            $table->decimal('cost_price', 10, 2)->default(0.00);
            $table->string('image_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['company_id', 'sku']);
        });

        // 10. Recipe Items / Bill of Materials (BOM)
        Schema::create('recipe_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('raw_material_id')->constrained('raw_materials')->cascadeOnDelete();
            $table->decimal('quantity_required', 12, 4); // in raw material base_uom
            $table->timestamps();

            $table->unique(['product_id', 'raw_material_id']);
        });

        // 11. Orders (POS Sales Transactions)
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('kiosk_id')->constrained('kiosks')->cascadeOnDelete();
            $table->foreignId('staff_id')->nullable()->constrained('staff')->nullOnDelete();
            $table->string('order_number', 100);
            $table->decimal('total_amount', 10, 2);
            $table->decimal('discount_amount', 10, 2)->default(0.00);
            $table->decimal('tax_amount', 10, 2)->default(0.00);
            $table->decimal('net_amount', 10, 2);
            $table->decimal('total_material_cost', 10, 2)->default(0.00);
            $table->enum('payment_method', ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'E_WALLET', 'QR_PAY', 'OTHER'])->default('CASH');
            $table->enum('payment_status', ['PENDING', 'PAID', 'REFUNDED', 'VOID'])->default('PAID');
            $table->enum('order_status', ['COMPLETED', 'CANCELLED'])->default('COMPLETED');
            $table->timestamp('ordered_at');
            $table->timestamps();

            $table->index(['kiosk_id', 'ordered_at']);
            $table->index(['branch_id', 'ordered_at']);
        });

        // 12. Order Items
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->integer('quantity')->default(1);
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_price', 10, 2);
            $table->decimal('unit_cost_snapshot', 10, 2)->default(0.00);
            $table->timestamps();
        });

        // 13. Stock Transfers
        Schema::create('stock_transfers', function (Blueprint $table) {
            $table->id();
            $table->string('transfer_number', 100)->unique();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('source_location_id')->constrained('stock_locations')->cascadeOnDelete();
            $table->foreignId('dest_location_id')->constrained('stock_locations')->cascadeOnDelete();
            $table->foreignId('requested_by')->constrained('staff')->cascadeOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('staff')->nullOnDelete();
            $table->foreignId('dispatched_by')->nullable()->constrained('staff')->nullOnDelete();
            $table->foreignId('received_by')->nullable()->constrained('staff')->nullOnDelete();
            $table->enum('status', ['REQUESTED', 'APPROVED', 'DISPATCHED', 'RECEIVED', 'CANCELLED'])->default('REQUESTED');
            $table->text('notes')->nullable();
            $table->timestamp('dispatched_at')->nullable();
            $table->timestamp('received_at')->nullable();
            $table->timestamps();
        });

        // 14. Stock Transfer Line Items
        Schema::create('stock_transfer_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transfer_id')->constrained('stock_transfers')->cascadeOnDelete();
            $table->foreignId('raw_material_id')->constrained('raw_materials')->cascadeOnDelete();
            $table->decimal('quantity_requested', 14, 4);
            $table->decimal('quantity_dispatched', 14, 4)->nullable();
            $table->decimal('quantity_received', 14, 4)->nullable();
            $table->timestamps();
        });

        // 15. Wastage Logging
        Schema::create('wastages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('location_id')->constrained('stock_locations')->cascadeOnDelete();
            $table->foreignId('staff_id')->constrained('staff')->cascadeOnDelete();
            $table->foreignId('raw_material_id')->constrained('raw_materials')->cascadeOnDelete();
            $table->decimal('quantity', 14, 4); // in base_uom
            $table->decimal('cost_impact', 10, 2);
            $table->enum('reason', ['EXPIRED', 'DAMAGED_TRANSIT', 'SPILLAGE_PREP', 'DEFECTIVE_BATCH', 'WRONG_ORDER_REMAKE', 'OTHER'])->default('OTHER');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 16. Audit Logs
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('staff_id')->nullable()->constrained('staff')->nullOnDelete();
            $table->string('action', 100);
            $table->string('entity_type', 100);
            $table->string('entity_id', 100);
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'entity_type', 'entity_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('wastages');
        Schema::dropIfExists('stock_transfer_items');
        Schema::dropIfExists('stock_transfers');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('recipe_items');
        Schema::dropIfExists('products');
        Schema::dropIfExists('inventory_balances');
        Schema::dropIfExists('stock_locations');
        Schema::dropIfExists('raw_materials');
        Schema::dropIfExists('attendances');
        Schema::dropIfExists('staff');
        Schema::dropIfExists('kiosks');
        Schema::dropIfExists('branches');
        Schema::dropIfExists('companies');
    }
};
