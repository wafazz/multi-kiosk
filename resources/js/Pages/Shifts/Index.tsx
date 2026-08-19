import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import {
  Banknote,
  Clock,
  Printer,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  FileText,
  DollarSign,
  TrendingUp,
  User,
  Store,
  Eye,
  Calendar
} from 'lucide-react';

interface KioskShift {
  id: number;
  branch: { name: string; code: string };
  kiosk: { kiosk_code: string; kiosk_name: string };
  opened_by_staff: { full_name: string; staff_code: string };
  closed_by_staff?: { full_name: string; staff_code: string };
  opened_at: string;
  closed_at?: string;
  opening_cash_float: number;
  closing_cash_counted?: number;
  expected_cash_total: number;
  cash_variance: number;
  total_sales_gross: number;
  total_tax_collected: number;
  total_material_cost: number;
  total_cash_sales: number;
  total_card_sales: number;
  total_qr_sales: number;
  total_orders_count: number;
  status: 'OPEN' | 'CLOSED' | 'FORCE_CLOSED';
  closing_notes?: string;
}

interface Props {
  shifts: {
    data: KioskShift[];
    links: any[];
    total: number;
    current_page: number;
  };
  branches: Array<{ id: number; name: string; code: string }>;
  kiosks: Array<{ id: number; branch_id: number; kiosk_code: string; kiosk_name: string }>;
  filters: {
    branch_id?: string;
    kiosk_id?: string;
    status?: string;
  };
  stats: {
    total_sales: number;
    total_cash: number;
    total_variance: number;
    open_shifts_count: number;
  };
}

