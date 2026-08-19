<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->enum('fulfillment_status', ['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'])->default('PENDING')->after('order_status');
            $table->enum('dining_option', ['TAKEAWAY', 'DINE_IN'])->default('TAKEAWAY')->after('fulfillment_status');
            $table->timestamp('preparation_started_at')->nullable()->after('ordered_at');
            $table->timestamp('ready_at')->nullable()->after('preparation_started_at');
            $table->timestamp('completed_at')->nullable()->after('ready_at');
        });

        // Also add is_prepared boolean to order_items for line-item strike-through
        Schema::table('order_items', function (Blueprint $table) {
            $table->boolean('is_prepared')->default(false)->after('total_price');
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn('is_prepared');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'fulfillment_status',
                'dining_option',
                'preparation_started_at',
                'ready_at',
                'completed_at',
            ]);
        });
    }
};
