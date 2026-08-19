import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import {
  CreditCard,
  ShieldCheck,
  Zap,
  Key,
  Layers,
  Copy,
  Check,
  ExternalLink,
  Lock,
  Globe,
  AlertCircle,
  QrCode
} from 'lucide-react';

interface PaymentGateway {
  id: number;
  provider: string;
  api_key: string | null;
  x_signature_key: string | null;
  collection_id: string | null;
  is_sandbox: boolean;
  is_active: boolean;
}

interface Props {
  company: any;
  gateway: PaymentGateway;
  webhookUrl: string;
}

export default function PaymentGateways({ company, gateway, webhookUrl }: Props) {
  const [copied, setCopied] = useState(false);

  const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
    provider: gateway.provider || 'BILLPLZ',
    api_key: gateway.api_key || '',
    x_signature_key: gateway.x_signature_key || '',
    collection_id: gateway.collection_id || '',
    is_sandbox: gateway.is_sandbox ?? true,
    is_active: gateway.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/settings/payment-gateways');
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AdminLayout title="Payment Gateway Settings (Billplz)">
      <Head title="Payment Gateway Settings" />

      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Payment Gateway & Online Checkout (Billplz)</h4>
          <p className="text-muted mb-0 small">
            Configure Billplz API v3 integration for automated online FPX bank transfers, DuitNow dynamic QR codes, and secure webhook verification.
          </p>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Form */}
        <div className="col-12 col-lg-8">
          <div className="mk-card p-4 border-0 shadow-sm">
            <div className="d-flex align-items-center gap-2 mb-4 pb-3 border-bottom">
              <div className="rounded p-2 bg-primary bg-opacity-10 text-primary">
                <CreditCard size={20} />
              </div>
              <div>
                <h5 className="fw-bold mb-0 text-dark">Billplz Integration Credentials</h5>
                <span className="text-muted small">Manage API keys and sandbox environment for online payments</span>
              </div>
            </div>

            {recentlySuccessful && (
              <div className="alert alert-success d-flex align-items-center gap-2 small mb-4">
                <ShieldCheck size={16} />
                <span>Payment gateway configuration updated and saved successfully!</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Active & Environment Toggles */}
              <div className="row g-3 mb-4 p-3 bg-light rounded-3">
                <div className="col-12 col-sm-6">
                  <div className="form-check form-switch">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="isActiveCheck"
                      checked={data.is_active}
                      onChange={(e) => setData('is_active', e.target.checked)}
                    />
                    <label className="form-check-label fw-bold text-dark small" htmlFor="isActiveCheck">
                      Enable Billplz at Kiosk Checkout
                    </label>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      Show Billplz FPX & QR option in Kiosk POS payment modal.
                    </div>
                  </div>
                </div>

                <div className="col-12 col-sm-6">
                  <div className="form-check form-switch">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="isSandboxCheck"
                      checked={data.is_sandbox}
                      onChange={(e) => setData('is_sandbox', e.target.checked)}
                    />
                    <label className="form-check-label fw-bold text-dark small" htmlFor="isSandboxCheck">
                      Sandbox / Staging Mode
                    </label>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      Uses <span className="font-monospace text-primary">billplz-sandbox.com</span> for testing without real money.
                    </div>
                  </div>
                </div>
              </div>

              {/* API Key */}
              <div className="mb-3">
                <label className="form-label small fw-bold text-dark d-flex align-items-center gap-1">
                  <Key size={14} className="text-muted" /> Billplz Secret API Key *
                </label>
                <input
                  type="password"
                  className={`form-control font-monospace ${errors.api_key ? 'is-invalid' : ''}`}
                  placeholder="e.g. b2908819-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={data.api_key}
                  onChange={(e) => setData('api_key', e.target.value)}
                />
                {errors.api_key && <div className="invalid-feedback">{errors.api_key}</div>}
                <div className="form-text small">Obtain from your Billplz Dashboard under Settings $\rightarrow$ Keys & Integration.</div>
              </div>

              {/* X-Signature Key */}
              <div className="mb-3">
                <label className="form-label small fw-bold text-dark d-flex align-items-center gap-1">
                  <Lock size={14} className="text-muted" /> X-Signature Key (Webhook Verification)
                </label>
                <input
                  type="password"
                  className={`form-control font-monospace ${errors.x_signature_key ? 'is-invalid' : ''}`}
                  placeholder="e.g. S-xxxxxxxxxxxxxxxx"
                  value={data.x_signature_key}
                  onChange={(e) => setData('x_signature_key', e.target.value)}
                />
                {errors.x_signature_key && <div className="invalid-feedback">{errors.x_signature_key}</div>}
                <div className="form-text small">Used to verify authenticity of payment callbacks via SHA256 HMAC.</div>
              </div>

              {/* Collection ID */}
              <div className="mb-4">
                <label className="form-label small fw-bold text-dark d-flex align-items-center gap-1">
                  <Layers size={14} className="text-muted" /> Billing Collection ID *
                </label>
                <input
                  type="text"
                  className={`form-control font-monospace ${errors.collection_id ? 'is-invalid' : ''}`}
                  placeholder="e.g. in_xxxxxx"
                  value={data.collection_id}
                  onChange={(e) => setData('collection_id', e.target.value)}
                />
                {errors.collection_id && <div className="invalid-feedback">{errors.collection_id}</div>}
                <div className="form-text small">Collection identifier where kiosk bills will be grouped and settled.</div>
              </div>

              <div className="d-flex justify-content-end">
                <button type="submit" disabled={processing} className="btn btn-primary px-4 fw-bold">
                  {processing ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Info & Webhook Card */}
        <div className="col-12 col-lg-4">
          <div className="mk-card p-4 border-0 shadow-sm mb-4">
            <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <Globe size={16} className="text-primary" /> Webhook Endpoint URL
            </h6>
            <p className="text-muted small mb-3">
              Configure this Webhook Callback URL in your Billplz Collection settings to receive real-time automated payment confirmations:
            </p>

            <div className="input-group mb-3">
              <input
                type="text"
                readOnly
                className="form-control form-control-sm font-monospace bg-light"
                value={webhookUrl}
              />
              <button
                type="button"
                onClick={handleCopyWebhook}
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                title="Copy Webhook URL"
              >
                {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              </button>
            </div>

            <div className="p-3 bg-light rounded-3 small">
              <div className="fw-bold text-dark mb-1">Supported Payment Channels:</div>
              <ul className="ps-3 mb-0 text-muted" style={{ fontSize: '0.8rem' }}>
                <li>FPX Direct Online Banking (Maybank, CIMB, Public Bank, etc.)</li>
                <li>DuitNow QR & E-Wallets (TNG, GrabPay, ShopeePay)</li>
                <li>Visa / Mastercard (via Billplz Card Gateways)</li>
              </ul>
            </div>
          </div>

          {/* Sandbox Info */}
          <div className="mk-card p-3 border-0 shadow-sm bg-primary bg-opacity-10 text-primary">
            <div className="d-flex align-items-start gap-2">
              <AlertCircle size={18} className="flex-shrink-0 mt-1" />
              <div className="small">
                <strong>Sandbox Testing Tip:</strong> When sandbox mode is enabled, the kiosk terminal generates instant simulated payment URLs allowing end-to-end checkout verification without touching live bank accounts.
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
