<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'staff_id',
        'kiosk_id_in',
        'kiosk_id_out',
        'clock_in_at',
        'clock_out_at',
        'raw_duration_minutes',
        'payable_duration_minutes',
        'hourly_rate_snapshot',
        'gross_earnings',
        'status',
        'adjusted_by',
        'adjustment_reason',
    ];

    protected $casts = [
        'clock_in_at' => 'datetime',
        'clock_out_at' => 'datetime',
        'raw_duration_minutes' => 'integer',
        'payable_duration_minutes' => 'integer',
        'hourly_rate_snapshot' => 'decimal:2',
        'gross_earnings' => 'decimal:2',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class);
    }

    public function kioskIn(): BelongsTo
    {
        return $this->belongsTo(Kiosk::class, 'kiosk_id_in');
    }

    public function kioskOut(): BelongsTo
    {
        return $this->belongsTo(Kiosk::class, 'kiosk_id_out');
    }

    public function adjuster(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'adjusted_by');
    }
}
