<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Branch;
use App\Models\Company;
use App\Models\Kiosk;
use App\Models\KioskShift;
use App\Models\Order;
use App\Models\Staff;
use App\Services\ShiftService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

class ShiftManagementAndZReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_shift_lifecycle_with_opening_float_and_z_report_variance(): void
    {
        $company = Company::create(['name' => 'Demo Co', 'code' => 'DCO']);
        $branch = Branch::create(['company_id' => $company->id, 'name' => 'Main Branch', 'code' => 'MB01']);
        $kiosk = Kiosk::create([
            'branch_id' => $branch->id,
            'kiosk_code' => 'K01',
            'kiosk_name' => 'POS 01',
            'status' => 'ONLINE',
        ]);

        $staff = Staff::create([
            'company_id' => $company->id,
            'staff_code' => 'STF-01',
            'full_name' => 'Farhan Cashier',
            'pin_hash' => Hash::make('1234'),
            'role' => 'STAFF',
        ]);

        $shiftService = new ShiftService();

        // 1. Open shift with RM 200.00 cash float
        $shift = $shiftService->openShift($kiosk, $staff, 200.00, 'Morning shift opened');
        $this->assertEquals('OPEN', $shift->status);
        $this->assertEquals(200.00, (float)$shift->opening_cash_float);

        // 2. Process Cash Sale of Net RM 53.00
        Order::create([
            'company_id' => $company->id,
            'branch_id' => $branch->id,
            'kiosk_id' => $kiosk->id,
            'kiosk_shift_id' => $shift->id,
            'staff_id' => $staff->id,
            'order_number' => 'ORD-001',
            'total_amount' => 50.00,
            'tax_amount' => 3.00,
            'net_amount' => 53.00,
            'total_material_cost' => 12.00,
            'payment_method' => 'CASH',
            'payment_status' => 'PAID',
            'order_status' => 'COMPLETED',
            'ordered_at' => now(),
        ]);

        // 3. Process Card Sale of Net RM 31.80
        Order::create([
            'company_id' => $company->id,
            'branch_id' => $branch->id,
            'kiosk_id' => $kiosk->id,
            'kiosk_shift_id' => $shift->id,
            'staff_id' => $staff->id,
            'order_number' => 'ORD-002',
            'total_amount' => 30.00,
            'tax_amount' => 1.80,
            'net_amount' => 31.80,
            'total_material_cost' => 8.00,
            'payment_method' => 'CREDIT_CARD',
            'payment_status' => 'PAID',
            'order_status' => 'COMPLETED',
            'ordered_at' => now(),
        ]);

        // 4. Test Live X-Report Telemetry
        $xReport = $shiftService->computeLiveXReport($shift);
        $this->assertEquals(2, $xReport['total_orders_count']);
        $this->assertEquals(53.00, $xReport['cash_sales']);
        $this->assertEquals(31.80, $xReport['card_sales']);
        $this->assertEquals(253.00, $xReport['expected_cash_in_till']); // 200 float + 53 cash

        // 5. Close Shift with Blind Physical Cash Count of RM 250.00 (RM 3.00 shortage)
        $closedShift = $shiftService->closeShift($shift, $staff, 250.00, 'Till counted at shift close');
        $this->assertEquals('CLOSED', $closedShift->status);
        $this->assertEquals(253.00, (float)$closedShift->expected_cash_total);
        $this->assertEquals(250.00, (float)$closedShift->closing_cash_counted);
        $this->assertEquals(-3.00, (float)$closedShift->cash_variance);

        $this->assertDatabaseHas('kiosk_shifts', [
            'id' => $shift->id,
            'status' => 'CLOSED',
            'cash_variance' => -3.00,
        ]);
    }
}
