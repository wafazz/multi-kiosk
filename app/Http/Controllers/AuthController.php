<?php

namespace App\Http\Controllers;

use App\Models\Staff;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    public function showLogin(): Response
    {
        return Inertia::render('Auth/Login');
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'staff_code_or_email' => 'required|string',
            'pin_or_password' => 'required|string',
        ]);

        $identifier = $validated['staff_code_or_email'];
        $secret = $validated['pin_or_password'];

        $staff = Staff::where('email', $identifier)
            ->orWhere('staff_code', strtoupper($identifier))
            ->first();

        if ($staff && $staff->is_active) {
            $isPinMatch = Hash::check($secret, $staff->pin_hash) || $secret === $staff->pin_hash;
            $isPasswordMatch = $staff->password && Hash::check($secret, $staff->password);

            if ($isPinMatch || $isPasswordMatch) {
                // Set session
                session(['auth_staff_id' => $staff->id]);
                return redirect()->route('dashboard')->with('success', "Welcome back, {$staff->full_name}!");
            }
        }

        return redirect()->back()->withErrors([
            'staff_code_or_email' => 'Invalid credentials. Please verify your Staff Code/Email and PIN.',
        ]);
    }

    public function logout(Request $request)
    {
        session()->forget('auth_staff_id');
        return redirect()->route('login')->with('success', 'Logged out successfully.');
    }
}
