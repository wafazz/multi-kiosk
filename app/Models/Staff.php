<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Staff extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $table = 'staff';

    protected $fillable = [
        'company_id',
        'primary_branch_id',
        'staff_code',
        'full_name',
        'email',
        'phone',
        'pin_hash',
        'password',
        'role',
        'salary_type',
        'hourly_rate',
        'daily_rate',
        'monthly_rate',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'pin_hash',
        'remember_token',
    ];

    protected $casts = [
        'hourly_rate' => 'decimal:2',
        'daily_rate' => 'decimal:2',
        'monthly_rate' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function primaryBranch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'primary_branch_id');
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function currentOpenAttendance(): HasOne
    {
        return $this->hasOne(Attendance::class)->where('status', 'OPEN')->latestOfMany('clock_in_at');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'SUPER_ADMIN';
    }

    public function isHQAdmin(): bool
    {
        return in_array($this->role, ['SUPER_ADMIN', 'HQ_ADMIN']);
    }

    public function isManager(): bool
    {
        return in_array($this->role, ['SUPER_ADMIN', 'HQ_ADMIN', 'BRANCH_MANAGER', 'KIOSK_MANAGER']);
    }
}
