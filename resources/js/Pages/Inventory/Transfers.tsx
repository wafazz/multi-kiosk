import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import {
  ArrowLeftRight,
  Plus,
  Trash2,
  CheckCircle,
  Truck,
  PackageCheck,
  AlertTriangle,
  FileText,
  XCircle,
  X
} from 'lucide-react';

interface TransferItem {
  id: number;
  raw_material_id: number;
  raw_material_name: string;
  base_uom: string;
  quantity_requested: number;
  quantity_dispatched: number;
  quantity_received: number;
}

interface Transfer {
  id: number;
  transfer_number: string;
  source_location: string;
  source_location_id: number;
  dest_location: string;
  dest_location_id: number;
  requested_by_name: string;
  status: string;
  notes: string;
  created_at: string;
  dispatched_at: string | null;
  received_at: string | null;
  items: TransferItem[];
}

interface Wastage {
  id: number;
  location_name: string;
  staff_name: string;
  raw_material_name: string;
  base_uom: string;
  quantity: number;
  cost_impact: number;
  reason: string;
  notes: string;
  created_at: string;
}

interface StockLocation {
  id: number;
  location_name: string;
  location_type: string;
}

interface RawMaterial {
  id: number;
  name: string;
  sku: string;
  base_uom: string;
  standard_cost_per_base_unit: number;
}

interface StaffMember {
  id: number;
  full_name: string;
  role: string;
}

interface Props {
  transfers: Transfer[];
  wastages: Wastage[];
  stockLocations: StockLocation[];
  rawMaterials: RawMaterial[];
  staffMembers: StaffMember[];
}

