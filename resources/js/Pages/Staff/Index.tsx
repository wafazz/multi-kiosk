import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import {
  Users,
  Plus,
  Edit2,
  KeyRound,
  CheckCircle,
  Clock,
  CircleDollarSign,
  Shield,
  MapPin
} from 'lucide-react';

interface StaffMember {
  id: number;
  staff_code: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string;
  salary_type: string;
  hourly_rate: number;
  daily_rate: number;
  monthly_rate: number;
  primary_branch_id: number | null;
  primary_branch_name: string;
  is_active: boolean;
  is_clocked_in: boolean;
  current_kiosk: string | null;
  clocked_in_at: string | null;
}

interface Branch {
  id: number;
  name: string;
  code: string;
}

interface Props {
  staffMembers: StaffMember[];
  branches: Branch[];
}

export default function StaffIndex({ staffMembers, branches }: Props) {
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  const staffForm = useForm({
    staff_code: '',
    full_name: '',
    email: '',
    phone: '',
    pin: '',
    role: 'STAFF',
    salary_type: 'HOURLY',
    hourly_rate: '12.00',
    daily_rate: '0.00',
    monthly_rate: '0.00',
    primary_branch_id: branches[0]?.id?.toString() || '',
  });

  const handleOpenModal = (staff?: StaffMember) => {
    if (staff) {
      setEditingStaff(staff);
      staffForm.setData({
        staff_code: staff.staff_code,
        full_name: staff.full_name,
        email: staff.email || '',
        phone: staff.phone || '',
        pin: '',
        role: staff.role,
        salary_type: staff.salary_type,
        hourly_rate: staff.hourly_rate.toString(),
        daily_rate: staff.daily_rate.toString(),
        monthly_rate: staff.monthly_rate.toString(),
        primary_branch_id: staff.primary_branch_id ? staff.primary_branch_id.toString() : '',
      });
    } else {
      setEditingStaff(null);
      staffForm.reset();
    }
    setShowStaffModal(true);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStaff) {
      staffForm.put(`/staff/${editingStaff.id}`, {
        onSuccess: () => {
          setShowStaffModal(false);
          staffForm.reset();
        },
      });
    } else {
      staffForm.post('/staff', {
        onSuccess: () => {
          setShowStaffModal(false);
          staffForm.reset();
        },
      });
    }
  };

  return (
    <AdminLayout title="Staff & Workforce Management">
      <Head title="Staff Directory" />

      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Staff Directory & Roaming Workforce</h4>
          <p className="text-muted mb-0 small">
            Manage employee profiles, assign PIN credentials for kiosk clock-ins, and configure optional hourly wage rates.
          </p>
        </div>

        <button onClick={() => handleOpenModal()} className="btn btn-primary btn-sm d-flex align-items-center gap-1">
          <Plus size={16} />
          <span>Register Staff Member</span>
        </button>
      </div>

      {/* Staff Table */}
      <div className="mk-card border-0 shadow-sm overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Staff Member</th>
                <th>Role & Access</th>
                <th>Assigned Branch</th>
                <th>Compensation Type</th>
                <th>Hourly Wage Rate</th>
                <th>Current Shift Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-muted small">
                    No staff members registered. Click "Register Staff Member" to add one.
                  </td>
                </tr>
              ) : (
                staffMembers.map((staff) => (
                  <tr key={staff.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="rounded-circle bg-primary bg-opacity-10 text-primary fw-bold d-flex align-items-center justify-content-center"
                          style={{ width: 36, height: 36, fontSize: '0.85rem' }}
                        >
                          {staff.full_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-bold text-dark">{staff.full_name}</div>
                          <div className="font-monospace text-muted small" style={{ fontSize: '0.75rem' }}>
                            Code: {staff.staff_code} {staff.phone ? `• ${staff.phone}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-soft-primary small">{staff.role}</span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1 small text-dark">
                        <MapPin size={13} className="text-muted" />
                        <span>{staff.primary_branch_name}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          staff.salary_type === 'HOURLY'
                            ? 'badge-soft-warning'
                            : staff.salary_type === 'MONTHLY'
                            ? 'badge-soft-info'
                            : 'badge-soft-secondary'
                        }`}
                      >
                        {staff.salary_type}
                      </span>
                    </td>
                    <td>
                      {staff.salary_type === 'HOURLY' ? (
                        <span className="font-monospace fw-bold text-dark">
                          RM {staff.hourly_rate.toFixed(2)} / hr
                        </span>
                      ) : (
                        <span className="text-muted small">N/A</span>
                      )}
                    </td>
                    <td>
                      {staff.is_clocked_in ? (
                        <div>
                          <span className="badge badge-soft-success d-flex align-items-center gap-1" style={{ width: 'fit-content' }}>
                            <Clock size={12} /> On Duty
                          </span>
                          <div className="text-muted small" style={{ fontSize: '0.7rem' }}>
                            {staff.current_kiosk} ({staff.clocked_in_at})
                          </div>
                        </div>
                      ) : (
                        <span className="badge badge-soft-secondary">Off Duty</span>
                      )}
                    </td>
                    <td className="text-end">
                      <button
                        onClick={() => handleOpenModal(staff)}
                        className="btn btn-sm btn-outline-secondary"
                        title="Edit Details & PIN"
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

      {/* Modal: Create / Edit Staff */}
      {showStaffModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  {editingStaff ? `Edit ${editingStaff.full_name}` : 'Register Staff Member'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowStaffModal(false)}></button>
              </div>

              <form onSubmit={handleSaveStaff}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Nurul Huda"
                      value={staffForm.data.full_name}
                      onChange={(e) => staffForm.setData('full_name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold small">Staff Code *</label>
                      <input
                        type="text"
                        className="form-control text-uppercase font-monospace"
                        placeholder="e.g. STF-001"
                        value={staffForm.data.staff_code}
                        onChange={(e) => staffForm.setData('staff_code', e.target.value)}
                        required
                        disabled={editingStaff !== null}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold small">
                        Kiosk PIN (4-6 digits) {editingStaff ? '(Leave blank to keep)' : '*'}
                      </label>
                      <input
                        type="password"
                        maxLength={6}
                        className="form-control font-monospace"
                        placeholder="1234"
                        value={staffForm.data.pin}
                        onChange={(e) => staffForm.setData('pin', e.target.value)}
                        required={editingStaff === null}
                      />
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold small">Role *</label>
                      <select
                        className="form-select"
                        value={staffForm.data.role}
                        onChange={(e) => staffForm.setData('role', e.target.value)}
                      >
                        <option value="STAFF">Staff / Barista</option>
                        <option value="KIOSK_MANAGER">Kiosk Manager</option>
                        <option value="BRANCH_MANAGER">Branch Manager</option>
                        <option value="HQ_ADMIN">HQ Admin</option>
                        <option value="SUPER_ADMIN">Super Admin</option>
                        <option value="FINANCE">Finance & Audit</option>
                      </select>
                    </div>

                    <div className="col-6">
                      <label className="form-label fw-semibold small">Primary Base Branch</label>
                      <select
                        className="form-select"
                        value={staffForm.data.primary_branch_id}
                        onChange={(e) => staffForm.setData('primary_branch_id', e.target.value)}
                      >
                        <option value="">All Branches (Roaming)</option>
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold small">Salary Calculation Type *</label>
                      <select
                        className="form-select"
                        value={staffForm.data.salary_type}
                        onChange={(e) => staffForm.setData('salary_type', e.target.value)}
                      >
                        <option value="HOURLY">Hourly Rate (Time Clocked)</option>
                        <option value="DAILY">Daily Flat Rate</option>
                        <option value="MONTHLY">Monthly Fixed Base</option>
                        <option value="NONE">None / Exempt</option>
                      </select>
                    </div>

                    <div className="col-6">
                      <label className="form-label fw-semibold small">Hourly Rate (RM / hr)</label>
                      <input
                        type="number"
                        step="0.50"
                        className="form-control font-monospace"
                        placeholder="12.00"
                        value={staffForm.data.hourly_rate}
                        onChange={(e) => staffForm.setData('hourly_rate', e.target.value)}
                        disabled={staffForm.data.salary_type !== 'HOURLY'}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Contact Phone</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="+60 12-345 6789"
                      value={staffForm.data.phone}
                      onChange={(e) => staffForm.setData('phone', e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowStaffModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={staffForm.processing}>
                    Save Staff Member
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
