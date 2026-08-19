<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RawMaterial extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'sku',
        'name',
        'category',
        'base_uom',
        'purchase_uom',
        'conversion_rate',
        'standard_cost_per_base_unit',
        'min_stock_alert_level',
        'is_active',
    ];

    protected $casts = [
        'conversion_rate' => 'decimal:4',
        'standard_cost_per_base_unit' => 'decimal:4',
        'min_stock_alert_level' => 'decimal:4',
        'is_active' => 'boolean',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function balances(): HasMany
    {
        return $this->hasMany(InventoryBalance::class);
    }

    public function recipeItems(): HasMany
    {
        return $this->hasMany(RecipeItem::class);
    }

    public function wastages(): HasMany
    {
        return $this->hasMany(Wastage::class);
    }
}
