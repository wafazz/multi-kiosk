<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Attendance;
use App\Models\Branch;
use App\Models\Company;
use App\Models\Kiosk;
use App\Models\Staff;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

class StaffAttendanceAndClockingTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_clock_in_and_clock_out_at_kiosk_with_pin(): void
    {
        $company = Company::create(['name' => 'Demo Co', 'code' => 'DCO']);
        $branch = Branch::create(['company_id' => $company->id, 'name' => 'Main Branch', 'code' => 'MB01']);
        $kiosk = Kiosk::create([
            'branch_id' => $branch->id,
            'kiosk_code' => 'K01',
            'kiosk_name' => 'POS 01',
        ]);

        $staff = Staff::create([
            'company_id' => $company->id,
            'staff_code' => 'STF-01',
            'full_name' => 'Hafiz',
            'pin_hash' => Hash::make('4321'),
            'role' => 'STAFF',
            'salary_type' => 'HOURLY',
            'hourly_rate' => 15.00,
        ]);

        // 1. Clock In
        $clockInResponse = $this->postJson('/api/v1/kiosk/clock', [
            'pin' => '4321',
            'kiosk_id' => $kiosk->id,
            'action' => 'AUTO',
        ]);

        $clockInResponse->assertStatus(200);
        $clockInResponse->assertJson([
            'success' => true,
            'action' => 'CLOCK_IN',
        ]);

        $this->assertDatabaseHas('attendances', [
            'staff_id' => $staff->id,
            'kiosk_id_in' => $kiosk->id,
            'status' => 'OPEN',
        ]);

        // 2. Clock Out
        $clockOutResponse = $this->postJson('/api/v1/kiosk/clock', [
            'pin' => '4321',
            'kiosk_id' => $kiosk->id,
            'action' => 'AUTO',
        ]);

        $clockOutResponse->assertStatus(200);
        $clockOutResponse->assertJson([
            'success' => true,
            'action' => 'CLOCK_OUT',
        ]);

        $this->assertDatabaseHas('attendances', [
            'staff_id' => $staff->id,
            'status' => 'COMPLETED',
        ]);
    }
}
