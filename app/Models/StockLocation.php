<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockLocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'branch_id',
        'kiosk_id',
        'location_name',
        'location_type',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
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

    public function balances(): HasMany
    {
        return $this->hasMany(InventoryBalance::class, 'location_id');
    }

    public function wastages(): HasMany
    {
        return $this->hasMany(Wastage::class, 'location_id');
    }
}
