import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import {
  MonitorPlay,
  KeyRound,
  ShieldCheck,
  Store,
  User
} from 'lucide-react';

export default function Login() {
  const form = useForm({
    staff_code_or_email: '',
    pin_or_password: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    form.post('/login');
  };

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center p-3">
      <Head title="Staff & Admin Portal Login" />

      <div className="w-100" style={{ maxWidth: 420 }}>
        {/* Brand Header */}
        <div className="text-center mb-4">
          <div
            className="rounded-3 bg-primary text-white p-3 d-inline-flex align-items-center justify-content-center shadow mb-2"
            style={{ width: 56, height: 56 }}
          >
            <Store size={32} />
          </div>
          <h4 className="fw-bold text-dark mb-0">Multi-Kiosk Enterprise</h4>
          <p className="text-muted small">Centralized Management & Kiosk Terminal System</p>
        </div>

        {/* Login Card */}
        <div className="mk-card p-4 border-0 shadow-sm">
          <h5 className="fw-bold mb-3 text-dark">Portal Authentication</h5>

          {form.errors.staff_code_or_email && (
            <div className="alert alert-danger p-2 small mb-3 border-0">
              {form.errors.staff_code_or_email}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold small text-dark">Staff Code or Email</label>
              <div className="input-group">
                <span className="input-group-text bg-light text-muted">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. ADM-001 or admin@example.com"
                  value={form.data.staff_code_or_email}
                  onChange={(e) => form.setData('staff_code_or_email', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold small text-dark">PIN or Password</label>
              <div className="input-group">
                <span className="input-group-text bg-light text-muted">
                  <KeyRound size={16} />
                </span>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••"
                  value={form.data.pin_or_password}
                  onChange={(e) => form.setData('pin_or_password', e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2 fw-semibold mb-3 shadow-sm"
              disabled={form.processing}
            >
              Sign In to Platform
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="p-3 bg-light rounded-3 border small text-muted">
            <div className="fw-bold text-dark mb-1">Demo Credentials:</div>
            <div>Super Admin: <span className="font-monospace text-dark">ADM-001</span> (PIN: <span className="font-monospace text-dark">1234</span>)</div>
            <div>Staff / Barista: <span className="font-monospace text-dark">STF-001</span> (PIN: <span className="font-monospace text-dark">1234</span>)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
