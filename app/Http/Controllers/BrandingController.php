<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BrandingController extends Controller
{
    public function index(): Response
    {
        $company = Company::first();
        if (!$company) {
            $company = Company::create([
                'name' => 'Multi-Kiosk Platform',
                'code' => 'MKP01',
                'brand_primary_color' => '#2563eb',
            ]);
        }

        return Inertia::render('Settings/Branding', [
            'company' => $company,
        ]);
    }

    public function update(Request $request)
    {
        $company = Company::first();
        if (!$company) {
            $company = Company::create([
                'name' => 'Multi-Kiosk Platform',
                'code' => 'MKP01',
            ]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50',
            'brand_primary_color' => 'required|string|max:50',
            'logo' => 'nullable|image|max:2048',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'code' => strtoupper($validated['code']),
            'brand_primary_color' => $validated['brand_primary_color'],
        ];

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('logos', 'public');
            $updateData['logo_path'] = '/storage/' . $path;
        }

        $company->update($updateData);

        return redirect()->back()->with('success', 'Company branding and logo updated successfully.');
    }
}
