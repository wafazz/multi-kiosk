<?php

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BrandingController;
use App\Http\Controllers\BranchKioskController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\KioskTerminalController;
use App\Http\Controllers\PayrollReportController;
use App\Http\Controllers\ProductCatalogController;
use App\Http\Controllers\RawMaterialController;
use App\Http\Controllers\StaffController;
use Illuminate\Support\Facades\Route;

// Authentication
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->name('login.post');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// Root redirection
Route::get('/', function () {
    return redirect()->route('dashboard');
});

// HQ & Administrative Portal
Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

// Branches & Kiosks
Route::get('/branches', [BranchKioskController::class, 'index'])->name('branches.index');
Route::post('/branches', [BranchKioskController::class, 'storeBranch'])->name('branches.store');
Route::post('/kiosks', [BranchKioskController::class, 'storeKiosk'])->name('kiosks.store');
Route::patch('/kiosks/{kiosk}/status', [BranchKioskController::class, 'toggleKioskStatus'])->name('kiosks.status');
Route::delete('/kiosks/{kiosk}', [BranchKioskController::class, 'destroyKiosk'])->name('kiosks.destroy');

// Products & Recipe (BOM) Builder
Route::get('/products', [ProductCatalogController::class, 'index'])->name('products.index');
Route::post('/products', [ProductCatalogController::class, 'storeProduct'])->name('products.store');
Route::put('/products/{product}', [ProductCatalogController::class, 'updateProduct'])->name('products.update');
Route::post('/products/{product}/recipe', [ProductCatalogController::class, 'syncRecipe'])->name('products.recipe');
Route::delete('/products/{product}', [ProductCatalogController::class, 'destroyProduct'])->name('products.destroy');

// Product Modifiers & Add-on Recipe BOM
Route::get('/modifiers', [\App\Http\Controllers\ModifierController::class, 'index'])->name('modifiers.index');
Route::post('/modifiers/groups', [\App\Http\Controllers\ModifierController::class, 'storeGroup'])->name('modifiers.groups.store');
Route::put('/modifiers/groups/{group}', [\App\Http\Controllers\ModifierController::class, 'updateGroup'])->name('modifiers.groups.update');
Route::delete('/modifiers/groups/{group}', [\App\Http\Controllers\ModifierController::class, 'destroyGroup'])->name('modifiers.groups.destroy');
Route::post('/modifiers/options', [\App\Http\Controllers\ModifierController::class, 'storeOption'])->name('modifiers.options.store');
Route::post('/modifiers/options/{option}/recipe', [\App\Http\Controllers\ModifierController::class, 'syncOptionRecipe'])->name('modifiers.options.recipe');
Route::delete('/modifiers/options/{option}', [\App\Http\Controllers\ModifierController::class, 'destroyOption'])->name('modifiers.options.destroy');

// Raw Materials & Inventory Master
Route::get('/raw-materials', [RawMaterialController::class, 'index'])->name('raw-materials.index');
Route::post('/raw-materials', [RawMaterialController::class, 'store'])->name('raw-materials.store');
Route::put('/raw-materials/{rawMaterial}', [RawMaterialController::class, 'update'])->name('raw-materials.update');
Route::post('/raw-materials/adjust-stock', [RawMaterialController::class, 'adjustStock'])->name('raw-materials.adjust');

// Stock Transfers & Wastage Log
Route::get('/inventory/transfers', [InventoryController::class, 'index'])->name('inventory.transfers');
Route::post('/inventory/transfers', [InventoryController::class, 'storeTransfer'])->name('inventory.transfers.store');
Route::post('/inventory/transfers/{transfer}/status', [InventoryController::class, 'updateTransferStatus'])->name('inventory.transfers.status');
Route::post('/inventory/wastage', [InventoryController::class, 'storeWastage'])->name('inventory.wastage.store');

// Staff Management
Route::get('/staff', [StaffController::class, 'index'])->name('staff.index');
Route::post('/staff', [StaffController::class, 'store'])->name('staff.store');
Route::put('/staff/{staff}', [StaffController::class, 'update'])->name('staff.update');

// Attendance & Clocking
Route::get('/attendance', [AttendanceController::class, 'index'])->name('attendance.index');
Route::post('/attendance/{attendance}/adjust', [AttendanceController::class, 'adjust'])->name('attendance.adjust');

// Hourly Payroll & Labor Reports
Route::get('/payroll', [PayrollReportController::class, 'index'])->name('payroll.index');

// Branding & Settings
Route::get('/settings/branding', [BrandingController::class, 'index'])->name('settings.branding');
Route::post('/settings/branding', [BrandingController::class, 'update'])->name('settings.branding.update');

// Shift Management & Cash Float (Z-Reports)
Route::get('/shifts', [\App\Http\Controllers\ShiftController::class, 'index'])->name('shifts.index');
Route::post('/api/v1/kiosk/shift/open', [\App\Http\Controllers\ShiftController::class, 'apiOpenShift'])->name('api.kiosk.shift.open');
Route::get('/api/v1/kiosk/shift/x-report', [\App\Http\Controllers\ShiftController::class, 'apiLiveXReport'])->name('api.kiosk.shift.xreport');
Route::post('/api/v1/kiosk/shift/close', [\App\Http\Controllers\ShiftController::class, 'apiCloseShift'])->name('api.kiosk.shift.close');

// Kitchen Display System (KDS)
Route::get('/kds', [\App\Http\Controllers\KitchenDisplayController::class, 'index'])->name('kds.index');
Route::get('/api/v1/kds/tickets', [\App\Http\Controllers\KitchenDisplayController::class, 'apiGetTickets'])->name('api.kds.tickets');
Route::post('/api/v1/kds/order/{order}/status', [\App\Http\Controllers\KitchenDisplayController::class, 'apiUpdateOrderStatus'])->name('api.kds.order.status');
Route::post('/api/v1/kds/item/{item}/toggle', [\App\Http\Controllers\KitchenDisplayController::class, 'apiToggleItemPrepared'])->name('api.kds.item.toggle');

// Kiosk Dedicated Terminal UI
Route::get('/kiosk/terminal/{kioskId?}', [KioskTerminalController::class, 'terminal'])->name('kiosk.terminal');
Route::post('/api/v1/kiosk/order', [KioskTerminalController::class, 'processOrder'])->name('api.kiosk.order');
Route::post('/api/v1/kiosk/clock', [KioskTerminalController::class, 'handleClock'])->name('api.kiosk.clock');
