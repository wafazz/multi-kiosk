<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Branch extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'name',
        'code',
        'address',
        'phone',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function kiosks(): HasMany
    {
        return $this->hasMany(Kiosk::class);
    }

    public function staff(): HasMany
    {
        return $this->hasMany(Staff::class, 'primary_branch_id');
    }

    public function stockLocations(): HasMany
    {
        return $this->hasMany(StockLocation::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
