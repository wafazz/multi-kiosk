import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '../Layouts/AdminLayout';
import {
  TrendingUp,
  DollarSign,
  Package,
  Users,
  AlertTriangle,
  ArrowRight,
  Clock,
  Store,
  CheckCircle,
  MonitorPlay,
  Percent,
  Layers
} from 'lucide-react';

interface Props {
  company: any;
  metrics: {
    gross_revenue: number;
    bom_material_cost: number;
    direct_labour_cost: number;
    wastage_cost: number;
    gross_contribution: number;
    margin_percentage: number;
    material_cost_percentage: number;
    labour_cost_percentage: number;
    total_orders_count: number;
    total_worked_hours: number;
  };
  kiosks: Array<{
    id: number;
    kiosk_code: string;
    kiosk_name: string;
    branch_name: string;
    kiosk_type: string;
    status: string;
    last_heartbeat_at: string;
  }>;
  lowStockAlerts: Array<{
    id: number;
    sku: string;
    name: string;
    category: string;
    base_uom: string;
    current_stock: number;
    alert_threshold: number;
    is_critical: boolean;
  }>;
  openShifts: Array<{
    id: number;
    staff_name: string;
    staff_code: string;
    role: string;
    kiosk_name: string;
    branch_name: string;
    clock_in_at: string;
    elapsed_minutes: number;
  }>;
  recentOrders: Array<{
    id: number;
    order_number: string;
    kiosk_name: string;
    branch_name: string;
    staff_name: string;
    net_amount: number;
    total_material_cost: number;
    payment_method: string;
    payment_status: string;
    ordered_at: string;
  }>;
  branches: Array<{ id: number; name: string; code: string }>;
  filters: { branch_id?: string; kiosk_id?: string };
}

