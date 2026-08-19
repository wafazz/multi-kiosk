import React from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import {
  CircleDollarSign,
  Clock,
  Filter,
  Users,
  Calendar,
  Download,
  Building,
  TrendingUp
} from 'lucide-react';

interface PayrollSummary {
  staff_id: number;
  staff_code: string;
  full_name: string;
  role: string;
  salary_type: string;
  hourly_rate: number;
  primary_branch_name: string;
  total_shifts: number;
  total_raw_hours: number;
  total_payable_hours: number;
  gross_earnings: number;
}

interface Branch {
  id: number;
  name: string;
}

interface Props {
  payrollSummaries: PayrollSummary[];
  grandTotals: {
    total_payable_hours: number;
    total_gross_earnings: number;
    staff_count: number;
  };
  branches: Branch[];
  filters: {
    start_date: string;
    end_date: string;
    branch_id?: string;
  };
}

export default function PayrollIndex({
  payrollSummaries,
  grandTotals,
  branches,
  filters,
}: Props) {
  const filterForm = useForm({
    start_date: filters.start_date,
    end_date: filters.end_date,
    branch_id: filters.branch_id || '',
  });

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/payroll', filterForm.data as any, { preserveState: true });
  };

  return (
    <AdminLayout title="Hourly Payroll & Labor Cost Intelligence">
      <Head title="Hourly Payroll Reports" />

      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Workforce Hourly Payroll & Wage Reports</h4>
          <p className="text-muted mb-0 small">
            Consolidated payable working hours, 15-minute standard rounding calculations, and gross earnings breakdown.
          </p>
        </div>
      </div>

      {/* Grand Totals KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="mk-stat-card border-0 shadow-sm">
            <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.75rem' }}>
              Total Gross Payroll (Period)
            </span>
            <h3 className="fw-bold text-success mt-2 mb-1">
              RM {grandTotals.total_gross_earnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h3>
            <span className="badge badge-soft-success small">Direct Labour Expense</span>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="mk-stat-card border-0 shadow-sm">
            <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.75rem' }}>
              Total Payable Working Hours
            </span>
            <h3 className="fw-bold text-dark mt-2 mb-1">
              {grandTotals.total_payable_hours.toFixed(2)} hrs
            </h3>
            <span className="badge badge-soft-primary small">15-Minute Rounded Work Time</span>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="mk-stat-card border-0 shadow-sm">
            <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.75rem' }}>
              Active Workforce Size
            </span>
            <h3 className="fw-bold text-primary mt-2 mb-1">
              {grandTotals.staff_count} Staff
            </h3>
            <span className="badge badge-soft-info small">Across All Branches</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mk-card p-3 mb-4 border-0 shadow-sm">
        <form onSubmit={handleFilter} className="row g-2 align-items-end">
          <div className="col-12 col-md-3">
            <label className="form-label small text-muted mb-1">Start Date</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={filterForm.data.start_date}
              onChange={(e) => filterForm.setData('start_date', e.target.value)}
            />
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label small text-muted mb-1">End Date</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={filterForm.data.end_date}
              onChange={(e) => filterForm.setData('end_date', e.target.value)}
            />
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label small text-muted mb-1">Branch</label>
            <select
              className="form-select form-select-sm"
              value={filterForm.data.branch_id}
              onChange={(e) => filterForm.setData('branch_id', e.target.value)}
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-3 d-flex gap-2">
            <button type="submit" className="btn btn-primary btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1">
              <Filter size={14} /> Apply Date Range
            </button>
          </div>
        </form>
      </div>

      {/* Payroll Table */}
      <div className="mk-card border-0 shadow-sm overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Staff Member</th>
                <th>Role & Branch</th>
                <th>Compensation Type</th>
                <th>Base Hourly Rate</th>
                <th>Total Completed Shifts</th>
                <th>Raw Hours</th>
                <th>Payable Hours (Rounded)</th>
                <th className="text-end">Gross Wages (RM)</th>
              </tr>
            </thead>
            <tbody>
              {payrollSummaries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted small">
                    No workforce payroll data found for the selected date range.
                  </td>
                </tr>
              ) : (
                payrollSummaries.map((s) => (
                  <tr key={s.staff_id}>
                    <td>
                      <div className="fw-bold text-dark">{s.full_name}</div>
                      <span className="font-monospace text-muted small">{s.staff_code}</span>
                    </td>
                    <td>
                      <div className="small text-dark">{s.role}</div>
                      <div className="text-muted small" style={{ fontSize: '0.75rem' }}>{s.primary_branch_name}</div>
                    </td>
                    <td>
                      <span className={`badge ${s.salary_type === 'HOURLY' ? 'badge-soft-warning' : 'badge-soft-secondary'}`}>
                        {s.salary_type}
                      </span>
                    </td>
                    <td>
                      {s.salary_type === 'HOURLY' ? (
                        <span className="font-monospace fw-semibold text-dark">
                          RM {s.hourly_rate.toFixed(2)} / hr
                        </span>
                      ) : (
                        <span className="text-muted small">Fixed</span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-soft-secondary font-monospace">
                        {s.total_shifts} Shifts
                      </span>
                    </td>
                    <td>
                      <span className="font-monospace small text-muted">{s.total_raw_hours.toFixed(2)} hrs</span>
                    </td>
                    <td>
                      <span className="font-monospace fw-bold text-dark">
                        {s.total_payable_hours.toFixed(2)} hrs
                      </span>
                    </td>
                    <td className="text-end">
                      <span className="font-monospace fw-bold text-success fs-6">
                        RM {s.gross_earnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
