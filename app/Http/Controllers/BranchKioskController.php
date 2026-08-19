<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Company;
use App\Models\Kiosk;
use App\Models\StockLocation;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class BranchKioskController extends Controller
{
    public function index(): Response
    {
        $company = Company::first();
        $branches = Branch::with(['kiosks', 'stockLocations'])
            ->where('company_id', $company->id ?? 1)
            ->get();

        return Inertia::render('Branches/Index', [
            'branches' => $branches,
        ]);
    }

    public function storeBranch(Request $request)
    {
        $company = Company::first();
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:50',
        ]);

        $branch = Branch::create([
            'company_id' => $company->id ?? 1,
            'name' => $validated['name'],
            'code' => strtoupper($validated['code']),
            'address' => $validated['address'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'is_active' => true,
        ]);

        // Auto-create a Branch Store location
        StockLocation::create([
            'company_id' => $company->id ?? 1,
            'branch_id' => $branch->id,
            'location_name' => "{$branch->name} Main Store",
            'location_type' => 'BRANCH_STORE',
            'is_active' => true,
        ]);

        return redirect()->back()->with('success', "Branch '{$branch->name}' created successfully.");
    }

    public function storeKiosk(Request $request)
    {
        $company = Company::first();
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'kiosk_name' => 'required|string|max:255',
            'kiosk_code' => 'required|string|max:50',
            'kiosk_type' => 'required|in:COUNTER_POS,CUSTOMER_SELF_SERVICE,HYBRID',
        ]);

        $branch = Branch::findOrFail($validated['branch_id']);

        $kiosk = Kiosk::create([
            'branch_id' => $branch->id,
            'kiosk_name' => $validated['kiosk_name'],
            'kiosk_code' => strtoupper($validated['kiosk_code']),
            'device_uid' => 'KIOSK-' . strtoupper(Str::random(8)),
            'api_token_hash' => hash('sha256', Str::random(32)),
            'kiosk_type' => $validated['kiosk_type'],
            'status' => 'ONLINE',
            'last_heartbeat_at' => now(),
            'app_version' => '1.0.0',
        ]);

        // Auto-create StockLocation for Kiosk
        StockLocation::create([
            'company_id' => $company->id ?? 1,
            'branch_id' => $branch->id,
            'kiosk_id' => $kiosk->id,
            'location_name' => "{$branch->name} - {$kiosk->kiosk_name} Stockroom",
            'location_type' => 'KIOSK',
            'is_active' => true,
        ]);

        return redirect()->back()->with('success', "Kiosk '{$kiosk->kiosk_name}' registered successfully.");
    }

    public function toggleKioskStatus(Request $request, Kiosk $kiosk)
    {
        $validated = $request->validate([
            'status' => 'required|in:ONLINE,OFFLINE,MAINTENANCE,INACTIVE',
        ]);

        $kiosk->update([
            'status' => $validated['status'],
            'last_heartbeat_at' => now(),
        ]);

        return redirect()->back()->with('success', "Kiosk status updated to {$validated['status']}.");
    }

    public function destroyKiosk(Kiosk $kiosk)
    {
        $name = $kiosk->kiosk_name;
        $kiosk->delete();
        return redirect()->back()->with('success', "Kiosk '{$name}' deleted successfully.");
    }
}
