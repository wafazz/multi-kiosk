<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ModifierOption extends Model
{
    use HasFactory;

    protected $fillable = [
        'modifier_group_id',
        'name',
        'price_adjustment',
        'is_active',
    ];

    protected $casts = [
        'price_adjustment' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function group(): BelongsTo
    {
        return $this->belongsTo(ModifierGroup::class, 'modifier_group_id');
    }

    public function recipes(): HasMany
    {
        return $this->hasMany(ModifierOptionRecipe::class, 'modifier_option_id');
    }

    public function calculateBomCost(): float
    {
        $cost = 0.0;
        foreach ($this->recipes()->with('rawMaterial')->get() as $recipe) {
            if ($recipe->rawMaterial) {
                $cost += (float)$recipe->quantity_required * (float)$recipe->rawMaterial->standard_cost_per_base_unit;
            }
        }
        return round($cost, 3);
    }
}
