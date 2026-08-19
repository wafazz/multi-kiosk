<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockTransfer extends Model
{
    use HasFactory;

    protected $fillable = [
        'transfer_number',
        'company_id',
        'source_location_id',
        'dest_location_id',
        'requested_by',
        'approved_by',
        'dispatched_by',
        'received_by',
        'status',
        'notes',
        'dispatched_at',
        'received_at',
    ];

    protected $casts = [
        'dispatched_at' => 'datetime',
        'received_at' => 'datetime',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function sourceLocation(): BelongsTo
    {
        return $this->belongsTo(StockLocation::class, 'source_location_id');
    }

    public function destLocation(): BelongsTo
    {
        return $this->belongsTo(StockLocation::class, 'dest_location_id');
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'requested_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'approved_by');
    }

    public function dispatcher(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'dispatched_by');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'received_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(StockTransferItem::class, 'transfer_id');
    }
}
