<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_gateways', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('provider')->default('BILLPLZ'); // BILLPLZ, STRIPE, TOYYIBPAY
            $table->string('api_key')->nullable();
            $table->string('x_signature_key')->nullable();
            $table->string('collection_id')->nullable();
            $table->boolean('is_sandbox')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->string('billplz_bill_id')->nullable()->after('payment_method');
            $table->string('billplz_url')->nullable()->after('billplz_bill_id');
            $table->string('payment_gateway_reference')->nullable()->after('billplz_url');
            $table->timestamp('paid_at')->nullable()->after('ordered_at');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'billplz_bill_id',
                'billplz_url',
                'payment_gateway_reference',
                'paid_at',
            ]);
        });

        Schema::dropIfExists('payment_gateways');
    }
};
