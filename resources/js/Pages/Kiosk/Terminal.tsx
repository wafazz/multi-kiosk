import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import {
  MonitorPlay,
  Clock,
  UserCheck,
  ShoppingBag,
  CreditCard,
  Banknote,
  QrCode,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  ArrowLeft,
  Search,
  Sparkles,
  Printer,
  KeyRound,
  X,
  Store,
  Layers
} from 'lucide-react';

interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  description: string;
  selling_price: number;
  image_url: string | null;
  ingredient_count: number;
}

interface Kiosk {
  id: number;
  kiosk_code: string;
  kiosk_name: string;
  branch: {
    name: string;
  };
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Props {
  company: any;
  kiosks: Kiosk[];
  currentKiosk: Kiosk;
  products: Product[];
  activeShift: {
    attendance_id: number;
    staff_id: number;
    staff_name: string;
    staff_code: string;
    clock_in_at: string;
  } | null;
}

export default function KioskTerminal({
  company,
  kiosks,
  currentKiosk,
  products,
  activeShift,
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Modals state
  const [showPayModal, setShowPayModal] = useState<boolean>(false);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [showClockModal, setShowClockModal] = useState<boolean>(false);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [isProcessingOrder, setIsProcessingOrder] = useState<boolean>(false);

  // PIN Pad state for Clock-In
  const [pinInput, setPinInput] = useState<string>('');
  const [pinMessage, setPinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isClocking, setIsClocking] = useState<boolean>(false);

  // Live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter products
  const categories = ['ALL', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Cart operations
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((acc, item) => acc + item.product.selling_price * item.quantity, 0);
  const tax = round(subtotal * 0.06, 2);
  const grandTotal = round(subtotal + tax, 2);

  function round(val: number, decimals: number) {
    return Number(Math.round(Number(val + 'e' + decimals)) + 'e-' + decimals);
  }

  // Handle Checkout
  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    setCashTendered(grandTotal);
    setShowPayModal(true);
  };

  const handleCompleteOrder = async () => {
    if (isProcessingOrder || cart.length === 0) return;
    setIsProcessingOrder(true);

    try {
      const payload = {
        kiosk_id: currentKiosk.id,
        staff_id: activeShift?.staff_id || null,
        payment_method: paymentMethod,
        discount_amount: 0,
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.selling_price,
        })),
      };

      const res = await axios.post('/api/v1/kiosk/order', payload);
      if (res.data.success) {
        setLastOrder({
          ...res.data.order,
          items: cart,
          cashTendered: paymentMethod === 'CASH' ? cashTendered : grandTotal,
          changeDue: paymentMethod === 'CASH' ? Math.max(0, cashTendered - grandTotal) : 0,
        });
        setCart([]);
        setShowPayModal(false);
        setShowReceiptModal(true);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Order processing failed. Please try again.');
    } finally {
      setIsProcessingOrder(false);
    }
  };

  // Handle PIN Pad Clock
  const handlePinDigit = (digit: string) => {
    if (pinInput.length < 6) {
      setPinInput((prev) => prev + digit);
    }
  };

  const handlePinClear = () => setPinInput('');

  const handlePinSubmit = async (action: 'AUTO' | 'CLOCK_IN' | 'CLOCK_OUT') => {
    if (!pinInput || isClocking) return;
    setIsClocking(true);
    setPinMessage(null);

    try {
      const res = await axios.post('/api/v1/kiosk/clock', {
        pin: pinInput,
        kiosk_id: currentKiosk.id,
        action,
      });

      if (res.data.success) {
        setPinMessage({ type: 'success', text: res.data.message });
        setPinInput('');
        setTimeout(() => {
          router.reload();
        }, 1200);
      }
    } catch (err: any) {
      setPinMessage({
        type: 'error',
        text: err.response?.data?.message || 'Verification failed. Please check your PIN.',
      });
      setPinInput('');
    } finally {
      setIsClocking(false);
    }
  };