export default function ShiftsIndex({ shifts, branches, kiosks, filters, stats }: Props) {
  const [selectedBranch, setSelectedBranch] = useState(filters.branch_id || '');
  const [selectedKiosk, setSelectedKiosk] = useState(filters.kiosk_id || '');
  const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
  const [activeZReport, setActiveZReport] = useState<KioskShift | null>(null);

  const handleFilter = () => {
    router.get(
      '/shifts',
      {
        branch_id: selectedBranch || undefined,
        kiosk_id: selectedKiosk || undefined,
        status: selectedStatus || undefined,
      },
      { preserveState: true }
    );
  };

  const handleReset = () => {
    setSelectedBranch('');
    setSelectedKiosk('');
    setSelectedStatus('');
    router.get('/shifts');
  };

  return (
    <AdminLayout title="Shift Management & Cash Till Reconciliation (Z-Reports)">
      <Head title="Shift & Cash Till (Z-Reports)" />

      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Shift Management & Cash Reconciliation (Z-Reports)</h4>
          <p className="text-muted mb-0 small">
            Monitor opening cash floats, mid-shift live telemetry, end-of-shift blind cash counts, and audit financial variances across all kiosks.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="mk-card p-3 border-0 shadow-sm">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small">Total Shift Sales</span>
                <h4 className="fw-bold text-dark mb-0 font-monospace">RM {stats.total_sales.toFixed(2)}</h4>
              </div>
              <div className="rounded p-2 bg-primary bg-opacity-10 text-primary">
                <TrendingUp size={20} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="mk-card p-3 border-0 shadow-sm">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small">Total Cash Collected</span>
                <h4 className="fw-bold text-success mb-0 font-monospace">RM {stats.total_cash.toFixed(2)}</h4>
              </div>
              <div className="rounded p-2 bg-success bg-opacity-10 text-success">
                <Banknote size={20} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="mk-card p-3 border-0 shadow-sm">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small">Net Cash Variance</span>
                <h4
                  className={`fw-bold mb-0 font-monospace ${
                    stats.total_variance < 0 ? 'text-danger' : stats.total_variance > 0 ? 'text-warning' : 'text-success'
                  }`}
                >
                  {stats.total_variance >= 0 ? `+RM ${stats.total_variance.toFixed(2)}` : `-RM ${Math.abs(stats.total_variance).toFixed(2)}`}
                </h4>
              </div>
              <div
                className={`rounded p-2 ${
                  stats.total_variance < 0 ? 'bg-danger bg-opacity-10 text-danger' : 'bg-success bg-opacity-10 text-success'
                }`}
              >
                <DollarSign size={20} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="mk-card p-3 border-0 shadow-sm">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small">Active Open Shifts</span>
                <h4 className="fw-bold text-info mb-0 font-monospace">{stats.open_shifts_count} Shifts</h4>
              </div>
              <div className="rounded p-2 bg-info bg-opacity-10 text-info">
                <Clock size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mk-card p-3 mb-4 border-0 shadow-sm">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-3">
            <label className="form-label small text-muted mb-1">Branch</label>
            <select className="form-select form-select-sm" value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label small text-muted mb-1">Kiosk</label>
            <select className="form-select form-select-sm" value={selectedKiosk} onChange={(e) => setSelectedKiosk(e.target.value)}>
              <option value="">All Kiosks</option>
              {kiosks.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.kiosk_code} - {k.kiosk_name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-2">
            <label className="form-label small text-muted mb-1">Shift Status</label>
            <select className="form-select form-select-sm" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="OPEN">Open (In Progress)</option>
              <option value="CLOSED">Closed (Z-Report Done)</option>
            </select>
          </div>

          <div className="col-12 col-md-4 d-flex gap-2 align-items-end pt-3 pt-md-0">
            <button onClick={handleFilter} className="btn btn-primary btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1">
              <Filter size={14} /> Filter Shifts
            </button>
            <button onClick={handleReset} className="btn btn-outline-secondary btn-sm">
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Shifts Ledger Table */}
      <div className="mk-card border-0 shadow-sm overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light small">
              <tr>
                <th>Shift #</th>
                <th>Kiosk / Branch</th>
                <th>Cashier / Staff</th>
                <th>Duration / Time</th>
                <th>Starting Float</th>
                <th>Gross Cash Sales</th>
                <th>Expected Till</th>
                <th>Physical Counted</th>
                <th>Cash Variance</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shifts.data.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-5 text-muted">
                    <Banknote size={36} className="mb-2 opacity-50 mx-auto d-block" />
                    <div>No shift records found for the selected filters.</div>
                  </td>
                </tr>
              ) : (
                shifts.data.map((shift) => (
                  <tr key={shift.id}>
                    <td>
                      <span className="font-monospace fw-bold text-primary">#{shift.id}</span>
                    </td>
                    <td>
                      <div className="fw-bold text-dark">{shift.kiosk?.kiosk_name || 'Kiosk'}</div>
                      <div className="text-muted small">
                        {shift.branch?.name} • <span className="font-monospace">{shift.kiosk?.kiosk_code}</span>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1">
                        <User size={13} className="text-muted" />
                        <span className="fw-semibold small text-dark">{shift.opened_by_staff?.full_name}</span>
                      </div>
                      {shift.closed_by_staff && shift.closed_by_staff.full_name !== shift.opened_by_staff?.full_name && (
                        <div className="text-muted small" style={{ fontSize: '0.7rem' }}>
                          Closed by: {shift.closed_by_staff.full_name}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="small text-dark font-monospace">{new Date(shift.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="text-muted small" style={{ fontSize: '0.7rem' }}>
                        {new Date(shift.opened_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <span className="font-monospace text-dark">RM {Number(shift.opening_cash_float).toFixed(2)}</span>
                    </td>
                    <td>
                      <span className="font-monospace text-success fw-semibold">
                        +RM {Number(shift.total_cash_sales || 0).toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <span className="font-monospace fw-bold text-dark">
                        RM {Number(shift.expected_cash_total || shift.opening_cash_float).toFixed(2)}
                      </span>
                    </td>
                    <td>
                      {shift.closing_cash_counted !== null && shift.closing_cash_counted !== undefined ? (
                        <span className="font-monospace fw-bold text-info">
                          RM {Number(shift.closing_cash_counted).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted small">In Progress</span>
                      )}
                    </td>
                    <td>
                      {shift.status === 'CLOSED' ? (
                        <span
                          className={`badge font-monospace ${
                            Number(shift.cash_variance) === 0
                              ? 'badge-soft-success'
                              : Number(shift.cash_variance) < 0
                              ? 'badge-soft-danger'
                              : 'badge-soft-warning'
                          }`}
                        >
                          {Number(shift.cash_variance) === 0
                            ? 'MATCH (RM 0.00)'
                            : Number(shift.cash_variance) > 0
                            ? `+RM ${Number(shift.cash_variance).toFixed(2)} (OVER)`
                            : `-RM ${Math.abs(Number(shift.cash_variance)).toFixed(2)} (SHORT)`}
                        </span>
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${shift.status === 'OPEN' ? 'badge-soft-info' : 'badge-soft-secondary'}`}>
                        {shift.status}
                      </span>
                    </td>
                    <td className="text-end">
                      <button
                        onClick={() => setActiveZReport(shift)}
                        className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 ms-auto"
                      >
                        <FileText size={13} /> <span>Z-Report</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Official Z-Report Preview */}
      {activeZReport && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 440 }}>
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2 small">
                  <FileText size={16} /> Official Z-Report — Shift #{activeZReport.id}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setActiveZReport(null)}></button>
              </div>

              <div className="modal-body p-3 font-monospace small bg-light">
                <div className="p-3 bg-white border rounded shadow-sm text-center">
                  <h6 className="fw-bold text-dark mb-0">MULTI-KIOSK ENTERPRISE</h6>
                  <div className="text-muted small">{activeZReport.branch?.name}</div>
                  <div className="text-muted small">
                    Kiosk: {activeZReport.kiosk?.kiosk_code} ({activeZReport.kiosk?.kiosk_name})
                  </div>
                  <div className="border-bottom my-2"></div>
                  <div className="fw-bold text-dark">*** SHIFT Z-REPORT ***</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    Opened: {new Date(activeZReport.opened_at).toLocaleString()}
                  </div>
                  {activeZReport.closed_at && (
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      Closed: {new Date(activeZReport.closed_at).toLocaleString()}
                    </div>
                  )}
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    Cashier: {activeZReport.opened_by_staff?.full_name}
                  </div>
                  <div className="border-bottom my-2"></div>

                  {/* Tender Breakdown */}
                  <div className="text-start">
                    <div className="fw-bold text-dark mb-1">SALES BY TENDER:</div>
                    <div className="d-flex justify-content-between">
                      <span>Total Completed Orders:</span>
                      <span>{activeZReport.total_orders_count}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Gross Sales Revenue:</span>
                      <span>RM {Number(activeZReport.total_sales_gross || 0).toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>SST Tax Collected (6%):</span>
                      <span>RM {Number(activeZReport.total_tax_collected || 0).toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between text-success">
                      <span>Cash Sales:</span>
                      <span>RM {Number(activeZReport.total_cash_sales || 0).toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Card Sales:</span>
                      <span>RM {Number(activeZReport.total_card_sales || 0).toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>DuitNow QR Sales:</span>
                      <span>RM {Number(activeZReport.total_qr_sales || 0).toFixed(2)}</span>
                    </div>

                    <div className="border-bottom my-2"></div>

                    {/* Cash Reconciliation */}
                    <div className="fw-bold text-dark mb-1">CASH TILL RECONCILIATION:</div>
                    <div className="d-flex justify-content-between">
                      <span>Starting Cash Float:</span>
                      <span>RM {Number(activeZReport.opening_cash_float).toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between text-success">
                      <span>+ Cash Sales Collected:</span>
                      <span>+RM {Number(activeZReport.total_cash_sales || 0).toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between fw-bold text-dark border-top pt-1 mt-1">
                      <span>Expected Till Cash:</span>
                      <span>RM {Number(activeZReport.expected_cash_total).toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between fw-bold text-primary">
                      <span>Physical Cash Counted:</span>
                      <span>RM {Number(activeZReport.closing_cash_counted || 0).toFixed(2)}</span>
                    </div>

                    <div className="border-top my-2"></div>

                    {/* Variance Line */}
                    <div className="d-flex justify-content-between fw-bold fs-6">
                      <span>CASH VARIANCE:</span>
                      <span
                        className={
                          Number(activeZReport.cash_variance) < 0
                            ? 'text-danger'
                            : Number(activeZReport.cash_variance) > 0
                            ? 'text-warning'
                            : 'text-success'
                        }
                      >
                        {Number(activeZReport.cash_variance) >= 0
                          ? `+RM ${Number(activeZReport.cash_variance).toFixed(2)}`
                          : `-RM ${Math.abs(Number(activeZReport.cash_variance)).toFixed(2)}`}
                      </span>
                    </div>
                  </div>

                  <div className="border-bottom my-2"></div>
                  <div className="text-center text-muted" style={{ fontSize: '0.7rem' }}>
                    FINANCIAL AUDIT TRAIL LOGGED
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveZReport(null)}>
                  Close
                </button>
                <button type="button" className="btn btn-primary btn-sm d-flex align-items-center gap-1" onClick={() => window.print()}>
                  <Printer size={14} /> Print Z-Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
