<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Kiosk;
use App\Models\Staff;
use App\Models\AuditLog;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;
use Exception;

class AttendanceService
{
    /**
     * Verify staff PIN and retrieve staff record.
     */
    public function verifyPin(string $pin, ?int $companyId = null): ?Staff
    {
        $query = Staff::where('is_active', true);
        if ($companyId) {
            $query->where('company_id', $companyId);
        }

        $allStaff = $query->get();
        foreach ($allStaff as $staff) {
            if (Hash::check($pin, $staff->pin_hash) || $pin === $staff->pin_hash) {
                return $staff;
            }
        }

        return null;
    }

    /**
     * Clock in staff at a physical kiosk.
     */
    public function clockIn(Staff $staff, Kiosk $kiosk): Attendance
    {
        // Check if an open shift already exists
        $existing = Attendance::where('staff_id', $staff->id)
            ->where('status', 'OPEN')
            ->first();

        if ($existing) {
            throw new Exception("Staff member {$staff->full_name} is already clocked in since {$existing->clock_in_at->format('Y-m-d H:i')} at Kiosk {$existing->kioskIn->kiosk_name}.");
        }

        $hourlySnapshot = $staff->salary_type === 'HOURLY' ? (float)$staff->hourly_rate : 0.00;

        $attendance = Attendance::create([
            'company_id' => $staff->company_id,
            'staff_id' => $staff->id,
            'kiosk_id_in' => $kiosk->id,
            'kiosk_id_out' => null,
            'clock_in_at' => now(),
            'clock_out_at' => null,
            'raw_duration_minutes' => 0,
            'payable_duration_minutes' => 0,
            'hourly_rate_snapshot' => $hourlySnapshot,
            'gross_earnings' => 0.00,
            'status' => 'OPEN',
        ]);

        AuditLog::log(
            $staff->company_id,
            'STAFF_CLOCK_IN',
            'Attendance',
            (string)$attendance->id,
            null,
            ['kiosk_id' => $kiosk->id, 'clock_in_at' => $attendance->clock_in_at],
            $staff->id
        );

        return $attendance;
    }

    /**
     * Clock out staff at a physical kiosk (supports cross-kiosk roaming).
     */
    public function clockOut(Staff $staff, Kiosk $kiosk, ?Carbon $clockOutTime = null): Attendance
    {
        $attendance = Attendance::where('staff_id', $staff->id)
            ->where('status', 'OPEN')
            ->latest('clock_in_at')
            ->first();

        if (!$attendance) {
            throw new Exception("No active open shift found for {$staff->full_name}. Please clock in first.");
        }

        $clockOut = $clockOutTime ?? now();
        $clockIn = Carbon::parse($attendance->clock_in_at);

        $rawMinutes = max(0, $clockIn->diffInMinutes($clockOut));
        $payableMinutes = $this->calculatePayableMinutes($rawMinutes);
        $grossEarnings = $this->computeGrossEarnings($staff, $payableMinutes, (float)$attendance->hourly_rate_snapshot);

        $attendance->update([
            'kiosk_id_out' => $kiosk->id,
            'clock_out_at' => $clockOut,
            'raw_duration_minutes' => $rawMinutes,
            'payable_duration_minutes' => $payableMinutes,
            'gross_earnings' => $grossEarnings,
            'status' => 'COMPLETED',
        ]);

        AuditLog::log(
            $staff->company_id,
            'STAFF_CLOCK_OUT',
            'Attendance',
            (string)$attendance->id,
            ['status' => 'OPEN'],
            [
                'kiosk_id_out' => $kiosk->id,
                'clock_out_at' => $attendance->clock_out_at,
                'payable_duration_minutes' => $payableMinutes,
                'gross_earnings' => $grossEarnings,
            ],
            $staff->id
        );

        return $attendance;
    }

    /**
     * Standard 15-minute rounding engine for workforce payable minutes.
     */
    public function calculatePayableMinutes(int $rawMinutes, int $roundingStep = 15): int
    {
        if ($rawMinutes <= 0) return 0;
        // Round to nearest 15 minutes: (e.g., 512 mins -> 510 mins = 8.5 hrs)
        $rounded = round($rawMinutes / $roundingStep) * $roundingStep;
        return (int) $rounded;
    }

    /**
     * Compute gross earnings based on staff salary type and payable duration.
     */
    public function computeGrossEarnings(Staff $staff, int $payableMinutes, float $rateSnapshot): float
    {
        if ($staff->salary_type === 'HOURLY') {
            $hours = $payableMinutes / 60.0;
            return round($hours * $rateSnapshot, 2);
        }

        if ($staff->salary_type === 'DAILY') {
            return round((float)$staff->daily_rate, 2);
        }

        return 0.00;
    }

    /**
     * Manager manual attendance adjustment with audit trail.
     */
    public function adjustAttendance(
        Attendance $attendance,
        Carbon $newClockIn,
        Carbon $newClockOut,
        int $adjustedByStaffId,
        string $reason
    ): Attendance {
        $oldState = $attendance->toArray();

        $rawMinutes = max(0, $newClockIn->diffInMinutes($newClockOut));
        $payableMinutes = $this->calculatePayableMinutes($rawMinutes);
        $grossEarnings = $this->computeGrossEarnings($attendance->staff, $payableMinutes, (float)$attendance->hourly_rate_snapshot);

        $attendance->update([
            'clock_in_at' => $newClockIn,
            'clock_out_at' => $newClockOut,
            'raw_duration_minutes' => $rawMinutes,
            'payable_duration_minutes' => $payableMinutes,
            'gross_earnings' => $grossEarnings,
            'status' => 'ADJUSTED',
            'adjusted_by' => $adjustedByStaffId,
            'adjustment_reason' => $reason,
        ]);

        AuditLog::log(
            $attendance->company_id,
            'ATTENDANCE_MANUAL_ADJUSTMENT',
            'Attendance',
            (string)$attendance->id,
            $oldState,
            $attendance->toArray(),
            $adjustedByStaffId
        );

        return $attendance;
    }
}