  return (
    <div className="kiosk-viewport">
      <Head title={`POS Terminal - ${currentKiosk?.kiosk_name || 'Kiosk'}`} />

      {/* Kiosk Top Bar */}
      <header className="px-3 py-2 bg-slate-900 border-bottom border-secondary border-opacity-25 d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <Link
            href="/dashboard"
            className="btn btn-sm btn-outline-secondary text-white d-flex align-items-center gap-1 rounded-pill px-3"
            title="Return to Headquarters Dashboard"
          >
            <ArrowLeft size={14} /> <span>HQ Admin</span>
          </Link>

          {/* Kiosk Identity & Switcher */}
          <div className="d-flex align-items-center gap-2">
            <div className="rounded p-1 bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
              <Store size={16} />
            </div>
            <div>
              <div className="fw-bold text-white lh-1 small">{currentKiosk.kiosk_name}</div>
              <div className="text-muted" style={{ fontSize: '0.65rem' }}>
                {currentKiosk.branch.name} • <span className="font-monospace text-info">{currentKiosk.kiosk_code}</span>
              </div>
            </div>

            {/* Switch Kiosk Dropdown */}
            {kiosks.length > 1 && (
              <select
                className="form-select form-select-sm bg-dark text-white border-secondary border-opacity-50 py-0 ms-2"
                style={{ width: 140, fontSize: '0.75rem' }}
                value={currentKiosk.id}
                onChange={(e) => router.get(`/kiosk/terminal/${e.target.value}`)}
              >
                {kiosks.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.kiosk_code} - {k.kiosk_name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Middle Clock */}
        <div className="d-none d-md-flex align-items-center gap-2 font-monospace text-light fw-bold">
          <Clock size={16} className="text-primary" />
          <span>{currentTime}</span>
        </div>

        {/* Right Staff & Clocking Action */}
        <div className="d-flex align-items-center gap-2">
          {activeShift ? (
            <div className="d-flex align-items-center gap-2 bg-slate-800 px-3 py-1 rounded-pill border border-secondary border-opacity-50">
              <UserCheck size={14} className="text-success" />
              <div className="text-white small lh-1">
                <span className="fw-semibold">{activeShift.staff_name}</span>
                <span className="text-muted ms-1" style={{ fontSize: '0.65rem' }}>({activeShift.staff_code})</span>
              </div>
            </div>
          ) : (
            <div className="badge badge-soft-warning px-2 py-1 small">No Staff Clocked In</div>
          )}

          <button
            onClick={() => {
              setPinInput('');
              setPinMessage(null);
              setShowClockModal(true);
            }}
            className="btn btn-sm btn-outline-info rounded-pill px-3 d-flex align-items-center gap-1"
          >
            <KeyRound size={14} />
            <span>{activeShift ? 'Shift / Clock Out' : 'Staff Clock In'}</span>
          </button>
        </div>
      </header>

      {/* Main Terminal Viewport (Catalog + Cart) */}
      <div className="flex-grow-1 d-flex flex-column flex-lg-row overflow-hidden">
        {/* Left / Center Catalog Panel */}
        <div className="flex-grow-1 d-flex flex-column p-3 overflow-hidden bg-slate-900">
          {/* Categories & Search */}
          <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 mb-3">
            <div className="d-flex align-items-center gap-1 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`btn btn-sm ${
                    selectedCategory === cat ? 'btn-primary' : 'btn-outline-secondary text-light'
                  } rounded-pill text-nowrap px-3`}
                  style={{ fontSize: '0.8rem' }}
                >
                  {cat === 'ALL' ? 'All Menu' : cat}
                </button>
              ))}
            </div>

            <div className="position-relative" style={{ minWidth: 200 }}>
              <input
                type="text"
                placeholder="Search items..."
                className="form-control form-control-sm bg-dark text-white border-secondary border-opacity-50 ps-4"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search size={14} className="position-absolute text-muted" style={{ left: 10, top: 8 }} />
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-grow-1 overflow-y-auto pe-1">
            <div className="kiosk-grid">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="kiosk-product-card p-3 d-flex flex-column justify-content-between"
                  style={{ minHeight: 140 }}
                >
                  <div>
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <span className="badge bg-secondary bg-opacity-50 text-light" style={{ fontSize: '0.65rem' }}>
                        {p.category}
                      </span>
                      <span className="badge badge-soft-info" style={{ fontSize: '0.6rem' }} title="Recipe BOM Linked">
                        BOM
                      </span>
                    </div>
                    <div className="fw-bold text-white mb-1" style={{ fontSize: '0.95rem' }}>{p.name}</div>
                    <div className="text-muted small" style={{ fontSize: '0.75rem' }}>{p.sku}</div>
                  </div>

                  <div className="d-flex align-items-center justify-content-between pt-2 border-top border-secondary border-opacity-25 mt-2">
                    <span className="fs-6 fw-bold text-info font-monospace">RM {p.selling_price.toFixed(2)}</span>
                    <button className="btn btn-xs btn-primary rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ width: 26, height: 26 }}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Cart & Checkout Drawer */}
        <div
          className="bg-slate-950 border-start border-secondary border-opacity-25 d-flex flex-column"
          style={{ width: '100%', maxWidth: 380, minWidth: 320 }}
        >
          {/* Cart Header */}
          <div className="p-3 border-bottom border-secondary border-opacity-25 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <ShoppingBag size={20} className="text-primary" />
              <h6 className="fw-bold mb-0 text-white">Current Order Cart</h6>
            </div>
            {cart.length > 0 && (
              <button onClick={clearCart} className="btn btn-xs btn-link text-danger text-decoration-none p-0 small">
                Clear Cart
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-grow-1 p-3 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <ShoppingBag size={42} className="mb-2 opacity-50 mx-auto d-block" />
                <div className="small">Cart is currently empty.</div>
                <div className="small text-secondary">Select items from the menu to start.</div>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-2 rounded-3 bg-slate-900 border border-secondary border-opacity-50 d-flex align-items-center justify-content-between"
                  >
                    <div className="flex-grow-1 pe-2">
                      <div className="fw-bold text-white small">{item.product.name}</div>
                      <div className="text-info font-monospace small">
                        RM {item.product.selling_price.toFixed(2)}
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="btn btn-xs btn-outline-secondary text-white p-1 rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: 24, height: 24 }}
                      >
                        <Minus size={12} />
                      </button>
                      <span className="font-monospace fw-bold text-white px-1">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="btn btn-xs btn-outline-secondary text-white p-1 rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: 24, height: 24 }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Summary & Pay Action */}
          <div className="p-3 bg-slate-900 border-top border-secondary border-opacity-25">
            <div className="d-flex justify-content-between text-muted small mb-1">
              <span>Subtotal</span>
              <span className="font-monospace">RM {subtotal.toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between text-muted small mb-2">
              <span>SST Tax (6%)</span>
              <span className="font-monospace">RM {tax.toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between text-white fw-bold fs-5 mb-3 border-top border-secondary border-opacity-25 pt-2">
              <span>Grand Total</span>
              <span className="font-monospace text-info">RM {grandTotal.toFixed(2)}</span>
            </div>

            <button
              onClick={handleOpenPayment}
              disabled={cart.length === 0}
              className="btn btn-primary w-100 py-3 fw-bold fs-6 d-flex align-items-center justify-content-center gap-2 shadow"
            >
              <span>PAY RM {grandTotal.toFixed(2)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Payment Selection & Cash Tender */}
      {showPayModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-slate-900 text-white border border-secondary">
              <div className="modal-header border-secondary">
                <h5 className="modal-title fw-bold">Select Payment Method</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowPayModal(false)}></button>
              </div>

              <div className="modal-body">
                <div className="text-center mb-3">
                  <div className="text-muted small">Total Payable Amount</div>
                  <h2 className="fw-bold text-info font-monospace">RM {grandTotal.toFixed(2)}</h2>
                </div>

                {/* Payment Method Switcher */}
                <div className="row g-2 mb-3">
                  <div className="col-4">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH')}
                      className={`btn w-100 p-3 d-flex flex-column align-items-center gap-1 ${
                        paymentMethod === 'CASH' ? 'btn-primary' : 'btn-outline-secondary text-white'
                      }`}
                    >
                      <Banknote size={24} />
                      <span className="small fw-bold">Cash</span>
                    </button>
                  </div>
                  <div className="col-4">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CREDIT_CARD')}
                      className={`btn w-100 p-3 d-flex flex-column align-items-center gap-1 ${
                        paymentMethod === 'CREDIT_CARD' ? 'btn-primary' : 'btn-outline-secondary text-white'
                      }`}
                    >
                      <CreditCard size={24} />
                      <span className="small fw-bold">Card</span>
                    </button>
                  </div>
                  <div className="col-4">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('QR_PAY')}
                      className={`btn w-100 p-3 d-flex flex-column align-items-center gap-1 ${
                        paymentMethod === 'QR_PAY' ? 'btn-primary' : 'btn-outline-secondary text-white'
                      }`}
                    >
                      <QrCode size={24} />
                      <span className="small fw-bold">DuitNow QR</span>
                    </button>
                  </div>
                </div>

                {/* Cash Quick Tender Buttons */}
                {paymentMethod === 'CASH' && (
                  <div className="p-3 bg-slate-950 rounded-3 border border-secondary border-opacity-50 mb-3">
                    <label className="form-label small text-muted">Cash Tendered (RM)</label>
                    <div className="input-group mb-2">
                      <span className="input-group-text bg-dark text-white border-secondary">RM</span>
                      <input
                        type="number"
                        className="form-control bg-dark text-white border-secondary font-monospace fs-5"
                        value={cashTendered}
                        onChange={(e) => setCashTendered(parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="d-flex gap-2 mb-2">
                      {[10, 20, 50, 100].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setCashTendered(amt)}
                          className="btn btn-sm btn-outline-secondary text-white flex-grow-1 font-monospace"
                        >
                          RM {amt}
                        </button>
                      ))}
                    </div>

                    <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary border-opacity-50">
                      <span className="small text-muted">Change Due:</span>
                      <span className="fs-5 fw-bold font-monospace text-success">
                        RM {Math.max(0, cashTendered - grandTotal).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {/* QR Code Scan Mock */}
                {paymentMethod === 'QR_PAY' && (
                  <div className="p-3 bg-white text-dark rounded-3 text-center mb-3">
                    <div className="fw-bold mb-1">Scan DuitNow QR to Pay</div>
                    <div className="p-2 border d-inline-block rounded bg-light my-2">
                      <QrCode size={120} className="text-dark" />
                    </div>
                    <div className="small text-muted">Supported: Touch 'n Go, GrabPay, Maybank, CIMB</div>
                  </div>
                )}
              </div>

              <div className="modal-footer border-secondary">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowPayModal(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCompleteOrder}
                  disabled={isProcessingOrder || (paymentMethod === 'CASH' && cashTendered < grandTotal)}
                  className="btn btn-success btn-sm px-4 fw-bold"
                >
                  {isProcessingOrder ? 'Processing & Deducting BOM...' : 'Confirm & Complete Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Order Receipt & BOM Deduction Proof */}
      {showReceiptModal && lastOrder && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <CheckCircle size={20} /> Order Paid & Completed
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowReceiptModal(false)}></button>
              </div>

              <div className="modal-body p-4 font-monospace">
                {/* Thermal Receipt Simulation */}
                <div className="p-3 bg-light border rounded text-center small mb-3">
                  <h5 className="fw-bold mb-0 text-dark">{company?.name || 'MULTI-KIOSK'}</h5>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>{lastOrder.branch_name}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>Kiosk: {lastOrder.kiosk_code} ({lastOrder.kiosk_name})</div>
                  <div className="border-bottom my-2"></div>
                  <div className="fw-bold text-dark">{lastOrder.order_number}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>{lastOrder.ordered_at}</div>
                  <div className="border-bottom my-2"></div>

                  <div className="text-start">
                    {lastOrder.items?.map((item: any) => (
                      <div key={item.product.id} className="d-flex justify-content-between text-dark">
                        <span>{item.quantity}x {item.product.name}</span>
                        <span>RM {(item.product.selling_price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-bottom my-2"></div>
                  <div className="d-flex justify-content-between text-muted">
                    <span>Tax (6% SST)</span>
                    <span>RM {lastOrder.tax_amount?.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between fw-bold text-dark fs-6 mt-1">
                    <span>TOTAL</span>
                    <span>RM {lastOrder.net_amount?.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between text-muted">
                    <span>Method ({lastOrder.payment_method})</span>
                    <span>RM {lastOrder.cashTendered?.toFixed(2)}</span>
                  </div>
                  {lastOrder.changeDue > 0 && (
                    <div className="d-flex justify-content-between fw-bold text-success">
                      <span>CHANGE</span>
                      <span>RM {lastOrder.changeDue.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Automated BOM Stock Deduction Audit Alert */}
                <div className="p-2 rounded bg-info bg-opacity-10 border border-info border-opacity-25 small text-info text-start">
                  <div className="d-flex align-items-center gap-1 fw-bold">
                    <Layers size={14} /> Recipe BOM Deductions Recorded
                  </div>
                  <div style={{ fontSize: '0.75rem' }}>
                    Standard ingredient quantities automatically deducted from stockroom. Material cost: RM {lastOrder.total_material_cost?.toFixed(2)}.
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                  onClick={() => window.print()}
                >
                  <Printer size={14} /> Print Receipt
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm px-4"
                  onClick={() => setShowReceiptModal(false)}
                >
                  Next Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Staff PIN Numeric Keypad Clock In/Out */}
      {showClockModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 360 }}>
            <div className="modal-content bg-slate-900 text-white border border-secondary shadow-lg">
              <div className="modal-header border-secondary">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <KeyRound size={18} className="text-info" />
                  Staff Kiosk Clock In / Out
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowClockModal(false)}></button>
              </div>

              <div className="modal-body p-3 text-center">
                <div className="text-muted small mb-2">Enter your 4-6 digit Staff PIN:</div>

                {/* PIN Display */}
                <div className="p-3 bg-slate-950 rounded-3 border border-secondary mb-3">
                  <div className="font-monospace fs-3 letter-spacing-2 text-info">
                    {pinInput ? '•'.repeat(pinInput.length) : <span className="text-muted opacity-50">_ _ _ _</span>}
                  </div>
                </div>

                {/* Notifications */}
                {pinMessage && (
                  <div className={`alert ${pinMessage.type === 'success' ? 'alert-success' : 'alert-danger'} p-2 small mb-3 border-0`}>
                    {pinMessage.text}
                  </div>
                )}

                {/* Numeric Keypad */}
                <div className="d-grid gap-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        if (k === 'C') handlePinClear();
                        else if (k === '⌫') setPinInput((prev) => prev.slice(0, -1));
                        else handlePinDigit(k);
                      }}
                      className="btn btn-outline-secondary text-white py-3 fw-bold fs-5 rounded-3"
                    >
                      {k}
                    </button>
                  ))}
                </div>

                {/* Clock Actions */}
                <div className="d-flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => handlePinSubmit('AUTO')}
                    disabled={!pinInput || isClocking}
                    className="btn btn-primary flex-grow-1 py-2 fw-bold"
                  >
                    {isClocking ? 'Verifying...' : 'Clock In / Out'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