export default function Dashboard({
  company,
  metrics,
  kiosks,
  lowStockAlerts,
  openShifts,
  recentOrders,
  branches,
  filters,
}: Props) {
  const handleBranchFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.get('/dashboard', { branch_id: e.target.value || undefined }, { preserveState: true });
  };

  return (
    <AdminLayout title="Executive Operations & Gross Contribution BI">
      <Head title="Executive Dashboard" />

      {/* Top Banner & Filter Controls */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Platform Executive Overview</h4>
          <p className="text-muted mb-0 small">
            Real-time sales, recipe-deducted material cost, and workforce labor metrics across all kiosk locations.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <select
            className="form-select form-select-sm bg-white"
            style={{ width: 220 }}
            value={filters.branch_id || ''}
            onChange={handleBranchFilter}
          >
            <option value="">All Branches & Depots</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>

          <Link href="/kiosk/terminal" className="btn btn-primary btn-sm d-flex align-items-center gap-1">
            <MonitorPlay size={16} />
            <span>Launch POS</span>
          </Link>
        </div>
      </div>

      {/* 4 Core Financial & Contribution KPI Cards */}
      <div className="row g-3 mb-4">
        {/* Gross Revenue */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="mk-stat-card shadow-sm border-0 h-100">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.75rem' }}>
                  Gross Revenue (MTD)
                </span>
                <h3 className="fw-bold text-dark mt-2 mb-1">RM {metrics.gross_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
                <span className="badge badge-soft-primary small">
                  {metrics.total_orders_count} Completed Orders
                </span>
              </div>
              <div className="mk-stat-icon bg-primary bg-opacity-10 text-primary">
                <DollarSign size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* BOM Raw Material Cost */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="mk-stat-card shadow-sm border-0 h-100">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.75rem' }}>
                  Raw Material Cost (BOM)
                </span>
                <h3 className="fw-bold text-danger mt-2 mb-1">RM {metrics.bom_material_cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
                <span className="badge badge-soft-danger small">
                  {metrics.material_cost_percentage}% of Revenue
                </span>
              </div>
              <div className="mk-stat-icon bg-danger bg-opacity-10 text-danger">
                <Package size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Direct Labour Cost */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="mk-stat-card shadow-sm border-0 h-100">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.75rem' }}>
                  Direct Labour Cost (Hourly)
                </span>
                <h3 className="fw-bold text-warning text-dark mt-2 mb-1">RM {metrics.direct_labour_cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
                <span className="badge badge-soft-warning small">
                  {metrics.total_worked_hours} Total Hours Worked
                </span>
              </div>
              <div className="mk-stat-icon bg-warning bg-opacity-10 text-warning">
                <Clock size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Gross Contribution & Margin */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="mk-stat-card shadow-sm border-0 h-100" style={{ borderLeft: '4px solid #16a34a' }}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.75rem' }}>
                  Gross Contribution
                </span>
                <h3 className="fw-bold text-success mt-2 mb-1">RM {metrics.gross_contribution.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
                <span className="badge badge-soft-success small">
                  <TrendingUp size={12} className="me-1" />
                  {metrics.margin_percentage}% Margin
                </span>
              </div>
              <div className="mk-stat-icon bg-success bg-opacity-10 text-success">
                <Percent size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gross Margin Contribution Visual Breakdown */}
      <div className="mk-card p-3 mb-4 border-0 shadow-sm">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="d-flex align-items-center gap-2">
            <Layers size={18} className="text-primary" />
            <span className="fw-bold small text-dark">Gross Contribution Formula: Revenue - BOM Material Cost - Labour Wages</span>
          </div>
          <span className="badge badge-soft-secondary small">Formula Verified</span>
        </div>

        <div className="progress" style={{ height: 16 }}>
          <div
            className="progress-bar bg-success"
            role="progressbar"
            style={{ width: `${Math.max(0, metrics.margin_percentage)}%` }}
            title={`Gross Contribution: ${metrics.margin_percentage}%`}
          >
            Contribution ({metrics.margin_percentage}%)
          </div>
          <div
            className="progress-bar bg-danger"
            role="progressbar"
            style={{ width: `${Math.max(0, metrics.material_cost_percentage)}%` }}
            title={`Raw Materials: ${metrics.material_cost_percentage}%`}
          >
            Materials ({metrics.material_cost_percentage}%)
          </div>
          <div
            className="progress-bar bg-warning text-dark"
            role="progressbar"
            style={{ width: `${Math.max(0, metrics.labour_cost_percentage)}%` }}
            title={`Labour: ${metrics.labour_cost_percentage}%`}
          >
            Labour ({metrics.labour_cost_percentage}%)
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Kiosk Status & Low Stock Alerts */}
        <div className="col-12 col-lg-7">
          {/* Active Kiosks Live Telemetry */}
          <div className="mk-card p-3 mb-4 border-0 shadow-sm">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                <Store size={18} className="text-primary" />
                Physical Kiosk Network Status
              </h6>
              <Link href="/branches" className="btn btn-sm btn-link text-primary text-decoration-none p-0 small">
                Manage Kiosks <ArrowRight size={14} />
              </Link>
            </div>

            <div className="row g-2">
              {kiosks.map((k) => (
                <div key={k.id} className="col-12 col-md-6">
                  <div className="p-3 border rounded-3 bg-light d-flex align-items-center justify-content-between">
                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <span className={`badge ${k.status === 'ONLINE' ? 'bg-success' : 'bg-secondary'} rounded-pill`}>
                          {k.status}
                        </span>
                        <span className="fw-bold text-dark">{k.kiosk_name}</span>
                      </div>
                      <div className="text-muted small mt-1">
                        {k.branch_name} • Code: <span className="font-monospace fw-semibold">{k.kiosk_code}</span>
                      </div>
                    </div>
                    <Link
                      href={`/kiosk/terminal/${k.id}`}
                      className="btn btn-sm btn-outline-primary rounded-pill px-3"
                      title="Open Terminal for this Kiosk"
                    >
                      POS
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Raw Material Alerts */}
          <div className="mk-card p-3 border-0 shadow-sm">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                <AlertTriangle size={18} className="text-danger" />
                Inventory & Raw Material Stock Alerts
              </h6>
              <Link href="/raw-materials" className="btn btn-sm btn-link text-danger text-decoration-none p-0 small">
                Raw Materials Master <ArrowRight size={14} />
              </Link>
            </div>

            {lowStockAlerts.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                <CheckCircle size={28} className="text-success mb-2 d-block mx-auto" />
                All raw material levels are healthy across all stock locations.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover table-sm align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Material Item</th>
                      <th>Category</th>
                      <th>Current Balance</th>
                      <th>Threshold</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockAlerts.map((mat) => (
                      <tr key={mat.id}>
                        <td>
                          <div className="fw-semibold text-dark">{mat.name}</div>
                          <span className="font-monospace text-muted small">{mat.sku}</span>
                        </td>
                        <td><span className="badge badge-soft-secondary">{mat.category}</span></td>
                        <td>
                          <span className={`fw-bold ${mat.is_critical ? 'text-danger' : 'text-warning'}`}>
                            {mat.current_stock.toFixed(1)} {mat.base_uom}
                          </span>
                        </td>
                        <td className="text-muted small">
                          &le; {mat.alert_threshold.toFixed(1)} {mat.base_uom}
                        </td>
                        <td>
                          <Link href="/inventory/transfers" className="btn btn-xs btn-outline-primary py-1 px-2 rounded">
                            Transfer Stock
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Clock-ins & Recent Orders */}
        <div className="col-12 col-lg-5">
          {/* Live Attendance on Duty */}
          <div className="mk-card p-3 mb-4 border-0 shadow-sm">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                <Users size={18} className="text-success" />
                Live On-Duty Staff at Kiosks
              </h6>
              <Link href="/attendance" className="btn btn-sm btn-link text-success text-decoration-none p-0 small">
                All Logs <ArrowRight size={14} />
              </Link>
            </div>

            {openShifts.length === 0 ? (
              <div className="text-center py-3 text-muted small">
                No active staff clocked in at this moment.
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {openShifts.map((shift) => (
                  <div key={shift.id} className="p-2 border rounded-3 bg-white d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <div className="rounded-circle bg-success text-white p-2 d-flex align-items-center justify-content-center" style={{ width: 34, height: 34, fontSize: '0.8rem' }}>
                        {shift.staff_name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="fw-bold text-dark small">{shift.staff_name}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {shift.kiosk_name} ({shift.branch_name})
                        </div>
                      </div>
                    </div>
                    <div className="text-end">
                      <span className="badge badge-soft-success font-monospace">
                        {Math.floor(shift.elapsed_minutes / 60)}h {shift.elapsed_minutes % 60}m
                      </span>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                        In: {shift.clock_in_at.substring(11, 16)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Orders Stream */}
          <div className="mk-card p-3 border-0 shadow-sm">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                <TrendingUp size={18} className="text-primary" />
                Recent Kiosk Sales Transactions
              </h6>
              <span className="badge badge-soft-primary small">Live</span>
            </div>

            {recentOrders.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                No orders recorded yet.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0">
                  <thead className="table-light small">
                    <tr>
                      <th>Order #</th>
                      <th>Kiosk</th>
                      <th>Net</th>
                      <th>BOM Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((ord) => (
                      <tr key={ord.id}>
                        <td>
                          <div className="font-monospace fw-semibold small text-primary">{ord.order_number}</div>
                          <span className="text-muted" style={{ fontSize: '0.7rem' }}>{ord.ordered_at}</span>
                        </td>
                        <td className="small">
                          <div>{ord.kiosk_name}</div>
                          <span className="badge badge-soft-secondary" style={{ fontSize: '0.65rem' }}>{ord.payment_method}</span>
                        </td>
                        <td className="fw-bold text-dark small">
                          RM {ord.net_amount.toFixed(2)}
                        </td>
                        <td className="text-danger small font-monospace">
                          RM {ord.total_material_cost.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
