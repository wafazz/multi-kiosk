import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import {
  Settings,
  Upload,
  Image,
  Palette,
  CheckCircle,
  Building,
  MonitorPlay,
  FileText
} from 'lucide-react';

interface Company {
  id: number;
  name: string;
  code: string;
  logo_path: string | null;
  brand_primary_color: string;
}

interface Props {
  company: Company;
}

export default function BrandingSettings({ company }: Props) {
  const [logoPreview, setLogoPreview] = useState<string | null>(company?.logo_path || null);

  const form = useForm({
    name: company?.name || 'Multi-Kiosk Enterprise',
    code: company?.code || 'MKE01',
    brand_primary_color: company?.brand_primary_color || '#2563eb',
    logo: null as File | null,
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setData('logo', file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    form.post('/settings/branding', {
      forceFormData: true,
      onSuccess: () => {
        // Flash handled in layout
      },
    });
  };

  return (
    <AdminLayout title="System Branding & Visual Identity">
      <Head title="Branding & Logo Settings" />

      {/* Header */}
      <div className="mb-4">
        <h4 className="fw-bold mb-1 text-dark">Brand Identity & System Customization</h4>
        <p className="text-muted mb-0 small">
          Upload your organization's official logo, select primary theme color accents, and configure global system metadata.
        </p>
      </div>

      <div className="row g-4">
        {/* Left Form */}
        <div className="col-12 col-lg-7">
          <div className="mk-card p-4 border-0 shadow-sm">
            <form onSubmit={handleSubmit}>
              {/* Logo Upload Box */}
              <div className="mb-4">
                <label className="form-label fw-semibold small text-dark">Company / Organization Logo</label>
                <div className="d-flex align-items-center gap-3 p-3 border rounded-3 bg-light">
                  <div
                    className="rounded bg-white border p-2 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 80, height: 80 }}
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    ) : (
                      <Image size={32} className="text-muted" />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      id="logo-upload"
                      className="d-none"
                      onChange={handleLogoChange}
                    />
                    <label htmlFor="logo-upload" className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 mb-1">
                      <Upload size={14} /> Upload New Logo
                    </label>
                    <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                      PNG, JPG, or SVG. Recommended size: 256x256px.
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Name & Code */}
              <div className="row g-3 mb-3">
                <div className="col-12 col-md-8">
                  <label className="form-label fw-semibold small text-dark">Company / Brand Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.data.name}
                    onChange={(e) => form.setData('name', e.target.value)}
                    required
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold small text-dark">Tenant Code *</label>
                  <input
                    type="text"
                    className="form-control text-uppercase font-monospace"
                    value={form.data.code}
                    onChange={(e) => form.setData('code', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Primary Color */}
              <div className="mb-4">
                <label className="form-label fw-semibold small text-dark d-flex align-items-center gap-2">
                  <Palette size={16} /> Brand Accent Color
                </label>
                <div className="d-flex align-items-center gap-3">
                  <input
                    type="color"
                    className="form-control form-control-color border-0 p-0"
                    value={form.data.brand_primary_color}
                    onChange={(e) => form.setData('brand_primary_color', e.target.value)}
                    style={{ width: 44, height: 38 }}
                  />
                  <input
                    type="text"
                    className="form-control font-monospace"
                    style={{ width: 140 }}
                    value={form.data.brand_primary_color}
                    onChange={(e) => form.setData('brand_primary_color', e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-sm px-4" disabled={form.processing}>
                Save Identity Settings
              </button>
            </form>
          </div>
        </div>

        {/* Right Preview Card */}
        <div className="col-12 col-lg-5">
          <div className="mk-card p-4 border-0 shadow-sm">
            <h6 className="fw-bold mb-3 text-dark">Live Brand Identity Preview</h6>

            {/* Sidebar Preview */}
            <div className="p-3 rounded-3 mb-3 text-white" style={{ backgroundColor: '#0f172a' }}>
              <div className="small text-muted mb-2">HQ Sidebar Brand Header</div>
              <div className="d-flex align-items-center gap-2">
                {logoPreview ? (
                  <img src={logoPreview} alt="" className="rounded bg-white p-1" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                ) : (
                  <div className="rounded d-flex align-items-center justify-content-center fw-bold text-white" style={{ width: 32, height: 32, backgroundColor: form.data.brand_primary_color }}>
                    MK
                  </div>
                )}
                <div>
                  <div className="fw-bold text-white small">{form.data.name || 'Brand Name'}</div>
                  <div className="text-muted" style={{ fontSize: '0.65rem' }}>Enterprise POS</div>
                </div>
              </div>
            </div>

            {/* Receipt Preview */}
            <div className="p-3 rounded-3 bg-light border font-monospace text-center small">
              <div className="text-muted mb-1" style={{ fontSize: '0.7rem' }}>--- THERMAL RECEIPT SLIP ---</div>
              <div className="fw-bold text-dark fs-6">{form.data.name || 'COMPANY NAME'}</div>
              <div className="text-muted" style={{ fontSize: '0.7rem' }}>Kiosk: K01-PV • MID: {form.data.code}</div>
              <div className="border-bottom my-2"></div>
              <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.75rem' }}>
                <span>1x Iced Caffe Latte</span>
                <span>RM 12.00</span>
              </div>
              <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.75rem' }}>
                <span>SST (6%)</span>
                <span>RM 0.72</span>
              </div>
              <div className="border-bottom my-2"></div>
              <div className="d-flex justify-content-between fw-bold text-dark">
                <span>TOTAL PAID</span>
                <span>RM 12.72</span>
              </div>
              <div className="text-muted mt-2" style={{ fontSize: '0.7rem' }}>Thank you for visiting!</div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
