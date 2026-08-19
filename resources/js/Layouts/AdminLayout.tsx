import React, { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
  LayoutDashboard,
  Store,
  Package,
  Boxes,
  ArrowLeftRight,
  Users,
  Clock,
  CircleDollarSign,
  Banknote,
  UtensilsCrossed,
  CreditCard,
  Settings,
  Sliders,
  MonitorPlay,
  LogOut,
  Menu,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const { auth, company, flash, activeKiosksCount } = usePage().props as any;
  const [collapsed, setCollapsed] = useState(false);
  const currentUrl = window.location.pathname;

  const navItems = [
    { label: 'Executive Dashboard', href: '/dashboard', icon: LayoutDashboard, pattern: /^\/dashboard/ },
    { label: 'Branches & Kiosks', href: '/branches', icon: Store, pattern: /^\/branches/ },
    { label: 'Kitchen Display (KDS)', href: '/kds', icon: UtensilsCrossed, pattern: /^\/kds/ },
    { label: 'Products & Recipe BOM', href: '/products', icon: Package, pattern: /^\/products/ },
    { label: 'Modifiers & Add-ons', href: '/modifiers', icon: Sliders, pattern: /^\/modifiers/ },
    { label: 'Raw Materials Master', href: '/raw-materials', icon: Boxes, pattern: /^\/raw-materials/ },
    { label: 'Transfers & Wastage', href: '/inventory/transfers', icon: ArrowLeftRight, pattern: /^\/inventory\/transfers/ },
    { label: 'Shift & Till (Z-Report)', href: '/shifts', icon: Banknote, pattern: /^\/shifts/ },
    { label: 'Staff Management', href: '/staff', icon: Users, pattern: /^\/staff/ },
    { label: 'Attendance & Clocking', href: '/attendance', icon: Clock, pattern: /^\/attendance/ },
    { label: 'Hourly Wage & Labor', href: '/payroll', icon: CircleDollarSign, pattern: /^\/payroll/ },
    { label: 'Payment Gateways (Billplz)', href: '/settings/payment-gateways', icon: CreditCard, pattern: /^\/settings\/payment-gateways/ },
    { label: 'Branding & Identity', href: '/settings/branding', icon: Settings, pattern: /^\/settings\/branding/ },
  ];

  const handleLogout = () => {
    router.post('/logout');
  };

  return (
    <div className="mk-wrapper">
      {/* Left Sidebar */}
      <aside className={`mk-sidebar ${collapsed ? 'collapsed' : ''}`}>
        {/* Brand Header */}
        <div className="p-3 border-bottom border-secondary border-opacity-25 d-flex align-items-center justify-content-between">
          <Link href="/dashboard" className="d-flex align-items-center text-decoration-none text-white gap-2 overflow-hidden">
            {company?.logo_path ? (
              <img
                src={company.logo_path}
                alt="Logo"
                className="rounded bg-white p-1"
                style={{ width: 36, height: 36, objectFit: 'contain' }}
              />
            ) : (
              <div
                className="rounded d-flex align-items-center justify-content-center fw-bold text-white shadow-sm flex-shrink-0"
                style={{ width: 36, height: 36, backgroundColor: company?.brand_primary_color || '#2563eb' }}
              >
                MK
              </div>
            )}
            {!collapsed && (
              <div className="text-truncate">
                <div className="fw-bold text-white lh-sm text-truncate" style={{ fontSize: '0.95rem' }}>
                  {company?.name || 'Multi-Kiosk Platform'}
                </div>
                <div className="text-muted text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>
                  Enterprise POS
                </div>
              </div>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="btn btn-sm btn-link text-secondary text-decoration-none p-1 d-none d-md-block"
            title="Toggle Sidebar"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-grow-1 py-3 overflow-y-auto">
          <div className="sidebar-heading">{!collapsed ? 'Operations & Catalog' : '•••'}</div>
          {navItems.slice(0, 5).map((item, idx) => {
            const isActive = item.pattern.test(currentUrl);
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                href={item.href}
                className={`nav-link ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span className="text-truncate">{item.label}</span>}
              </Link>
            );
          })}

          <div className="sidebar-heading mt-2">{!collapsed ? 'Workforce & Payroll' : '•••'}</div>
          {navItems.slice(5, 8).map((item, idx) => {
            const isActive = item.pattern.test(currentUrl);
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                href={item.href}
                className={`nav-link ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span className="text-truncate">{item.label}</span>}
              </Link>
            );
          })}

          <div className="sidebar-heading mt-2">{!collapsed ? 'System Config' : '•••'}</div>
          {navItems.slice(8).map((item, idx) => {
            const isActive = item.pattern.test(currentUrl);
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                href={item.href}
                className={`nav-link ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span className="text-truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Quick Kiosk Launch & Profile Bar */}
        <div className="p-3 border-top border-secondary border-opacity-25 bg-black bg-opacity-25">
          {!collapsed && (
            <Link
              href="/kiosk/terminal"
              className="btn btn-primary w-100 btn-sm d-flex align-items-center justify-content-center gap-2 mb-3 fw-semibold shadow-sm"
              style={{ backgroundColor: '#2563eb' }}
            >
              <MonitorPlay size={16} />
              <span>Launch Kiosk Terminal</span>
            </Link>
          )}

          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2 overflow-hidden">
              <div
                className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                style={{ width: 32, height: 32, fontSize: '0.8rem' }}
              >
                {auth?.user?.full_name?.substring(0, 2)?.toUpperCase() || 'AD'}
              </div>
              {!collapsed && (
                <div className="text-truncate">
                  <div className="text-white text-truncate fw-medium" style={{ fontSize: '0.85rem' }}>
                    {auth?.user?.full_name || 'Admin'}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                    {auth?.user?.role || 'SUPER_ADMIN'}
                  </div>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                onClick={handleLogout}
                className="btn btn-sm btn-link text-danger text-decoration-none p-1"
                title="Log Out"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="mk-main-content">
        {/* Top Navbar */}
        <header className="mk-top-navbar">
          <div className="d-flex align-items-center gap-3">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="btn btn-sm btn-outline-secondary d-md-none"
            >
              <Menu size={18} />
            </button>
            <h5 className="mb-0 fw-bold text-dark">{title || 'Multi-Kiosk Enterprise'}</h5>
          </div>

          <div className="d-flex align-items-center gap-3">
            {/* Live Kiosks Active Badge */}
            <Link href="/branches" className="text-decoration-none">
              <div className="badge badge-soft-success d-flex align-items-center gap-1 py-2 px-3 rounded-pill">
                <span className="spinner-grow spinner-grow-sm text-success" style={{ width: '0.5rem', height: '0.5rem' }}></span>
                <span>{activeKiosksCount ?? 4} Kiosks Active</span>
              </div>
            </Link>

            {/* Direct Kiosk POS Shortcut */}
            <Link
              href="/kiosk/terminal"
              className="btn btn-outline-primary btn-sm d-none d-sm-flex align-items-center gap-1 rounded-pill px-3"
            >
              <MonitorPlay size={14} />
              <span>Kiosk POS</span>
            </Link>
          </div>
        </header>

        {/* Flash Notifications */}
        {flash?.success && (
          <div className="alert alert-success alert-dismissible fade show m-3 mb-0 d-flex align-items-center gap-2 border-0 shadow-sm" role="alert">
            <CheckCircle2 size={18} className="text-success flex-shrink-0" />
            <div className="flex-grow-1 fw-medium">{flash.success}</div>
          </div>
        )}
        {flash?.error && (
          <div className="alert alert-danger alert-dismissible fade show m-3 mb-0 d-flex align-items-center gap-2 border-0 shadow-sm" role="alert">
            <AlertCircle size={18} className="text-danger flex-shrink-0" />
            <div className="flex-grow-1 fw-medium">{flash.error}</div>
          </div>
        )}

        {/* Page Body */}
        <main className="p-4 flex-grow-1">
          {children}
        </main>
      </div>
    </div>
  );
}
