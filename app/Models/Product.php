<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'sku',
        'name',
        'category',
        'description',
        'selling_price',
        'cost_price',
        'image_url',
        'is_active',
    ];

    protected $casts = [
        'selling_price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function recipeItems(): HasMany
    {
        return $this->hasMany(RecipeItem::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Calculate BOM cost dynamically based on current raw material standard costs
     */
    public function calculateBomCost(): float
    {
        $cost = 0;
        foreach ($this->recipeItems()->with('rawMaterial')->get() as $item) {
            if ($item->rawMaterial) {
                $cost += (float)$item->quantity_required * (float)$item->rawMaterial->standard_cost_per_base_unit;
            }
        }
        return round($cost, 2);
    }
}
