<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockTransferItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'transfer_id',
        'raw_material_id',
        'quantity_requested',
        'quantity_dispatched',
        'quantity_received',
    ];

    protected $casts = [
        'quantity_requested' => 'decimal:4',
        'quantity_dispatched' => 'decimal:4',
        'quantity_received' => 'decimal:4',
    ];

    public function transfer(): BelongsTo
    {
        return $this->belongsTo(StockTransfer::class, 'transfer_id');
    }

    public function rawMaterial(): BelongsTo
    {
        return $this->belongsTo(RawMaterial::class);
    }
}
