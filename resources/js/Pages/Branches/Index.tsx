import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import {
  Store,
  Plus,
  Monitor,
  CheckCircle,
  AlertCircle,
  Trash2,
  ExternalLink,
  MapPin,
  Phone,
  Power,
  ShieldCheck
} from 'lucide-react';

interface Kiosk {
  id: number;
  kiosk_code: string;
  kiosk_name: string;
  device_uid: string;
  kiosk_type: string;
  status: string;
  last_heartbeat_at: string;
  app_version: string;
}

interface Branch {
  id: number;
  name: string;
  code: string;
  address: string;
  phone: string;
  is_active: boolean;
  kiosks: Kiosk[];
}

interface Props {
  branches: Branch[];
}

export default function BranchesIndex({ branches }: Props) {
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showKioskModal, setShowKioskModal] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);

  const branchForm = useForm({
    name: '',
    code: '',
    address: '',
    phone: '',
  });

  const kioskForm = useForm({
    branch_id: '',
    kiosk_name: '',
    kiosk_code: '',
    kiosk_type: 'COUNTER_POS',
  });

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    branchForm.post('/branches', {
      onSuccess: () => {
        branchForm.reset();
        setShowBranchModal(false);
      },
    });
  };

  const handleCreateKiosk = (e: React.FormEvent) => {
    e.preventDefault();
    kioskForm.post('/kiosks', {
      onSuccess: () => {
        kioskForm.reset();
        setShowKioskModal(false);
      },
    });
  };

  const handleStatusToggle = (kioskId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'ONLINE' ? 'MAINTENANCE' : 'ONLINE';
    router.patch(`/kiosks/${kioskId}/status`, { status: nextStatus });
  };

  const handleDeleteKiosk = (kioskId: number, name: string) => {
    if (confirm(`Are you sure you want to remove kiosk "${name}"?`)) {
      router.delete(`/kiosks/${kioskId}`);
    }
  };

  const openKioskModalForBranch = (branchId: number) => {
    setSelectedBranchId(branchId);
    kioskForm.setData('branch_id', branchId.toString());
    setShowKioskModal(true);
  };

  return (
    <AdminLayout title="Branches & Kiosk Device Management">
      <Head title="Branches & Kiosks" />

      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Branches & Distributed Kiosk Terminals</h4>
          <p className="text-muted mb-0 small">
            Register physical branch locations, bind edge kiosk hardware devices, and manage operating modes.
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            onClick={() => setShowBranchModal(true)}
            className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
          >
            <Plus size={16} />
            <span>Add Branch</span>
          </button>

          <button
            onClick={() => {
              setSelectedBranchId(branches[0]?.id || null);
              kioskForm.setData('branch_id', branches[0]?.id?.toString() || '');
              setShowKioskModal(true);
            }}
            className="btn btn-primary btn-sm d-flex align-items-center gap-1"
            disabled={branches.length === 0}
          >
            <Plus size={16} />
            <span>Register Kiosk</span>
          </button>
        </div>
      </div>

      {/* Branches & Kiosks List */}
      {branches.length === 0 ? (
        <div className="mk-card p-5 text-center border-0 shadow-sm">
          <Store size={48} className="text-muted mb-3 mx-auto" />
          <h5 className="fw-bold text-dark">No branches registered yet</h5>
          <p className="text-muted small">Create your first branch location to start provisioning physical kiosks.</p>
          <button onClick={() => setShowBranchModal(true)} className="btn btn-primary btn-sm mx-auto">
            Add First Branch
          </button>
        </div>
      ) : (
        <div className="d-flex flex-column gap-4">
          {branches.map((branch) => (
            <div key={branch.id} className="mk-card border-0 shadow-sm overflow-hidden">
              {/* Branch Header */}
              <div className="p-3 bg-white border-bottom d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded p-2 bg-primary bg-opacity-10 text-primary">
                    <Store size={22} />
                  </div>
                  <div>
                    <div className="d-flex align-items-center gap-2">
                      <h5 className="fw-bold mb-0 text-dark">{branch.name}</h5>
                      <span className="badge bg-secondary font-monospace">{branch.code}</span>
                      {branch.is_active && <span className="badge badge-soft-success">Active Branch</span>}
                    </div>
                    <div className="text-muted small d-flex flex-wrap align-items-center gap-3 mt-1">
                      {branch.address && (
                        <span className="d-flex align-items-center gap-1">
                          <MapPin size={13} /> {branch.address}
                        </span>
                      )}
                      {branch.phone && (
                        <span className="d-flex align-items-center gap-1">
                          <Phone size={13} /> {branch.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <span className="badge badge-soft-primary px-3 py-2 rounded-pill small">
                    {branch.kiosks.length} Kiosks Bound
                  </span>
                  <button
                    onClick={() => openKioskModalForBranch(branch.id)}
                    className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                  >
                    <Plus size={14} /> Add Kiosk
                  </button>
                </div>
              </div>

              {/* Kiosks Grid */}
              <div className="p-3 bg-light bg-opacity-50">
                {branch.kiosks.length === 0 ? (
                  <div className="text-center py-3 text-muted small">
                    No physical kiosks configured in this branch. Click "Add Kiosk" to register one.
                  </div>
                ) : (
                  <div className="row g-3">
                    {branch.kiosks.map((kiosk) => (
                      <div key={kiosk.id} className="col-12 col-md-6 col-xl-4">
                        <div className="p-3 bg-white border rounded-3 h-100 d-flex flex-column justify-content-between">
                          <div>
                            <div className="d-flex align-items-start justify-content-between mb-2">
                              <div className="d-flex align-items-center gap-2">
                                <Monitor size={18} className="text-primary" />
                                <span className="fw-bold text-dark">{kiosk.kiosk_name}</span>
                              </div>
                              <span
                                className={`badge ${
                                  kiosk.status === 'ONLINE'
                                    ? 'bg-success'
                                    : kiosk.status === 'MAINTENANCE'
                                    ? 'bg-warning text-dark'
                                    : 'bg-secondary'
                                } rounded-pill`}
                              >
                                {kiosk.status}
                              </span>
                            </div>

                            <div className="small text-muted mb-2">
                              Code: <span className="font-monospace fw-semibold text-dark">{kiosk.kiosk_code}</span> • Type: <span className="badge badge-soft-secondary">{kiosk.kiosk_type}</span>
                            </div>

                            <div className="p-2 rounded bg-light border font-monospace small mb-3 text-muted text-truncate">
                              <div className="d-flex align-items-center justify-content-between">
                                <span style={{ fontSize: '0.7rem' }}>DEVICE UID</span>
                                <span className="badge bg-dark" style={{ fontSize: '0.65rem' }}>v{kiosk.app_version || '1.0.0'}</span>
                              </div>
                              <div className="text-dark fw-bold" style={{ fontSize: '0.75rem' }}>{kiosk.device_uid || 'UNPAIRED'}</div>
                            </div>
                          </div>

                          <div className="d-flex align-items-center justify-content-between pt-2 border-top gap-1">
                            <button
                              onClick={() => handleStatusToggle(kiosk.id, kiosk.status)}
                              className={`btn btn-xs ${kiosk.status === 'ONLINE' ? 'btn-outline-warning' : 'btn-outline-success'} py-1 px-2`}
                              title="Toggle Online / Maintenance Status"
                            >
                              <Power size={13} className="me-1" />
                              {kiosk.status === 'ONLINE' ? 'Set Maintenance' : 'Set Online'}
                            </button>

                            <div className="d-flex align-items-center gap-1">
                              <Link
                                href={`/kiosk/terminal/${kiosk.id}`}
                                className="btn btn-xs btn-primary py-1 px-2 d-flex align-items-center gap-1"
                              >
                                <ExternalLink size={13} />
                                <span>POS View</span>
                              </Link>
                              <button
                                onClick={() => handleDeleteKiosk(kiosk.id, kiosk.kiosk_name)}
                                className="btn btn-xs btn-outline-danger py-1 px-2"
                                title="Delete Kiosk"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Branch */}
      {showBranchModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Register New Branch Location</h5>
                <button type="button" className="btn-close" onClick={() => setShowBranchModal(false)}></button>
              </div>
              <form onSubmit={handleCreateBranch}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Branch Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Pavilion KL Outlet"
                      value={branchForm.data.name}
                      onChange={(e) => branchForm.setData('name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Branch Code *</label>
                    <input
                      type="text"
                      className="form-control text-uppercase"
                      placeholder="e.g. PV01"
                      value={branchForm.data.code}
                      onChange={(e) => branchForm.setData('code', e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Address</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="Full physical street address..."
                      value={branchForm.data.address}
                      onChange={(e) => branchForm.setData('address', e.target.value)}
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Phone / Contact</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="+60 3-1234 5678"
                      value={branchForm.data.phone}
                      onChange={(e) => branchForm.setData('phone', e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowBranchModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={branchForm.processing}>
                    Save Branch
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Register Kiosk */}
      {showKioskModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Provision Physical Kiosk Terminal</h5>
                <button type="button" className="btn-close" onClick={() => setShowKioskModal(false)}></button>
              </div>
              <form onSubmit={handleCreateKiosk}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Target Branch *</label>
                    <select
                      className="form-select"
                      value={kioskForm.data.branch_id}
                      onChange={(e) => kioskForm.setData('branch_id', e.target.value)}
                      required
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Kiosk Display Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Counter POS Terminal 01"
                      value={kioskForm.data.kiosk_name}
                      onChange={(e) => kioskForm.setData('kiosk_name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Kiosk Code *</label>
                    <input
                      type="text"
                      className="form-control text-uppercase"
                      placeholder="e.g. K01-PV"
                      value={kioskForm.data.kiosk_code}
                      onChange={(e) => kioskForm.setData('kiosk_code', e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Operating Mode *</label>
                    <select
                      className="form-select"
                      value={kioskForm.data.kiosk_type}
                      onChange={(e) => kioskForm.setData('kiosk_type', e.target.value)}
                    >
                      <option value="COUNTER_POS">Cashier Operated POS</option>
                      <option value="CUSTOMER_SELF_SERVICE">Customer Self-Ordering Terminal</option>
                      <option value="HYBRID">Hybrid Dual-Mode (Self-Order + Staff PIN Pad)</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowKioskModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={kioskForm.processing}>
                    Provision Terminal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
