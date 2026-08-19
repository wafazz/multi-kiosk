<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KioskShift extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'branch_id',
        'kiosk_id',
        'opened_by_staff_id',
        'closed_by_staff_id',
        'opened_at',
        'closed_at',
        'opening_cash_float',
        'closing_cash_counted',
        'expected_cash_total',
        'cash_variance',
        'total_sales_gross',
        'total_tax_collected',
        'total_discount_given',
        'total_material_cost',
        'total_cash_sales',
        'total_card_sales',
        'total_qr_sales',
        'total_orders_count',
        'status',
        'closing_notes',
    ];

    protected $casts = [
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
        'opening_cash_float' => 'decimal:2',
        'closing_cash_counted' => 'decimal:2',
        'expected_cash_total' => 'decimal:2',
        'cash_variance' => 'decimal:2',
        'total_sales_gross' => 'decimal:2',
        'total_tax_collected' => 'decimal:2',
        'total_discount_given' => 'decimal:2',
        'total_material_cost' => 'decimal:2',
        'total_cash_sales' => 'decimal:2',
        'total_card_sales' => 'decimal:2',
        'total_qr_sales' => 'decimal:2',
        'total_orders_count' => 'integer',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function kiosk(): BelongsTo
    {
        return $this->belongsTo(Kiosk::class);
    }

    public function openedByStaff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'opened_by_staff_id');
    }

    public function closedByStaff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'closed_by_staff_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'kiosk_shift_id');
    }
}
