<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Company;
use App\Models\Staff;
use App\Services\AttendanceService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

class HourlyWageCalculationTest extends TestCase
{
    use RefreshDatabase;

    public function test_15_minute_rounding_and_hourly_wage_calculation(): void
    {
        $attendanceService = new AttendanceService();

        // Test Rounding Engine:
        // 512 minutes (8h 32m) -> rounds to 510 minutes (8.5 hours)
        $this->assertEquals(510, $attendanceService->calculatePayableMinutes(512));

        // 485 minutes (8h 5m) -> rounds to 480 minutes (8.0 hours)
        $this->assertEquals(480, $attendanceService->calculatePayableMinutes(485));

        // 488 minutes (8h 8m) -> rounds to 495 minutes (8.25 hours)
        $this->assertEquals(495, $attendanceService->calculatePayableMinutes(488));

        $company = Company::create([
            'name' => 'Test Company',
            'code' => 'TC',
        ]);

        $hourlyStaff = Staff::create([
            'company_id' => $company->id,
            'staff_code' => 'STF-TEST',
            'full_name' => 'Ali Barista',
            'pin_hash' => Hash::make('1234'),
            'role' => 'STAFF',
            'salary_type' => 'HOURLY',
            'hourly_rate' => 12.00,
        ]);

        // 480 payable minutes = 8 hours * RM 12 = RM 96.00
        $gross = $attendanceService->computeGrossEarnings($hourlyStaff, 480, 12.00);
        $this->assertEquals(96.00, $gross);

        // 510 payable minutes = 8.5 hours * RM 12 = RM 102.00
        $gross2 = $attendanceService->computeGrossEarnings($hourlyStaff, 510, 12.00);
        $this->assertEquals(102.00, $gross2);
    }
}