export default function TransfersIndex({
  transfers,
  wastages,
  stockLocations,
  rawMaterials,
  staffMembers,
}: Props) {
  const [activeTab, setActiveTab] = useState<'transfers' | 'wastage'>('transfers');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showWastageModal, setShowWastageModal] = useState(false);

  // Transfer Form State
  const [transferItems, setTransferItems] = useState<Array<{ raw_material_id: number; quantity_requested: number }>>([]);
  const transferForm = useForm({
    source_location_id: stockLocations[0]?.id?.toString() || '',
    dest_location_id: stockLocations[1]?.id?.toString() || '',
    requested_by: staffMembers[0]?.id?.toString() || '',
    notes: '',
  });

  // Wastage Form State
  const wastageForm = useForm({
    location_id: stockLocations[0]?.id?.toString() || '',
    staff_id: staffMembers[0]?.id?.toString() || '',
    raw_material_id: rawMaterials[0]?.id?.toString() || '',
    quantity: '',
    reason: 'SPILLAGE_PREP',
    notes: '',
  });

  const handleOpenTransferModal = () => {
    if (rawMaterials.length > 0) {
      setTransferItems([{ raw_material_id: rawMaterials[0].id, quantity_requested: 100 }]);
    }
    setShowTransferModal(true);
  };

  const handleAddTransferItem = () => {
    if (rawMaterials.length > 0) {
      setTransferItems([...transferItems, { raw_material_id: rawMaterials[0].id, quantity_requested: 50 }]);
    }
  };

  const handleRemoveTransferItem = (index: number) => {
    setTransferItems(transferItems.filter((_, idx) => idx !== index));
  };

  const handleTransferItemChange = (index: number, field: 'raw_material_id' | 'quantity_requested', val: any) => {
    const updated = [...transferItems];
    updated[index] = { ...updated[index], [field]: val };
    setTransferItems(updated);
  };

  const handleSaveTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    router.post(
      '/inventory/transfers',
      {
        ...transferForm.data,
        items: transferItems,
      },
      {
        onSuccess: () => {
          setShowTransferModal(false);
          transferForm.reset();
        },
      }
    );
  };

  const handleAdvanceStatus = (transferId: number, nextStatus: string) => {
    const staffId = staffMembers[0]?.id || 1;
    router.post(`/inventory/transfers/${transferId}/status`, {
      status: nextStatus,
      staff_id: staffId,
    });
  };

  const handleSaveWastage = (e: React.FormEvent) => {
    e.preventDefault();
    wastageForm.post('/inventory/wastage', {
      onSuccess: () => {
        setShowWastageModal(false);
        wastageForm.reset();
      },
    });
  };

  const selectedWastageMaterial = rawMaterials.find((m) => m.id === Number(wastageForm.data.raw_material_id));
  const liveWastageCost = selectedWastageMaterial
    ? (Number(wastageForm.data.quantity) || 0) * (Number(selectedWastageMaterial.standard_cost_per_base_unit) || 0)
    : 0;

  return (
    <AdminLayout title="Stock Transfers & Wastage Control">
      <Head title="Transfers & Wastage" />

      {/* Header & Tabs */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Stock Movement & Wastage Audit Hub</h4>
          <p className="text-muted mb-0 small">
            Orchestrate multi-step inventory dispatch between central warehouses and kiosk stockrooms, and log physical wastage.
          </p>
        </div>

        <div className="d-flex gap-2">
          {activeTab === 'transfers' ? (
            <button onClick={handleOpenTransferModal} className="btn btn-primary btn-sm d-flex align-items-center gap-1">
              <Plus size={16} />
              <span>Request Stock Transfer</span>
            </button>
          ) : (
            <button onClick={() => setShowWastageModal(true)} className="btn btn-danger btn-sm d-flex align-items-center gap-1">
              <Plus size={16} />
              <span>Log Wastage / Spoilage</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <ul className="nav nav-pills mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'transfers' ? 'active' : ''} d-flex align-items-center gap-2`}
            onClick={() => setActiveTab('transfers')}
          >
            <ArrowLeftRight size={16} />
            <span>Stock Transfers ({transfers.length})</span>
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'wastage' ? 'active text-white bg-danger' : ''} d-flex align-items-center gap-2`}
            onClick={() => setActiveTab('wastage')}
          >
            <AlertTriangle size={16} />
            <span>Wastage Log ({wastages.length})</span>
          </button>
        </li>
      </ul>

      {/* Tab 1: Transfers */}
      {activeTab === 'transfers' && (
        <div className="mk-card border-0 shadow-sm overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Transfer #</th>
                  <th>Route (Origin &rarr; Destination)</th>
                  <th>Items & Quantities</th>
                  <th>Status</th>
                  <th>Requested By</th>
                  <th className="text-end">Workflow Actions</th>
                </tr>
              </thead>
              <tbody>
                {transfers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-muted small">
                      No stock transfers found. Click "Request Stock Transfer" to initiate stock movement.
                    </td>
                  </tr>
                ) : (
                  transfers.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <div className="font-monospace fw-bold text-dark">{t.transfer_number}</div>
                        <span className="text-muted small" style={{ fontSize: '0.75rem' }}>{t.created_at}</span>
                      </td>
                      <td>
                        <div className="small">
                          <span className="fw-semibold text-dark">{t.source_location}</span>
                          <span className="mx-2 text-muted">&rarr;</span>
                          <span className="fw-semibold text-primary">{t.dest_location}</span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-1">
                          {t.items.map((i) => (
                            <span key={i.id} className="badge badge-soft-secondary text-dark text-start small font-monospace">
                              {i.raw_material_name}: {i.quantity_requested} {i.base_uom}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            t.status === 'RECEIVED'
                              ? 'bg-success'
                              : t.status === 'DISPATCHED'
                              ? 'bg-primary'
                              : t.status === 'APPROVED'
                              ? 'bg-info text-dark'
                              : t.status === 'CANCELLED'
                              ? 'bg-danger'
                              : 'bg-warning text-dark'
                          } rounded-pill`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td>
                        <span className="small text-dark">{t.requested_by_name}</span>
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          {t.status === 'REQUESTED' && (
                            <>
                              <button
                                onClick={() => handleAdvanceStatus(t.id, 'APPROVED')}
                                className="btn btn-outline-info py-1 px-2"
                                title="Approve Transfer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleAdvanceStatus(t.id, 'CANCELLED')}
                                className="btn btn-outline-danger py-1 px-2"
                                title="Cancel Transfer"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {(t.status === 'REQUESTED' || t.status === 'APPROVED') && (
                            <button
                              onClick={() => handleAdvanceStatus(t.id, 'DISPATCHED')}
                              className="btn btn-primary py-1 px-2 d-flex align-items-center gap-1"
                              title="Dispatch from Source"
                            >
                              <Truck size={13} /> Dispatch
                            </button>
                          )}
                          {t.status === 'DISPATCHED' && (
                            <button
                              onClick={() => handleAdvanceStatus(t.id, 'RECEIVED')}
                              className="btn btn-success py-1 px-2 d-flex align-items-center gap-1"
                              title="Receive into Destination"
                            >
                              <PackageCheck size={13} /> Receive at Kiosk
                            </button>
                          )}
                          {t.status === 'RECEIVED' && (
                            <span className="badge badge-soft-success d-flex align-items-center gap-1">
                              <CheckCircle size={13} /> Completed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Wastage Log */}
      {activeTab === 'wastage' && (
        <div className="mk-card border-0 shadow-sm overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Date & Time</th>
                  <th>Stock Location</th>
                  <th>Raw Material Spoilage</th>
                  <th>Reason Code</th>
                  <th>Cost Impact</th>
                  <th>Reported By</th>
                </tr>
              </thead>
              <tbody>
                {wastages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-muted small">
                      No wastage records logged. Click "Log Wastage" to record damaged or expired inventory.
                    </td>
                  </tr>
                ) : (
                  wastages.map((w) => (
                    <tr key={w.id}>
                      <td>
                        <span className="font-monospace small text-dark">{w.created_at}</span>
                      </td>
                      <td>
                        <span className="fw-semibold text-dark small">{w.location_name}</span>
                      </td>
                      <td>
                        <div className="fw-bold text-dark">{w.raw_material_name}</div>
                        <span className="font-monospace text-danger small">
                          - {w.quantity.toFixed(1)} {w.base_uom}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-soft-danger">{w.reason}</span>
                      </td>
                      <td>
                        <span className="font-monospace fw-bold text-danger">
                          RM {w.cost_impact.toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <span className="small text-muted">{w.staff_name}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create Stock Transfer */}
      {showTransferModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <ArrowLeftRight size={20} className="text-primary" />
                  Initiate Stock Transfer Request
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowTransferModal(false)}></button>
              </div>

              <form onSubmit={handleSaveTransfer}>
                <div className="modal-body">
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold small">Source (Origin) Location *</label>
                      <select
                        className="form-select"
                        value={transferForm.data.source_location_id}
                        onChange={(e) => transferForm.setData('source_location_id', e.target.value)}
                        required
                      >
                        {stockLocations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.location_name} ({loc.location_type})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-6">
                      <label className="form-label fw-semibold small">Destination (Target) Location *</label>
                      <select
                        className="form-select"
                        value={transferForm.data.dest_location_id}
                        onChange={(e) => transferForm.setData('dest_location_id', e.target.value)}
                        required
                      >
                        {stockLocations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.location_name} ({loc.location_type})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Requested By Staff Member *</label>
                    <select
                      className="form-select"
                      value={transferForm.data.requested_by}
                      onChange={(e) => transferForm.setData('requested_by', e.target.value)}
                      required
                    >
                      {staffMembers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.full_name} ({s.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Transfer Line Items *</label>
                    <table className="table table-sm align-middle">
                      <thead className="table-light small">
                        <tr>
                          <th>Raw Material Item</th>
                          <th style={{ width: 160 }}>Quantity to Dispatch</th>
                          <th style={{ width: 40 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {transferItems.map((item, idx) => {
                          const mat = rawMaterials.find((m) => m.id === Number(item.raw_material_id));
                          return (
                            <tr key={idx}>
                              <td>
                                <select
                                  className="form-select form-select-sm"
                                  value={item.raw_material_id}
                                  onChange={(e) => handleTransferItemChange(idx, 'raw_material_id', Number(e.target.value))}
                                  required
                                >
                                  {rawMaterials.map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.name} ({m.sku})
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <div className="input-group input-group-sm">
                                  <input
                                    type="number"
                                    step="1"
                                    min="0.1"
                                    className="form-control font-monospace"
                                    value={item.quantity_requested}
                                    onChange={(e) => handleTransferItemChange(idx, 'quantity_requested', parseFloat(e.target.value) || 0)}
                                    required
                                  />
                                  <span className="input-group-text font-monospace small">
                                    {mat?.base_uom || ''}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTransferItem(idx)}
                                  className="btn btn-xs btn-link text-danger p-0"
                                >
                                  <X size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    <button
                      type="button"
                      onClick={handleAddTransferItem}
                      className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                    >
                      <Plus size={14} /> Add Another Item
                    </button>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowTransferModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    Submit Transfer Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Log Wastage */}
      {showWastageModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold text-danger d-flex align-items-center gap-2">
                  <AlertTriangle size={20} />
                  Record Inventory Spoilage / Wastage
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowWastageModal(false)}></button>
              </div>

              <form onSubmit={handleSaveWastage}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Stock Location *</label>
                    <select
                      className="form-select"
                      value={wastageForm.data.location_id}
                      onChange={(e) => wastageForm.setData('location_id', e.target.value)}
                      required
                    >
                      {stockLocations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.location_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Staff Reporter *</label>
                    <select
                      className="form-select"
                      value={wastageForm.data.staff_id}
                      onChange={(e) => wastageForm.setData('staff_id', e.target.value)}
                      required
                    >
                      {staffMembers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.full_name} ({s.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Raw Material Item *</label>
                    <select
                      className="form-select"
                      value={wastageForm.data.raw_material_id}
                      onChange={(e) => wastageForm.setData('raw_material_id', e.target.value)}
                      required
                    >
                      {rawMaterials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold small">
                        Wasted Quantity ({selectedWastageMaterial?.base_uom || ''}) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        className="form-control font-monospace"
                        placeholder="e.g. 200"
                        value={wastageForm.data.quantity}
                        onChange={(e) => wastageForm.setData('quantity', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold small">Calculated Cost Loss</label>
                      <div className="p-2 rounded bg-light border font-monospace fw-bold text-danger">
                        RM {liveWastageCost.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Reason Code *</label>
                    <select
                      className="form-select"
                      value={wastageForm.data.reason}
                      onChange={(e) => wastageForm.setData('reason', e.target.value)}
                    >
                      <option value="SPILLAGE_PREP">Spillage during preparation</option>
                      <option value="EXPIRED">Product Expired / Spoiled</option>
                      <option value="DAMAGED_TRANSIT">Damaged during transit</option>
                      <option value="DEFECTIVE_BATCH">Defective supplier batch</option>
                      <option value="WRONG_ORDER_REMAKE">Wrong order customer remake</option>
                      <option value="OTHER">Other variance</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Notes</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="Optional details for audit..."
                      value={wastageForm.data.notes}
                      onChange={(e) => wastageForm.setData('notes', e.target.value)}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowWastageModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-danger btn-sm" disabled={wastageForm.processing}>
                    Record Wastage
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
