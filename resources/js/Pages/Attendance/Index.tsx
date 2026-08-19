import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import {
  Clock,
  Edit2,
  Calendar,
  Filter,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  MapPin
} from 'lucide-react';

interface AttendanceRecord {
  id: number;
  staff_name: string;
  staff_code: string;
  salary_type: string;
  kiosk_in_name: string;
  kiosk_out_name: string;
  clock_in_at: string;
  clock_out_at: string | null;
  raw_duration_minutes: number;
  payable_duration_minutes: number;
  hourly_rate_snapshot: number;
  gross_earnings: number;
  status: string;
  adjusted_by_name: string | null;
  adjustment_reason: string | null;
}

interface StaffMember {
  id: number;
  full_name: string;
  staff_code: string;
}

interface Branch {
  id: number;
  name: string;
}

interface Kiosk {
  id: number;
  kiosk_name: string;
  kiosk_code: string;
}

interface Props {
  attendances: AttendanceRecord[];
  staffMembers: StaffMember[];
  branches: Branch[];
  kiosks: Kiosk[];
  filters: {
    staff_id?: string;
    kiosk_id?: string;
    branch_id?: string;
    date?: string;
  };
}

export default function AttendanceIndex({
  attendances,
  staffMembers,
  branches,
  kiosks,
  filters,
}: Props) {
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  const filterForm = useForm({
    staff_id: filters.staff_id || '',
    kiosk_id: filters.kiosk_id || '',
    branch_id: filters.branch_id || '',
    date: filters.date || '',
  });

  const adjustForm = useForm({
    clock_in_at: '',
    clock_out_at: '',
    adjusted_by: staffMembers[0]?.id?.toString() || '',
    adjustment_reason: '',
  });

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/attendance', filterForm.data as any, { preserveState: true });
  };

  const handleResetFilter = () => {
    filterForm.setData({
      staff_id: '',
      kiosk_id: '',
      branch_id: '',
      date: '',
    });
    router.get('/attendance');
  };

  const handleOpenAdjust = (rec: AttendanceRecord) => {
    setSelectedRecord(rec);
    adjustForm.setData({
      clock_in_at: rec.clock_in_at.replace(' ', 'T').substring(0, 16),
      clock_out_at: rec.clock_out_at ? rec.clock_out_at.replace(' ', 'T').substring(0, 16) : '',
      adjusted_by: staffMembers[0]?.id?.toString() || '',
      adjustment_reason: rec.adjustment_reason || '',
    });
    setShowAdjustModal(true);
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    adjustForm.post(`/attendance/${selectedRecord.id}/adjust`, {
      onSuccess: () => {
        setShowAdjustModal(false);
      },
    });
  };

  return (
    <AdminLayout title="Attendance & Workforce Timekeeping">
      <Head title="Attendance Logs" />

      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Workforce Attendance & Shift Audit Logs</h4>
          <p className="text-muted mb-0 small">
            Live and historical staff clock-in/out records across all physical kiosks with automated 15-minute rounding and manager overrides.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mk-card p-3 mb-4 border-0 shadow-sm">
        <form onSubmit={handleFilter} className="row g-2 align-items-end">
          <div className="col-12 col-md-3">
            <label className="form-label small text-muted mb-1">Filter by Staff Member</label>
            <select
              className="form-select form-select-sm"
              value={filterForm.data.staff_id}
              onChange={(e) => filterForm.setData('staff_id', e.target.value)}
            >
              <option value="">All Staff</option>
              {staffMembers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.staff_code})
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label small text-muted mb-1">Filter by Kiosk Terminal</label>
            <select
              className="form-select form-select-sm"
              value={filterForm.data.kiosk_id}
              onChange={(e) => filterForm.setData('kiosk_id', e.target.value)}
            >
              <option value="">All Kiosks</option>
              {kiosks.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.kiosk_name} ({k.kiosk_code})
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label small text-muted mb-1">Filter by Date</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={filterForm.data.date}
              onChange={(e) => filterForm.setData('date', e.target.value)}
            />
          </div>

          <div className="col-12 col-md-3 d-flex gap-2">
            <button type="submit" className="btn btn-primary btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1">
              <Filter size={14} /> Filter
            </button>
            <button type="button" onClick={handleResetFilter} className="btn btn-outline-secondary btn-sm">
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Attendance Table */}
      <div className="mk-card border-0 shadow-sm overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Staff Name</th>
                <th>Origin & Exit Kiosk</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Duration (Raw / Payable)</th>
                <th>Hourly Rate</th>
                <th>Gross Earnings</th>
                <th>Status</th>
                <th className="text-end">Adjust</th>
              </tr>
            </thead>
            <tbody>
              {attendances.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-5 text-muted small">
                    No attendance records found matching the current filters.
                  </td>
                </tr>
              ) : (
                attendances.map((rec) => (
                  <tr key={rec.id}>
                    <td>
                      <div className="fw-bold text-dark">{rec.staff_name}</div>
                      <span className="font-monospace text-muted small">{rec.staff_code}</span>
                    </td>
                    <td>
                      <div className="small">
                        <span className="fw-semibold text-dark">{rec.kiosk_in_name}</span>
                        {rec.kiosk_out_name !== rec.kiosk_in_name && rec.status !== 'OPEN' && (
                          <span className="text-primary small ms-1">&rarr; {rec.kiosk_out_name}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="font-monospace small text-dark">{rec.clock_in_at}</span>
                    </td>
                    <td>
                      {rec.clock_out_at ? (
                        <span className="font-monospace small text-dark">{rec.clock_out_at}</span>
                      ) : (
                        <span className="badge badge-soft-success">In Progress</span>
                      )}
                    </td>
                    <td>
                      <div className="font-monospace small">
                        <span className="fw-bold text-dark">
                          {(rec.payable_duration_minutes / 60).toFixed(2)} hrs
                        </span>
                        <span className="text-muted ms-1" style={{ fontSize: '0.75rem' }}>
                          ({rec.payable_duration_minutes}m rounded)
                        </span>
                      </div>
                    </td>
                    <td>
                      {rec.salary_type === 'HOURLY' ? (
                        <span className="font-monospace small text-muted">
                          RM {rec.hourly_rate_snapshot.toFixed(2)}/hr
                        </span>
                      ) : (
                        <span className="badge badge-soft-secondary">{rec.salary_type}</span>
                      )}
                    </td>
                    <td>
                      <span className="font-monospace fw-bold text-success">
                        RM {rec.gross_earnings.toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          rec.status === 'COMPLETED'
                            ? 'badge-soft-success'
                            : rec.status === 'OPEN'
                            ? 'bg-success text-white'
                            : rec.status === 'ADJUSTED'
                            ? 'badge-soft-info'
                            : 'badge-soft-danger'
                        }`}
                      >
                        {rec.status}
                      </span>
                      {rec.adjusted_by_name && (
                        <div className="text-muted" style={{ fontSize: '0.65rem' }}>
                          Adj by {rec.adjusted_by_name}
                        </div>
                      )}
                    </td>
                    <td className="text-end">
                      <button
                        onClick={() => handleOpenAdjust(rec)}
                        className="btn btn-sm btn-outline-secondary"
                        title="Adjust Clock Times"
                      >
                        <Edit2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Manager Attendance Adjustment */}
      {showAdjustModal && selectedRecord && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Manual Punch Adjustment</h5>
                <button type="button" className="btn-close" onClick={() => setShowAdjustModal(false)}></button>
              </div>

              <form onSubmit={handleSaveAdjustment}>
                <div className="modal-body">
                  <div className="p-3 bg-light rounded-3 mb-3">
                    <div className="fw-bold text-dark">{selectedRecord.staff_name} ({selectedRecord.staff_code})</div>
                    <div className="text-muted small">Shift Record #{selectedRecord.id} • Kiosk: {selectedRecord.kiosk_in_name}</div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Clock In Timestamp *</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={adjustForm.data.clock_in_at}
                      onChange={(e) => adjustForm.setData('clock_in_at', e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Clock Out Timestamp *</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={adjustForm.data.clock_out_at}
                      onChange={(e) => adjustForm.setData('clock_out_at', e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Approving Manager *</label>
                    <select
                      className="form-select"
                      value={adjustForm.data.adjusted_by}
                      onChange={(e) => adjustForm.setData('adjusted_by', e.target.value)}
                      required
                    >
                      {staffMembers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.full_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Adjustment Audit Reason *</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="e.g. Staff forgot to clock out due to emergency closing..."
                      value={adjustForm.data.adjustment_reason}
                      onChange={(e) => adjustForm.setData('adjustment_reason', e.target.value)}
                      required
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAdjustModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={adjustForm.processing}>
                    Apply Adjustment
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
