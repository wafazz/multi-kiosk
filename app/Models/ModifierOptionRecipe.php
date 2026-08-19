<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ModifierOptionRecipe extends Model
{
    use HasFactory;

    protected $fillable = [
        'modifier_option_id',
        'raw_material_id',
        'quantity_required',
    ];

    protected $casts = [
        'quantity_required' => 'decimal:4',
    ];

    public function modifierOption(): BelongsTo
    {
        return $this->belongsTo(ModifierOption::class, 'modifier_option_id');
    }

    public function rawMaterial(): BelongsTo
    {
        return $this->belongsTo(RawMaterial::class, 'raw_material_id');
    }
}
