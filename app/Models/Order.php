<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'company_id',
        'branch_id',
        'kiosk_id',
        'kiosk_shift_id',
        'staff_id',
        'order_number',
        'total_amount',
        'discount_amount',
        'tax_amount',
        'net_amount',
        'total_material_cost',
        'payment_method',
        'billplz_bill_id',
        'billplz_url',
        'payment_gateway_reference',
        'payment_status',
        'order_status',
        'fulfillment_status',
        'dining_option',
        'ordered_at',
        'paid_at',
        'preparation_started_at',
        'ready_at',
        'completed_at',
    ];

    protected $casts = [
        'ordered_at' => 'datetime',
        'paid_at' => 'datetime',
        'preparation_started_at' => 'datetime',
        'ready_at' => 'datetime',
        'completed_at' => 'datetime',
        'total_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'net_amount' => 'decimal:2',
        'total_material_cost' => 'decimal:2',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

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

    public function shift(): BelongsTo
    {
        return $this->belongsTo(KioskShift::class, 'kiosk_shift_id');
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
