<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\Branch;
use App\Models\Company;
use App\Models\InventoryBalance;
use App\Models\Kiosk;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\RawMaterial;
use App\Models\RecipeItem;
use App\Models\Staff;
use App\Models\StockLocation;
use App\Models\StockTransfer;
use App\Models\StockTransferItem;
use App\Models\Wastage;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Company
        $company = Company::create([
            'uuid' => (string) Str::uuid(),
            'name' => 'Artisan Coffee & Bakery Co.',
            'code' => 'ACBC',
            'brand_primary_color' => '#2563eb',
            'is_active' => true,
        ]);

        // 2. Branches
        $branchPavilion = Branch::create([
            'company_id' => $company->id,
            'name' => 'Pavilion Kuala Lumpur',
            'code' => 'PVKL',
            'address' => 'Level 1, Pavilion KL, Bukit Bintang, 55100 Kuala Lumpur',
            'phone' => '+60 3-2148 8888',
            'is_active' => true,
        ]);

        $branchMidValley = Branch::create([
            'company_id' => $company->id,
            'name' => 'Mid Valley Megamall',
            'code' => 'MVKL',
            'address' => 'LG Floor, Mid Valley Megamall, Lingkaran Syed Putra, 59200 Kuala Lumpur',
            'phone' => '+60 3-2289 9999',
            'is_active' => true,
        ]);

        // 3. Stock Locations
        $locCentral = StockLocation::create([
            'company_id' => $company->id,
            'location_name' => 'Central Supply Depot - Shah Alam',
            'location_type' => 'CENTRAL_WAREHOUSE',
            'is_active' => true,
        ]);

        $locPavilionStore = StockLocation::create([
            'company_id' => $company->id,
            'branch_id' => $branchPavilion->id,
            'location_name' => 'Pavilion KL Main Store',
            'location_type' => 'BRANCH_STORE',
            'is_active' => true,
        ]);

        $locMidValleyStore = StockLocation::create([
            'company_id' => $company->id,
            'branch_id' => $branchMidValley->id,
            'location_name' => 'Mid Valley Main Store',
            'location_type' => 'BRANCH_STORE',
            'is_active' => true,
        ]);

        // 4. Kiosks
        $kioskPav1 = Kiosk::create([
            'branch_id' => $branchPavilion->id,
            'kiosk_code' => 'K01-PV',
            'kiosk_name' => 'Pavilion Counter POS 01',
            'device_uid' => 'KIOSK-PV01-HW992',
            'api_token_hash' => hash('sha256', 'token-pv01'),
            'kiosk_type' => 'COUNTER_POS',
            'status' => 'ONLINE',
            'last_heartbeat_at' => now(),
            'app_version' => '1.0.0',
        ]);

        $kioskPav2 = Kiosk::create([
            'branch_id' => $branchPavilion->id,
            'kiosk_code' => 'K02-PV',
            'kiosk_name' => 'Pavilion Self-Order 02',
            'device_uid' => 'KIOSK-PV02-HW993',
            'api_token_hash' => hash('sha256', 'token-pv02'),
            'kiosk_type' => 'CUSTOMER_SELF_SERVICE',
            'status' => 'ONLINE',
            'last_heartbeat_at' => now(),
            'app_version' => '1.0.0',
        ]);

        $kioskMv1 = Kiosk::create([
            'branch_id' => $branchMidValley->id,
            'kiosk_code' => 'K01-MV',
            'kiosk_name' => 'Mid Valley Counter POS 01',
            'device_uid' => 'KIOSK-MV01-HW994',
            'api_token_hash' => hash('sha256', 'token-mv01'),
            'kiosk_type' => 'COUNTER_POS',
            'status' => 'ONLINE',
            'last_heartbeat_at' => now(),
            'app_version' => '1.0.0',
        ]);

        $kioskMv2 = Kiosk::create([
            'branch_id' => $branchMidValley->id,
            'kiosk_code' => 'K02-MV',
            'kiosk_name' => 'Mid Valley Express 02',
            'device_uid' => 'KIOSK-MV02-HW995',
            'api_token_hash' => hash('sha256', 'token-mv02'),
            'kiosk_type' => 'HYBRID',
            'status' => 'ONLINE',
            'last_heartbeat_at' => now(),
            'app_version' => '1.0.0',
        ]);

        // Kiosk Stockrooms
        $locPav1Stock = StockLocation::create([
            'company_id' => $company->id,
            'branch_id' => $branchPavilion->id,
            'kiosk_id' => $kioskPav1->id,
            'location_name' => 'Pavilion POS 01 Stockroom',
            'location_type' => 'KIOSK',
            'is_active' => true,
        ]);

        $locPav2Stock = StockLocation::create([
            'company_id' => $company->id,
            'branch_id' => $branchPavilion->id,
            'kiosk_id' => $kioskPav2->id,
            'location_name' => 'Pavilion Self-Order 02 Stockroom',
            'location_type' => 'KIOSK',
            'is_active' => true,
        ]);

        $locMv1Stock = StockLocation::create([
            'company_id' => $company->id,
            'branch_id' => $branchMidValley->id,
            'kiosk_id' => $kioskMv1->id,
            'location_name' => 'Mid Valley POS 01 Stockroom',
            'location_type' => 'KIOSK',
            'is_active' => true,
        ]);

        // 5. Raw Materials Master
        $materialsData = [
            ['sku' => 'RM-COF-01', 'name' => 'Espresso Beans (Arabica Blend)', 'category' => 'Coffee Beans & Tea', 'base_uom' => 'g', 'purchase_uom' => 'kg', 'conv' => 1000, 'cost' => 0.0800, 'alert' => 500],
            ['sku' => 'RM-MLK-01', 'name' => 'Fresh Whole Milk', 'category' => 'Dairy & Milk', 'base_uom' => 'ml', 'purchase_uom' => 'liter', 'conv' => 1000, 'cost' => 0.0070, 'alert' => 2000],
            ['sku' => 'RM-MLK-02', 'name' => 'Oat Milk (Barista Edition)', 'category' => 'Dairy & Milk', 'base_uom' => 'ml', 'purchase_uom' => 'liter', 'conv' => 1000, 'cost' => 0.0120, 'alert' => 1000],
            ['sku' => 'RM-SYR-01', 'name' => 'Vanilla Syrup', 'category' => 'Syrups & Flavorings', 'base_uom' => 'ml', 'purchase_uom' => 'bottle', 'conv' => 750, 'cost' => 0.0400, 'alert' => 200],
            ['sku' => 'RM-SYR-02', 'name' => 'Caramel Sauce', 'category' => 'Syrups & Flavorings', 'base_uom' => 'ml', 'purchase_uom' => 'bottle', 'conv' => 1000, 'cost' => 0.0350, 'alert' => 300],
            ['sku' => 'RM-CUP-16', 'name' => '16oz Cold Cup & Lid', 'category' => 'Packaging & Cups', 'base_uom' => 'unit', 'purchase_uom' => 'sleeve', 'conv' => 50, 'cost' => 0.4500, 'alert' => 50],
            ['sku' => 'RM-CUP-12', 'name' => '12oz Hot Cup & Lid', 'category' => 'Packaging & Cups', 'base_uom' => 'unit', 'purchase_uom' => 'sleeve', 'conv' => 50, 'cost' => 0.4000, 'alert' => 50],
            ['sku' => 'RM-STR-01', 'name' => 'Paper Straw', 'category' => 'Packaging & Cups', 'base_uom' => 'unit', 'purchase_uom' => 'pack', 'conv' => 200, 'cost' => 0.0500, 'alert' => 100],
            ['sku' => 'RM-CR-01', 'name' => 'Butter Croissant Dough', 'category' => 'Bakery Ingredients', 'base_uom' => 'unit', 'purchase_uom' => 'box', 'conv' => 24, 'cost' => 2.5000, 'alert' => 12],
            ['sku' => 'RM-MUF-01', 'name' => 'Choc Chip Muffin Pre-mix', 'category' => 'Bakery Ingredients', 'base_uom' => 'unit', 'purchase_uom' => 'box', 'conv' => 12, 'cost' => 2.2000, 'alert' => 10],
        ];

        $rawMaterials = [];
        foreach ($materialsData as $m) {
            $rawMaterials[$m['sku']] = RawMaterial::create([
                'company_id' => $company->id,
                'sku' => $m['sku'],
                'name' => $m['name'],
                'category' => $m['category'],
                'base_uom' => $m['base_uom'],
                'purchase_uom' => $m['purchase_uom'],
                'conversion_rate' => $m['conv'],
                'standard_cost_per_base_unit' => $m['cost'],
                'min_stock_alert_level' => $m['alert'],
                'is_active' => true,
            ]);
        }

        // Seed stock balances
        foreach ($rawMaterials as $mat) {
            // Central Depot: High stock
            InventoryBalance::create([
                'location_id' => $locCentral->id,
                'raw_material_id' => $mat->id,
                'quantity_on_hand' => (float)$mat->conversion_rate * 50, // 50 purchase packs
            ]);

            // Kiosk 1 Stock: Operational stock
            InventoryBalance::create([
                'location_id' => $locPav1Stock->id,
                'raw_material_id' => $mat->id,
                'quantity_on_hand' => (float)$mat->conversion_rate * 5, // 5 purchase packs
            ]);

            // Kiosk 2 Stock: Operational stock
            InventoryBalance::create([
                'location_id' => $locMv1Stock->id,
                'raw_material_id' => $mat->id,
                'quantity_on_hand' => (float)$mat->conversion_rate * 4,
            ]);
        }

        // 6. Products & BOM Recipes
        $productsData = [
            [
                'sku' => 'LAT-ICE-16',
                'name' => 'Iced Caffe Latte (16oz)',
                'category' => 'Coffee & Beverages',
                'price' => 12.00,
                'bom' => [
                    ['mat' => 'RM-COF-01', 'qty' => 18.0],
                    ['mat' => 'RM-MLK-01', 'qty' => 180.0],
                    ['mat' => 'RM-CUP-16', 'qty' => 1.0],
                    ['mat' => 'RM-STR-01', 'qty' => 1.0],
                ],
            ],
            [
                'sku' => 'AME-HOT-12',
                'name' => 'Hot Americano (12oz)',
                'category' => 'Coffee & Beverages',
                'price' => 9.00,
                'bom' => [
                    ['mat' => 'RM-COF-01', 'qty' => 18.0],
                    ['mat' => 'RM-CUP-12', 'qty' => 1.0],
                ],
            ],
            [
                'sku' => 'MAC-CAR-16',
                'name' => 'Caramel Macchiato (16oz)',
                'category' => 'Coffee & Beverages',
                'price' => 14.50,
                'bom' => [
                    ['mat' => 'RM-COF-01', 'qty' => 18.0],
                    ['mat' => 'RM-MLK-01', 'qty' => 160.0],
                    ['mat' => 'RM-SYR-02', 'qty' => 20.0],
                    ['mat' => 'RM-CUP-16', 'qty' => 1.0],
                    ['mat' => 'RM-STR-01', 'qty' => 1.0],
                ],
            ],
            [
                'sku' => 'OAT-LAT-16',
                'name' => 'Oat Milk Latte (16oz)',
                'category' => 'Coffee & Beverages',
                'price' => 15.00,
                'bom' => [
                    ['mat' => 'RM-COF-01', 'qty' => 18.0],
                    ['mat' => 'RM-MLK-02', 'qty' => 180.0],
                    ['mat' => 'RM-CUP-16', 'qty' => 1.0],
                    ['mat' => 'RM-STR-01', 'qty' => 1.0],
                ],
            ],
            [
                'sku' => 'PAS-CRO-01',
                'name' => 'Butter Croissant',
                'category' => 'Pastries & Bakery',
                'price' => 7.50,
                'bom' => [
                    ['mat' => 'RM-CR-01', 'qty' => 1.0],
                ],
            ],
            [
                'sku' => 'PAS-MUF-01',
                'name' => 'Choc Chip Muffin',
                'category' => 'Pastries & Bakery',
                'price' => 6.90,
                'bom' => [
                    ['mat' => 'RM-MUF-01', 'qty' => 1.0],
                ],
            ],
        ];

        $products = [];
        foreach ($productsData as $p) {
            $product = Product::create([
                'company_id' => $company->id,
                'sku' => $p['sku'],
                'name' => $p['name'],
                'category' => $p['category'],
                'selling_price' => $p['price'],
                'cost_price' => 0.00,
                'is_active' => true,
            ]);

            $bomCost = 0.0;
            foreach ($p['bom'] as $b) {
                $mat = $rawMaterials[$b['mat']];
                RecipeItem::create([
                    'product_id' => $product->id,
                    'raw_material_id' => $mat->id,
                    'quantity_required' => $b['qty'],
                ]);
                $bomCost += ($b['qty'] * (float)$mat->standard_cost_per_base_unit);
            }

            $product->cost_price = round($bomCost, 2);
            $product->save();

            $products[$p['sku']] = $product;
        }

        // 7. Staff & Roles
        $pinDefault = Hash::make('1234');

        $staffAdmin = Staff::create([
            'company_id' => $company->id,
            'staff_code' => 'ADM-001',
            'full_name' => 'Fakrul Hakim',
            'email' => 'fakrul@example.com',
            'phone' => '+60 12-888 1234',
            'pin_hash' => $pinDefault,
            'password' => Hash::make('password'),
            'role' => 'SUPER_ADMIN',
            'salary_type' => 'NONE',
            'is_active' => true,
        ]);

        $staffMgrPav = Staff::create([
            'company_id' => $company->id,
            'primary_branch_id' => $branchPavilion->id,
            'staff_code' => 'MGR-001',
            'full_name' => 'Ali Imran',
            'email' => 'ali@example.com',
            'phone' => '+60 12-345 6789',
            'pin_hash' => $pinDefault,
            'role' => 'BRANCH_MANAGER',
            'salary_type' => 'MONTHLY',
            'monthly_rate' => 3500.00,
            'is_active' => true,
        ]);

        $staffBarista1 = Staff::create([
            'company_id' => $company->id,
            'primary_branch_id' => $branchPavilion->id,
            'staff_code' => 'STF-001',
            'full_name' => 'Nurul Huda',
            'email' => 'huda@example.com',
            'phone' => '+60 17-234 5678',
            'pin_hash' => $pinDefault,
            'role' => 'STAFF',
            'salary_type' => 'HOURLY',
            'hourly_rate' => 12.00,
            'is_active' => true,
        ]);

        $staffBarista2 = Staff::create([
            'company_id' => $company->id,
            'primary_branch_id' => $branchPavilion->id,
            'staff_code' => 'STF-002',
            'full_name' => 'Jason Tan',
            'email' => 'jason@example.com',
            'phone' => '+60 16-345 6789',
            'pin_hash' => $pinDefault,
            'role' => 'STAFF',
            'salary_type' => 'HOURLY',
            'hourly_rate' => 14.00,
            'is_active' => true,
        ]);

        $staffBarista3 = Staff::create([
            'company_id' => $company->id,
            'primary_branch_id' => $branchMidValley->id,
            'staff_code' => 'STF-003',
            'full_name' => 'Faris Danial',
            'email' => 'faris@example.com',
            'phone' => '+60 19-456 7890',
            'pin_hash' => $pinDefault,
            'role' => 'STAFF',
            'salary_type' => 'HOURLY',
            'hourly_rate' => 12.50,
            'is_active' => true,
        ]);

        // 8. Completed & Active Attendance Records (Workforce Shifts)
        // Yesterday shift 1 (8 hours = 480 mins)
        Attendance::create([
            'company_id' => $company->id,
            'staff_id' => $staffBarista1->id,
            'kiosk_id_in' => $kioskPav1->id,
            'kiosk_id_out' => $kioskPav1->id,
            'clock_in_at' => Carbon::now()->subDay()->setTime(9, 0),
            'clock_out_at' => Carbon::now()->subDay()->setTime(17, 0),
            'raw_duration_minutes' => 480,
            'payable_duration_minutes' => 480,
            'hourly_rate_snapshot' => 12.00,
            'gross_earnings' => 96.00, // 8 hrs * 12
            'status' => 'COMPLETED',
        ]);

        // Yesterday shift 2 (8 hours = 480 mins)
        Attendance::create([
            'company_id' => $company->id,
            'staff_id' => $staffBarista2->id,
            'kiosk_id_in' => $kioskPav1->id,
            'kiosk_id_out' => $kioskPav1->id,
            'clock_in_at' => Carbon::now()->subDay()->setTime(10, 0),
            'clock_out_at' => Carbon::now()->subDay()->setTime(18, 0),
            'raw_duration_minutes' => 480,
            'payable_duration_minutes' => 480,
            'hourly_rate_snapshot' => 14.00,
            'gross_earnings' => 112.00, // 8 hrs * 14
            'status' => 'COMPLETED',
        ]);

        // Today Live Active Shift at Pavilion Kiosk 1
        Attendance::create([
            'company_id' => $company->id,
            'staff_id' => $staffBarista1->id,
            'kiosk_id_in' => $kioskPav1->id,
            'kiosk_id_out' => null,
            'clock_in_at' => Carbon::now()->setTime(8, 30),
            'clock_out_at' => null,
            'raw_duration_minutes' => 0,
            'payable_duration_minutes' => 0,
            'hourly_rate_snapshot' => 12.00,
            'gross_earnings' => 0.00,
            'status' => 'OPEN',
        ]);

        // Today Live Active Shift at Mid Valley Kiosk 1
        Attendance::create([
            'company_id' => $company->id,
            'staff_id' => $staffBarista3->id,
            'kiosk_id_in' => $kioskMv1->id,
            'kiosk_id_out' => null,
            'clock_in_at' => Carbon::now()->setTime(9, 0),
            'clock_out_at' => null,
            'raw_duration_minutes' => 0,
            'payable_duration_minutes' => 0,
            'hourly_rate_snapshot' => 12.50,
            'gross_earnings' => 0.00,
            'status' => 'OPEN',
        ]);

        // 9. Historical Orders with Recipe BOM deduction records
        for ($i = 1; $i <= 12; $i++) {
            $orderNum = 'ORD-PV01-' . date('Ymd') . '-' . str_pad($i, 4, '0', STR_PAD_LEFT);
            $orderTime = Carbon::now()->subHours(12 - $i);

            $order = Order::create([
                'uuid' => (string) Str::uuid(),
                'company_id' => $company->id,
                'branch_id' => $branchPavilion->id,
                'kiosk_id' => $kioskPav1->id,
                'staff_id' => $staffBarista1->id,
                'order_number' => $orderNum,
                'total_amount' => 26.50,
                'discount_amount' => 0.00,
                'tax_amount' => 1.59,
                'net_amount' => 28.09,
                'total_material_cost' => 6.20,
                'payment_method' => $i % 2 === 0 ? 'CASH' : 'CREDIT_CARD',
                'payment_status' => 'PAID',
                'order_status' => 'COMPLETED',
                'ordered_at' => $orderTime,
            ]);

            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $products['LAT-ICE-16']->id,
                'quantity' => 1,
                'unit_price' => 12.00,
                'total_price' => 12.00,
                'unit_cost_snapshot' => $products['LAT-ICE-16']->cost_price,
            ]);

            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $products['MAC-CAR-16']->id,
                'quantity' => 1,
                'unit_price' => 14.50,
                'total_price' => 14.50,
                'unit_cost_snapshot' => $products['MAC-CAR-16']->cost_price,
            ]);
        }

        // 10. Sample Stock Transfer
        $transfer = StockTransfer::create([
            'transfer_number' => 'TRF-' . date('Ymd') . '-001',
            'company_id' => $company->id,
            'source_location_id' => $locCentral->id,
            'dest_location_id' => $locPav1Stock->id,
            'requested_by' => $staffMgrPav->id,
            'approved_by' => $staffAdmin->id,
            'dispatched_by' => $staffAdmin->id,
            'status' => 'DISPATCHED',
            'notes' => 'Weekly restock for weekend footfall surge',
            'dispatched_at' => now()->subHours(2),
        ]);

        StockTransferItem::create([
            'transfer_id' => $transfer->id,
            'raw_material_id' => $rawMaterials['RM-COF-01']->id,
            'quantity_requested' => 5000.0, // 5kg
            'quantity_dispatched' => 5000.0,
        ]);

        StockTransferItem::create([
            'transfer_id' => $transfer->id,
            'raw_material_id' => $rawMaterials['RM-CUP-16']->id,
            'quantity_requested' => 200.0,
            'quantity_dispatched' => 200.0,
        ]);

        // 11. Sample Wastage Record
        Wastage::create([
            'company_id' => $company->id,
            'location_id' => $locPav1Stock->id,
            'staff_id' => $staffBarista1->id,
            'raw_material_id' => $rawMaterials['RM-MLK-01']->id,
            'quantity' => 500.0, // 500ml
            'cost_impact' => 3.50,
            'reason' => 'SPILLAGE_PREP',
            'notes' => 'Milk jug dropped during morning rush',
            'created_at' => now()->subHours(4),
        ]);
    }
}
