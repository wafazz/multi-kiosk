import React, { useState, useEffect, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import {
  UtensilsCrossed,
  Clock,
  CheckCircle,
  Volume2,
  VolumeX,
  RefreshCw,
  ArrowLeft,
  Store,
  ChefHat,
  Bell,
  RotateCcw,
  Check,
  Flame,
  AlertCircle,
  Coffee
} from 'lucide-react';

interface TicketModifier {
  id: number;
  name: string;
}

interface TicketItem {
  id: number;
  product_name: string;
  product_category: string;
  quantity: number;
  is_prepared: boolean;
  modifiers: TicketModifier[];
}

interface Ticket {
  id: number;
  order_number: string;
  kiosk_code: string;
  kiosk_name: string;
  fulfillment_status: 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED';
  dining_option: 'TAKEAWAY' | 'DINE_IN';
  ordered_at: string;
  elapsed_seconds: number;
  elapsed_minutes: number;
  preparation_started_at?: string;
  ready_at?: string;
  total_items_count: number;
  items: TicketItem[];
}

interface Branch {
  id: number;
  name: string;
  code: string;
}

interface Props {
  company: any;
  branches: Branch[];
  selectedBranchId: number;
}

export default function KDSScreen({ company, branches, selectedBranchId: initialBranchId }: Props) {
  const [selectedBranchId, setSelectedBranchId] = useState<number>(initialBranchId);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'PREPARING' | 'READY' | 'COMPLETED'>('ACTIVE');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>('');
  const prevTicketIds = useRef<number[]>([]);

  // Synthesize Web Audio API Bell Chime for new tickets & ready events
  const playChime = (type: 'NEW_ORDER' | 'READY' = 'NEW_ORDER') => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'NEW_ORDER') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24); // G5
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
        osc.start();
        osc.stop(ctx.currentTime + 0.7);
      }
    } catch (e) {
      console.error('Audio playback error:', e);
    }
  };

  // Clock interval
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Tickets from API
  const fetchTickets = async (isManual: boolean = false) => {
    if (isManual) setIsLoading(true);
    try {
      const res = await axios.get('/api/v1/kds/tickets', {
        params: {
          branch_id: selectedBranchId,
          status: activeTab,
        },
      });

      if (res.data.success) {
        const newTickets: Ticket[] = res.data.tickets;

        // Check if there are new tickets that were not in previous list
        if (prevTicketIds.current.length > 0) {
          const hasNew = newTickets.some((t) => !prevTicketIds.current.includes(t.id));
          if (hasNew) {
            playChime('NEW_ORDER');
          }
        }
        prevTicketIds.current = newTickets.map((t) => t.id);
        setTickets(newTickets);
      }
    } catch (err) {
      console.error('Failed to fetch KDS tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Polling every 3 seconds
  useEffect(() => {
    fetchTickets(true);
    const interval = setInterval(() => {
      fetchTickets(false);
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedBranchId, activeTab]);

  // Update order status
  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      const res = await axios.post(`/api/v1/kds/order/${orderId}/status`, {
        status: newStatus,
      });

      if (res.data.success) {
        if (newStatus === 'READY') {
          playChime('READY');
        }
        fetchTickets(false);
      }
    } catch (err) {
      alert('Failed to update ticket status.');
    }
  };

  // Toggle single item strike-through
  const handleToggleItem = async (itemId: number) => {
    try {
      await axios.post(`/api/v1/kds/item/${itemId}/toggle`);
      setTickets((prev) =>
        prev.map((t) => ({
          ...t,
          items: t.items.map((i) => (i.id === itemId ? { ...i, is_prepared: !i.is_prepared } : i)),
        }))
      );
    } catch (err) {
      console.error('Item toggle failed:', err);
    }
  };

  // Format Elapsed Time Color
  const getElapsedBadgeClass = (minutes: number) => {
    if (minutes < 5) return 'bg-success text-white';
    if (minutes < 10) return 'bg-warning text-dark';
    return 'bg-danger text-white animate-pulse';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="badge bg-secondary bg-opacity-75 text-light">Awaiting Prep</span>;
      case 'PREPARING':
        return <span className="badge bg-warning text-dark fw-bold">In Prep</span>;
      case 'READY':
        return <span className="badge bg-success text-white fw-bold">Ready for Pickup</span>;
      case 'COMPLETED':
        return <span className="badge bg-slate-700 text-muted">Completed</span>;
      default:
        return null;
    }
  };

  return (
    <div className="kds-viewport bg-slate-950 text-white min-vh-100 d-flex flex-column">
      <Head title="Kitchen Display System (KDS)" />

      {/* KDS Top Bar */}
      <header className="px-3 py-2 bg-slate-900 border-bottom border-secondary border-opacity-25 d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <Link
            href="/dashboard"
            className="btn btn-sm btn-outline-secondary text-white d-flex align-items-center gap-1 rounded-pill px-3"
            title="Return to Headquarters Dashboard"
          >
            <ArrowLeft size={14} /> <span>HQ Admin</span>
          </Link>

          {/* KDS Branding */}
          <div className="d-flex align-items-center gap-2">
            <div className="rounded p-1 bg-warning text-dark d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
              <ChefHat size={18} />
            </div>
            <div>
              <div className="fw-bold text-white lh-1 small">Kitchen Display System (KDS)</div>
              <div className="text-muted" style={{ fontSize: '0.65rem' }}>
                Live Barista & Kitchen Fulfillment Screen
              </div>
            </div>

            {/* Branch Switcher */}
            <select
              className="form-select form-select-sm bg-dark text-white border-secondary border-opacity-50 py-0 ms-2"
              style={{ width: 180, fontSize: '0.75rem' }}
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(Number(e.target.value))}
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="d-flex align-items-center gap-1 bg-slate-950 p-1 rounded-pill border border-secondary border-opacity-25">
          {[
            { id: 'ACTIVE', label: 'Active Tickets' },
            { id: 'PREPARING', label: 'In Prep' },
            { id: 'READY', label: 'Ready' },
            { id: 'COMPLETED', label: 'Recall History' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`btn btn-xs px-3 rounded-pill fw-semibold ${
                activeTab === tab.id ? 'btn-primary text-white' : 'btn-link text-muted text-decoration-none'
              }`}
              style={{ fontSize: '0.75rem' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Tools */}
        <div className="d-flex align-items-center gap-2">
          {/* Audio Chime Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`btn btn-sm ${
              soundEnabled ? 'btn-outline-success text-success' : 'btn-outline-secondary text-muted'
            } rounded-pill px-3 d-flex align-items-center gap-1`}
            title="Toggle audible kitchen bells on incoming tickets"
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            <span className="small">{soundEnabled ? 'Sound On' : 'Muted'}</span>
          </button>

          {/* Clock */}
          <div className="d-none d-md-flex align-items-center gap-1 font-monospace text-light fw-bold px-2 py-1 bg-slate-800 rounded-pill border border-secondary border-opacity-50 small">
            <Clock size={13} className="text-warning" />
            <span>{currentTime}</span>
          </div>

          <button onClick={() => fetchTickets(true)} className="btn btn-sm btn-outline-secondary text-white p-2 rounded-circle" title="Refresh Tickets">
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* Main KDS Grid Viewport */}
      <div className="flex-grow-1 p-3 overflow-y-auto bg-slate-950">
        {tickets.length === 0 ? (
          <div className="d-flex flex-column align-items-center justify-content-center h-100 py-5 text-center text-muted">
            <UtensilsCrossed size={56} className="mb-3 opacity-25" />
            <h4 className="fw-bold text-white">All Clear! No active kitchen tickets.</h4>
            <p className="text-muted small">New orders completed at POS terminals or self-service kiosks will chime and appear here instantly.</p>
          </div>
        ) : (
          <div className="row g-3">
            {tickets.map((ticket) => {
              const isTakeaway = ticket.dining_option === 'TAKEAWAY';
              const allItemsPrepped = ticket.items.every((i) => i.is_prepared);

              return (
                <div key={ticket.id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                  <div
                    className={`rounded-3 border overflow-hidden d-flex flex-column justify-content-between shadow-sm transition-all ${
                      ticket.fulfillment_status === 'READY'
                        ? 'bg-slate-900 border-success'
                        : ticket.fulfillment_status === 'PREPARING'
                        ? 'bg-slate-900 border-warning'
                        : 'bg-slate-900 border-secondary border-opacity-50'
                    }`}
                    style={{ minHeight: 280 }}
                  >
                    {/* Ticket Header */}
                    <div className="p-3 border-bottom border-secondary border-opacity-25 bg-slate-950 d-flex align-items-start justify-content-between">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="fs-5 fw-bold text-white font-monospace">#{ticket.order_number.split('-').pop()}</span>
                          <span
                            className={`badge ${
                              isTakeaway ? 'badge-soft-info' : 'badge-soft-warning'
                            } text-uppercase`}
                            style={{ fontSize: '0.65rem' }}
                          >
                            {isTakeaway ? 'Takeaway' : 'Dine-In'}
                          </span>
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                          Kiosk: <span className="text-light fw-semibold">{ticket.kiosk_code}</span> • {ticket.ordered_at}
                        </div>
                      </div>

                      {/* Dynamic Timer Badge */}
                      <div className="text-end">
                        <span className={`badge font-monospace px-2 py-1 ${getElapsedBadgeClass(ticket.elapsed_minutes)}`}>
                          <Clock size={11} className="d-inline me-1" />
                          {ticket.elapsed_minutes}m {ticket.elapsed_seconds % 60}s
                        </span>
                        <div className="mt-1">{getStatusBadge(ticket.fulfillment_status)}</div>
                      </div>
                    </div>

                    {/* Ticket Items List with Checklist */}
                    <div className="p-3 flex-grow-1 overflow-y-auto" style={{ maxHeight: 220 }}>
                      <div className="d-flex flex-column gap-2">
                        {ticket.items.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleToggleItem(item.id)}
                            className={`p-2 rounded-3 border transition-all cursor-pointer ${
                              item.is_prepared
                                ? 'bg-slate-950 border-secondary border-opacity-25 opacity-50 text-decoration-line-through'
                                : 'bg-slate-800 border-secondary border-opacity-50 text-white'
                            }`}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="d-flex align-items-center justify-content-between">
                              <div className="d-flex align-items-center gap-2">
                                <div
                                  className={`rounded-circle border d-flex align-items-center justify-content-center ${
                                    item.is_prepared ? 'bg-success border-success text-white' : 'border-secondary'
                                  }`}
                                  style={{ width: 18, height: 18 }}
                                >
                                  {item.is_prepared && <Check size={12} />}
                                </div>
                                <span className="fw-bold fs-6">
                                  {item.quantity}x {item.product_name}
                                </span>
                              </div>
                            </div>

                            {/* Item Modifiers */}
                            {item.modifiers.length > 0 && (
                              <div className="ps-4 pt-1 d-flex flex-wrap gap-1">
                                {item.modifiers.map((m) => (
                                  <span
                                    key={m.id}
                                    className="badge bg-warning bg-opacity-20 text-warning border border-warning border-opacity-50"
                                    style={{ fontSize: '0.65rem' }}
                                  >
                                    + {m.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Ticket Action Footer */}
                    <div className="p-2 bg-slate-950 border-top border-secondary border-opacity-25 d-flex gap-2">
                      {ticket.fulfillment_status === 'PENDING' && (
                        <button
                          onClick={() => handleUpdateStatus(ticket.id, 'PREPARING')}
                          className="btn btn-warning text-dark btn-sm w-100 fw-bold d-flex align-items-center justify-content-center gap-1 shadow-sm"
                        >
                          <Flame size={14} /> <span>Start Prep</span>
                        </button>
                      )}

                      {ticket.fulfillment_status === 'PREPARING' && (
                        <button
                          onClick={() => handleUpdateStatus(ticket.id, 'READY')}
                          className="btn btn-success btn-sm w-100 fw-bold d-flex align-items-center justify-content-center gap-1 shadow"
                        >
                          <Bell size={14} /> <span>Mark Ready (Chime)</span>
                        </button>
                      )}

                      {ticket.fulfillment_status === 'READY' && (
                        <button
                          onClick={() => handleUpdateStatus(ticket.id, 'COMPLETED')}
                          className="btn btn-primary btn-sm w-100 fw-bold d-flex align-items-center justify-content-center gap-1 shadow"
                        >
                          <CheckCircle size={14} /> <span>Complete & Bump</span>
                        </button>
                      )}

                      {ticket.fulfillment_status === 'COMPLETED' && (
                        <button
                          onClick={() => handleUpdateStatus(ticket.id, 'RECALL')}
                          className="btn btn-outline-secondary text-white btn-sm w-100 d-flex align-items-center justify-content-center gap-1"
                        >
                          <RotateCcw size={14} /> <span>Recall Ticket</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
