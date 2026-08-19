<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Kiosk extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'kiosk_code',
        'kiosk_name',
        'custom_logo_path',
        'device_uid',
        'api_token_hash',
        'kiosk_type',
        'status',
        'last_heartbeat_at',
        'app_version',
    ];

    protected $casts = [
        'last_heartbeat_at' => 'datetime',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function stockLocation(): HasOne
    {
        return $this->hasOne(StockLocation::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function attendancesIn(): HasMany
    {
        return $this->hasMany(Attendance::class, 'kiosk_id_in');
    }

    public function attendancesOut(): HasMany
    {
        return $this->hasMany(Attendance::class, 'kiosk_id_out');
    }
}
