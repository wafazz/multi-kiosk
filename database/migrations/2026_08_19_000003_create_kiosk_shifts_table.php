<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kiosk_shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('kiosk_id')->constrained('kiosks')->cascadeOnDelete();
            $table->foreignId('opened_by_staff_id')->constrained('staff')->cascadeOnDelete();
            $table->foreignId('closed_by_staff_id')->nullable()->constrained('staff')->nullOnDelete();
            $table->timestamp('opened_at');
            $table->timestamp('closed_at')->nullable();
            $table->decimal('opening_cash_float', 10, 2)->default(0.00);
            $table->decimal('closing_cash_counted', 10, 2)->nullable();
            $table->decimal('expected_cash_total', 10, 2)->default(0.00);
            $table->decimal('cash_variance', 10, 2)->default(0.00); // counted - expected
            $table->decimal('total_sales_gross', 10, 2)->default(0.00);
            $table->decimal('total_tax_collected', 10, 2)->default(0.00);
            $table->decimal('total_discount_given', 10, 2)->default(0.00);
            $table->decimal('total_material_cost', 10, 2)->default(0.00);
            $table->decimal('total_cash_sales', 10, 2)->default(0.00);
            $table->decimal('total_card_sales', 10, 2)->default(0.00);
            $table->decimal('total_qr_sales', 10, 2)->default(0.00);
            $table->integer('total_orders_count')->default(0);
            $table->enum('status', ['OPEN', 'CLOSED', 'FORCE_CLOSED'])->default('OPEN');
            $table->text('closing_notes')->nullable();
            $table->timestamps();
        });

        // Add kiosk_shift_id to orders table
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('kiosk_shift_id')->nullable()->after('kiosk_id')->constrained('kiosk_shifts')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['kiosk_shift_id']);
            $table->dropColumn('kiosk_shift_id');
        });
        Schema::dropIfExists('kiosk_shifts');
    }
};
