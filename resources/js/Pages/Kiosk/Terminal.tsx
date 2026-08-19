import React, { useState, useEffect, useRef } from 'react';
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
  Layers,
  Sliders,
  Check,
  Zap,
  Cable,
  Settings,
  FileText,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { EscPosBuilder, WebSerialPrinter, ReceiptData } from '../../Utils/escpos';

interface ModifierOption {
  id: number;
  name: string;
  price_adjustment: number;
  bom_cost: number;
}

interface ModifierGroup {
  id: number;
  name: string;
  selection_type: 'SINGLE' | 'MULTIPLE';
  is_required: boolean;
  min_selections: number;
  max_selections: number;
  options: ModifierOption[];
}

interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  description: string;
  selling_price: number;
  image_url: string | null;
  ingredient_count: number;
  modifier_groups?: ModifierGroup[];
}

interface Kiosk {
  id: number;
  kiosk_code: string;
  kiosk_name: string;
  branch: {
    name: string;
  };
}

interface ModifierSelection {
  modifier_option_id: number;
  name: string;
  price_adjustment: number;
}

interface CartItem {
  cart_item_id: string;
  product: Product;
  quantity: number;
  unit_price: number;
  modifiers: ModifierSelection[];
}

interface PrinterConfig {
  connectionType: 'WEBSERIAL' | 'BROWSER';
  paperWidth: '58mm' | '80mm';
  baudRate: number;
  autoKickDrawer: boolean;
  autoPrint: boolean;
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
  activeTillShift?: {
    id: number;
    opened_at: string;
    opening_float: number;
    staff_name: string;
    staff_code: string;
  } | null;
}

export default function KioskTerminal({
  company,
  kiosks,
  currentKiosk,
  products,
  activeShift,
  activeTillShift,
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Customization modal state
  const [showCustomizeModal, setShowCustomizeModal] = useState<boolean>(false);
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<ModifierSelection[]>([]);

  // Modals state
  const [showPayModal, setShowPayModal] = useState<boolean>(false);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [showClockModal, setShowClockModal] = useState<boolean>(false);
  const [showPrinterModal, setShowPrinterModal] = useState<boolean>(false);

  // Shift Management Modals
  const [showOpenShiftModal, setShowOpenShiftModal] = useState<boolean>(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState<boolean>(false);
  const [showXReportModal, setShowXReportModal] = useState<boolean>(false);
  const [showZReportResultModal, setShowZReportResultModal] = useState<boolean>(false);

  // Shift Inputs
  const [openFloatInput, setOpenFloatInput] = useState<string>('200.00');
  const [closingCashInput, setClosingCashInput] = useState<string>('');
  const [shiftPinInput, setShiftPinInput] = useState<string>('');
  const [shiftErrorMessage, setShiftErrorMessage] = useState<string>('');
  const [isProcessingShift, setIsProcessingShift] = useState<boolean>(false);
  const [liveXReportData, setLiveXReportData] = useState<any>(null);
  const [completedZReportData, setCompletedZReportData] = useState<any>(null);

  // Hardware Printer state
  const serialPrinter = useRef<WebSerialPrinter>(new WebSerialPrinter());
  const [isPrinterConnected, setIsPrinterConnected] = useState<boolean>(false);
  const [printerStatusMessage, setPrinterStatusMessage] = useState<string>('');
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig>(() => {
    const saved = localStorage.getItem('mk_printer_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      connectionType: 'WEBSERIAL',
      paperWidth: '58mm',
      baudRate: 9600,
      autoKickDrawer: true,
      autoPrint: false,
    };
  });

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

  // Save printer config
  const savePrinterConfig = (updated: PrinterConfig) => {
    setPrinterConfig(updated);
    localStorage.setItem('mk_printer_config', JSON.stringify(updated));
  };

  // Connect WebSerial Printer
  const handleConnectPrinter = async () => {
    setPrinterStatusMessage('');
    try {
      await serialPrinter.current.connect(printerConfig.baudRate);
      setIsPrinterConnected(true);
      setPrinterStatusMessage('Thermal printer paired & connected successfully via WebSerial!');
    } catch (err: any) {
      setPrinterStatusMessage(err.message || 'Failed to connect to printer.');
    }
  };

  // Test Print & Kick Drawer
  const handleTestPrint = async () => {
    setPrinterStatusMessage('');
    try {
      const testData: ReceiptData = {
        companyName: company?.name || 'MULTI-KIOSK ENTERPRISE',
        branchName: currentKiosk.branch.name,
        kioskCode: currentKiosk.kiosk_code,
        kioskName: currentKiosk.kiosk_name,
        orderNumber: 'TEST-PRT-0001',
        orderedAt: new Date().toLocaleString(),
        items: [
          { name: 'Iced Caffe Latte (16oz)', quantity: 1, unit_price: 12.00, modifiers: [{ name: 'Extra Espresso Shot', price_adjustment: 3.00 }] },
          { name: 'Butter Croissant', quantity: 1, unit_price: 7.50 },
        ],
        subtotal: 22.50,
        taxAmount: 1.35,
        netAmount: 23.85,
        paymentMethod: 'CASH',
        cashTendered: 50.00,
        changeDue: 26.15,
        paperWidth: printerConfig.paperWidth,
        footerMessage: 'Hardware Diagnostic Test Passed',
      };

      const bytes = EscPosBuilder.buildReceipt(testData, printerConfig.autoKickDrawer);

      if (isPrinterConnected) {
        await serialPrinter.current.print(bytes);
        setPrinterStatusMessage('Test receipt sent to ESC/POS thermal printer.');
      } else {
        await handleConnectPrinter();
        await serialPrinter.current.print(bytes);
      }
    } catch (err: any) {
      setPrinterStatusMessage('Print error: ' + (err.message || 'Check printer connection.'));
    }
  };

  // Manual Kick Cash Drawer
  const handleKickDrawerOnly = async () => {
    try {
      if (isPrinterConnected) {
        await serialPrinter.current.kickDrawerOnly();
      } else {
        await handleConnectPrinter();
        await serialPrinter.current.kickDrawerOnly();
      }
      setPrinterStatusMessage('Cash drawer kick pulse sent.');
    } catch (err: any) {
      alert('Could not kick drawer: ' + (err.message || 'Please connect printer first.'));
    }
  };

  // --- SHIFT MANAGEMENT ACTIONS ---
  const handleOpenShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShiftErrorMessage('');
    setIsProcessingShift(true);

    try {
      const res = await axios.post('/api/v1/kiosk/shift/open', {
        kiosk_id: currentKiosk.id,
        pin: shiftPinInput,
        opening_float: parseFloat(openFloatInput) || 0,
      });

      if (res.data.success) {
        setShowOpenShiftModal(false);
        setShiftPinInput('');
        router.reload();
      }
    } catch (err: any) {
      setShiftErrorMessage(err.response?.data?.message || 'Failed to open shift. Check PIN.');
    } finally {
      setIsProcessingShift(false);
    }
  };

  const handleFetchXReport = async () => {
    try {
      const res = await axios.get('/api/v1/kiosk/shift/x-report', {
        params: { kiosk_id: currentKiosk.id },
      });

      if (res.data.success) {
        setLiveXReportData(res.data.data);
        setShowXReportModal(true);

        // Optional auto thermal print of X-Report
        if (isPrinterConnected) {
          const xBytes = EscPosBuilder.buildZReport(res.data.data, true, printerConfig.paperWidth);
          await serialPrinter.current.print(xBytes);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Could not fetch X-Report.');
    }
  };

  const handleCloseShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShiftErrorMessage('');
    setIsProcessingShift(true);

    try {
      const res = await axios.post('/api/v1/kiosk/shift/close', {
        kiosk_id: currentKiosk.id,
        pin: shiftPinInput,
        closing_cash_counted: parseFloat(closingCashInput) || 0,
      });

      if (res.data.success) {
        setCompletedZReportData(res.data.z_report);
        setShowCloseShiftModal(false);
        setShowZReportResultModal(true);
        setShiftPinInput('');
        setClosingCashInput('');

        // Automatically print official Z-Report and kick drawer
        if (isPrinterConnected) {
          const zBytes = EscPosBuilder.buildZReport(res.data.z_report, false, printerConfig.paperWidth);
          await serialPrinter.current.print(zBytes);
        }
      }
    } catch (err: any) {
      setShiftErrorMessage(err.response?.data?.message || 'Failed to close shift. Check PIN.');
    } finally {
      setIsProcessingShift(false);
    }
  };

  // Filter products
  const categories = ['ALL', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Handle Product Click
  const handleProductClick = (product: Product) => {
    if (product.modifier_groups && product.modifier_groups.length > 0) {
      setCustomizingProduct(product);
      setSelectedModifiers([]);
      setShowCustomizeModal(true);
    } else {
      addStandardToCart(product);
    }
  };

  const addStandardToCart = (product: Product) => {
    const cartItemId = `prod-${product.id}`;
    setCart((prev) => {
      const existing = prev.find((item) => item.cart_item_id === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.cart_item_id === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          cart_item_id: cartItemId,
          product,
          quantity: 1,
          unit_price: product.selling_price,
          modifiers: [],
        },
      ];
    });
  };

  // Modifier toggles inside Customize Modal
  const handleToggleModifier = (group: ModifierGroup, option: ModifierOption) => {
    if (group.selection_type === 'SINGLE') {
      const optionIdsInGroup = group.options.map((o) => o.id);
      const filtered = selectedModifiers.filter((m) => !optionIdsInGroup.includes(m.modifier_option_id));
      setSelectedModifiers([
        ...filtered,
        {
          modifier_option_id: option.id,
          name: option.name,
          price_adjustment: option.price_adjustment,
        },
      ]);
    } else {
      const exists = selectedModifiers.some((m) => m.modifier_option_id === option.id);
      if (exists) {
        setSelectedModifiers(selectedModifiers.filter((m) => m.modifier_option_id !== option.id));
      } else {
        setSelectedModifiers([
          ...selectedModifiers,
          {
            modifier_option_id: option.id,
            name: option.name,
            price_adjustment: option.price_adjustment,
          },
        ]);
      }
    }
  };

  const isOptionSelected = (optionId: number) => {
    return selectedModifiers.some((m) => m.modifier_option_id === optionId);
  };

  const liveCustomizedUnitPrice = customizingProduct
    ? customizingProduct.selling_price + selectedModifiers.reduce((acc, m) => acc + m.price_adjustment, 0)
    : 0;

  const handleAddCustomizedToCart = () => {
    if (!customizingProduct) return;

    const modKey = selectedModifiers
      .map((m) => m.modifier_option_id)
      .sort()
      .join('-');
    const cartItemId = `prod-${customizingProduct.id}-mods-${modKey}`;

    setCart((prev) => {
      const existing = prev.find((item) => item.cart_item_id === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.cart_item_id === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          cart_item_id: cartItemId,
          product: customizingProduct,
          quantity: 1,
          unit_price: liveCustomizedUnitPrice,
          modifiers: selectedModifiers,
        },
      ];
    });

    setShowCustomizeModal(false);
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.cart_item_id === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);
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
          unit_price: item.unit_price,
          modifiers: item.modifiers.map((m) => ({
            modifier_option_id: m.modifier_option_id,
            name: m.name,
            price_adjustment: m.price_adjustment,
          })),
        })),
      };

      const res = await axios.post('/api/v1/kiosk/order', payload);
      if (res.data.success) {
        const orderInfo = {
          ...res.data.order,
          items: cart,
          cashTendered: paymentMethod === 'CASH' ? cashTendered : grandTotal,
          changeDue: paymentMethod === 'CASH' ? Math.max(0, cashTendered - grandTotal) : 0,
        };

        setLastOrder(orderInfo);

        // Hardware ESC/POS Kick Drawer & Auto-Print Action
        if (isPrinterConnected) {
          try {
            if (printerConfig.autoKickDrawer && paymentMethod === 'CASH') {
              await serialPrinter.current.kickDrawerOnly();
            }

            if (printerConfig.autoPrint) {
              const receiptBytes = EscPosBuilder.buildReceipt(
                {
                  companyName: company?.name || 'MULTI-KIOSK',
                  branchName: currentKiosk.branch.name,
                  kioskCode: currentKiosk.kiosk_code,
                  kioskName: currentKiosk.kiosk_name,
                  orderNumber: orderInfo.order_number,
                  orderedAt: orderInfo.ordered_at || new Date().toLocaleString(),
                  items: cart.map((c) => ({
                    name: c.product.name,
                    quantity: c.quantity,
                    unit_price: c.unit_price,
                    modifiers: c.modifiers,
                  })),
                  subtotal: subtotal,
                  taxAmount: tax,
                  netAmount: grandTotal,
                  paymentMethod: paymentMethod,
                  cashTendered: orderInfo.cashTendered,
                  changeDue: orderInfo.changeDue,
                  paperWidth: printerConfig.paperWidth,
                },
                false
              );
              await serialPrinter.current.print(receiptBytes);
            }
          } catch (pErr) {
            console.error('Auto-print error:', pErr);
          }
        }

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

  // Manual Print ESC/POS from Receipt Modal
  const handlePrintEscPosFromModal = async () => {
    if (!lastOrder) return;
    try {
      const receiptBytes = EscPosBuilder.buildReceipt(
        {
          companyName: company?.name || 'MULTI-KIOSK',
          branchName: currentKiosk.branch.name,
          kioskCode: currentKiosk.kiosk_code,
          kioskName: currentKiosk.kiosk_name,
          orderNumber: lastOrder.order_number,
          orderedAt: lastOrder.ordered_at || new Date().toLocaleString(),
          items: lastOrder.items?.map((c: any) => ({
            name: c.product.name,
            quantity: c.quantity,
            unit_price: c.unit_price,
            modifiers: c.modifiers,
          })) || [],
          subtotal: lastOrder.total_amount || grandTotal,
          taxAmount: lastOrder.tax_amount || tax,
          netAmount: lastOrder.net_amount || grandTotal,
          paymentMethod: lastOrder.payment_method || paymentMethod,
          cashTendered: lastOrder.cashTendered,
          changeDue: lastOrder.changeDue,
          paperWidth: printerConfig.paperWidth,
        },
        false
      );

      if (isPrinterConnected) {
        await serialPrinter.current.print(receiptBytes);
      } else {
        await handleConnectPrinter();
        await serialPrinter.current.print(receiptBytes);
      }
    } catch (err: any) {
      alert('Thermal print error: ' + (err.message || 'Check printer connection.'));
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

        {/* Middle: Shift Till Status & Mid-Shift X-Report */}
        <div className="d-flex align-items-center gap-2">
          {activeTillShift ? (
            <div className="d-flex align-items-center gap-2 bg-slate-800 px-3 py-1 rounded-pill border border-success border-opacity-50">
              <span className="badge bg-success p-1 rounded-circle" style={{ width: 8, height: 8 }}></span>
              <div className="text-white small lh-1">
                <span className="fw-bold font-monospace">Till #{activeTillShift.id}</span>
                <span className="text-success font-monospace ms-1 small">(Float: RM {activeTillShift.opening_float.toFixed(2)})</span>
              </div>
              <button
                onClick={handleFetchXReport}
                className="btn btn-xs btn-outline-info text-info border-0 p-0 ms-1"
                title="View live mid-shift X-Report telemetry"
              >
                <FileText size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setShiftErrorMessage('');
                setShiftPinInput('');
                setShowOpenShiftModal(true);
              }}
              className="btn btn-sm btn-warning text-dark fw-bold rounded-pill px-3 d-flex align-items-center gap-1 shadow-sm"
            >
              <Banknote size={14} /> <span>Open Till Shift</span>
            </button>
          )}

          {activeTillShift && (
            <button
              onClick={() => {
                setShiftErrorMessage('');
                setShiftPinInput('');
                setClosingCashInput('');
                setShowCloseShiftModal(true);
              }}
              className="btn btn-sm btn-outline-danger rounded-pill px-2 d-flex align-items-center gap-1"
              title="Close shift with blind cash count & generate Z-Report"
            >
              <DollarSign size={13} /> <span>End Shift (Z-Report)</span>
            </button>
          )}
        </div>

        {/* Right Hardware Actions & Staff */}
        <div className="d-flex align-items-center gap-2">
          {/* Cash Drawer Fast Kick Button */}
          <button
            onClick={handleKickDrawerOnly}
            className="btn btn-sm btn-outline-warning rounded-pill px-3 d-flex align-items-center gap-1"
            title="Send RJ11 pulse to kick open cash drawer"
          >
            <Zap size={14} />
            <span className="d-none d-sm-inline">Open Drawer</span>
          </button>

          {/* Hardware Printer Status & Config Button */}
          <button
            onClick={() => setShowPrinterModal(true)}
            className={`btn btn-sm ${
              isPrinterConnected ? 'btn-outline-success' : 'btn-outline-secondary'
            } text-white rounded-pill px-3 d-flex align-items-center gap-1`}
            title="Thermal Printer & Cash Drawer Hardware Settings"
          >
            <Printer size={14} />
            <span className="d-none d-sm-inline">
              {isPrinterConnected ? `ESC/POS (${printerConfig.paperWidth})` : 'Pair Printer'}
            </span>
          </button>

          {/* Staff Shift Pill */}
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
              {filteredProducts.map((p) => {
                const hasModifiers = p.modifier_groups && p.modifier_groups.length > 0;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleProductClick(p)}
                    className="kiosk-product-card p-3 d-flex flex-column justify-content-between position-relative"
                    style={{ minHeight: 140 }}
                  >
                    <div>
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <span className="badge bg-secondary bg-opacity-50 text-light" style={{ fontSize: '0.65rem' }}>
                          {p.category}
                        </span>
                        {hasModifiers && (
                          <span className="badge badge-soft-warning d-flex align-items-center gap-1" style={{ fontSize: '0.6rem' }}>
                            <Sliders size={10} /> Add-ons
                          </span>
                        )}
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
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Cart & Checkout Drawer */}
        <div
          className="bg-slate-950 border-start border-secondary border-opacity-25 d-flex flex-column"
          style={{ width: '100%', maxWidth: 390, minWidth: 330 }}
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
                    key={item.cart_item_id}
                    className="p-2 rounded-3 bg-slate-900 border border-secondary border-opacity-50 d-flex flex-column gap-1"
                  >
                    <div className="d-flex align-items-start justify-content-between">
                      <div className="flex-grow-1 pe-2">
                        <div className="fw-bold text-white small">{item.product.name}</div>
                        <div className="text-info font-monospace small">
                          RM {item.unit_price.toFixed(2)} each
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.cart_item_id, -1)}
                          className="btn btn-xs btn-outline-secondary text-white p-1 rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: 24, height: 24 }}
                        >
                          <Minus size={12} />
                        </button>
                        <span className="font-monospace fw-bold text-white px-1">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.cart_item_id, 1)}
                          className="btn btn-xs btn-outline-secondary text-white p-1 rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: 24, height: 24 }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Applied Modifiers Pills */}
                    {item.modifiers.length > 0 && (
                      <div className="d-flex flex-wrap gap-1 pt-1 border-top border-secondary border-opacity-25 mt-1">
                        {item.modifiers.map((mod, idx) => (
                          <span
                            key={idx}
                            className="badge bg-slate-800 text-info border border-secondary border-opacity-50"
                            style={{ fontSize: '0.65rem' }}
                          >
                            +{mod.name} {mod.price_adjustment > 0 ? `(+RM ${mod.price_adjustment.toFixed(2)})` : ''}
                          </span>
                        ))}
                      </div>
                    )}
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

      {/* Modal: Customize Product Modifiers & Add-ons */}
      {showCustomizeModal && customizingProduct && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-slate-900 text-white border border-secondary shadow-lg">
              <div className="modal-header border-secondary">
                <div>
                  <h5 className="modal-title fw-bold text-white d-flex align-items-center gap-2">
                    <Sliders size={18} className="text-info" />
                    Customize: {customizingProduct.name}
                  </h5>
                  <div className="text-muted small">
                    Base Price: <span className="text-info font-monospace">RM {customizingProduct.selling_price.toFixed(2)}</span>
                  </div>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCustomizeModal(false)}></button>
              </div>

              <div className="modal-body p-3 overflow-y-auto" style={{ maxHeight: '60vh' }}>
                {customizingProduct.modifier_groups?.map((group) => (
                  <div key={group.id} className="mb-3 p-3 rounded-3 bg-slate-950 border border-secondary border-opacity-50">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="fw-bold small text-white">{group.name}</span>
                      <span className="badge badge-soft-secondary" style={{ fontSize: '0.65rem' }}>
                        {group.selection_type === 'SINGLE' ? 'Choose 1' : 'Optional Add-ons'}
                      </span>
                    </div>

                    <div className="d-flex flex-column gap-2">
                      {group.options.map((opt) => {
                        const selected = isOptionSelected(opt.id);
                        return (
                          <div
                            key={opt.id}
                            onClick={() => handleToggleModifier(group, opt)}
                            className={`p-2 rounded-3 border d-flex align-items-center justify-content-between cursor-pointer transition-all ${
                              selected
                                ? 'bg-primary bg-opacity-20 border-primary text-white'
                                : 'bg-slate-900 border-secondary border-opacity-50 text-light'
                            }`}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="d-flex align-items-center gap-2">
                              <div
                                className={`rounded-circle border d-flex align-items-center justify-content-center ${
                                  selected ? 'bg-primary border-primary text-white' : 'border-secondary'
                                }`}
                                style={{ width: 20, height: 20 }}
                              >
                                {selected && <Check size={12} />}
                              </div>
                              <span className="small fw-medium">{opt.name}</span>
                            </div>

                            <span className="font-monospace small text-info fw-semibold">
                              {opt.price_adjustment > 0 ? `+RM ${opt.price_adjustment.toFixed(2)}` : 'FREE'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="modal-footer border-secondary d-flex justify-content-between">
                <div>
                  <span className="text-muted small">Item Total: </span>
                  <span className="fw-bold fs-5 font-monospace text-info">RM {liveCustomizedUnitPrice.toFixed(2)}</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddCustomizedToCart}
                  className="btn btn-primary btn-sm px-4 fw-bold"
                >
                  Add to Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Open Cash Till Shift */}
      {showOpenShiftModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 380 }}>
            <div className="modal-content bg-slate-900 text-white border border-secondary shadow-lg">
              <div className="modal-header border-secondary">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <Banknote size={18} className="text-warning" />
                  Open Kiosk Cash Till Shift
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowOpenShiftModal(false)}></button>
              </div>

              <form onSubmit={handleOpenShiftSubmit}>
                <div className="modal-body p-3">
                  <div className="text-muted small mb-3">
                    Enter the starting cash float amount in the physical drawer and verify your staff PIN.
                  </div>

                  {shiftErrorMessage && (
                    <div className="alert alert-danger p-2 small mb-3 border-0">
                      {shiftErrorMessage}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label small text-muted">Starting Cash Float (RM) *</label>
                    <div className="input-group">
                      <span className="input-group-text bg-dark text-white border-secondary font-monospace">RM</span>
                      <input
                        type="number"
                        step="10.00"
                        min="0"
                        className="form-control bg-dark text-white border-secondary font-monospace fs-5"
                        value={openFloatInput}
                        onChange={(e) => setOpenFloatInput(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-muted">Staff Authorizing PIN *</label>
                    <input
                      type="password"
                      className="form-control bg-dark text-white border-secondary font-monospace fs-5"
                      placeholder="••••"
                      value={shiftPinInput}
                      onChange={(e) => setShiftPinInput(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowOpenShiftModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={isProcessingShift} className="btn btn-warning text-dark btn-sm px-4 fw-bold">
                    {isProcessingShift ? 'Opening...' : 'Open Till Shift'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: End Shift & Blind Cash Count (Z-Report) */}
      {showCloseShiftModal && activeTillShift && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 400 }}>
            <div className="modal-content bg-slate-900 text-white border border-secondary shadow-lg">
              <div className="modal-header border-secondary">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2 text-danger">
                  <DollarSign size={18} />
                  End Shift & Blind Cash Count (Z-Report)
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCloseShiftModal(false)}></button>
              </div>

              <form onSubmit={handleCloseShiftSubmit}>
                <div className="modal-body p-3">
                  <div className="p-2 bg-slate-950 rounded-3 border border-secondary border-opacity-50 mb-3 small">
                    <div className="fw-bold text-white">Till #{activeTillShift.id}</div>
                    <div className="text-muted">Opened at: {activeTillShift.opened_at}</div>
                    <div className="text-muted">Starting Float: <span className="text-info font-monospace">RM {activeTillShift.opening_float.toFixed(2)}</span></div>
                  </div>

                  <div className="text-warning small mb-3">
                    <AlertTriangle size={14} className="d-inline me-1" />
                    <strong>Blind Count Policy:</strong> Count all physical notes & coins in the cash drawer and enter the total below. The system will calculate and log the variance.
                  </div>

                  {shiftErrorMessage && (
                    <div className="alert alert-danger p-2 small mb-3 border-0">
                      {shiftErrorMessage}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label small text-muted">Physical Counted Cash in Till (RM) *</label>
                    <div className="input-group">
                      <span className="input-group-text bg-dark text-white border-secondary font-monospace">RM</span>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        className="form-control bg-dark text-white border-secondary font-monospace fs-4"
                        placeholder="0.00"
                        value={closingCashInput}
                        onChange={(e) => setClosingCashInput(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-muted">Cashier / Manager Staff PIN *</label>
                    <input
                      type="password"
                      className="form-control bg-dark text-white border-secondary font-monospace fs-5"
                      placeholder="••••"
                      value={shiftPinInput}
                      onChange={(e) => setShiftPinInput(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCloseShiftModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={isProcessingShift || !closingCashInput} className="btn btn-danger btn-sm px-4 fw-bold">
                    {isProcessingShift ? 'Reconciling...' : 'Confirm Blind Count & Close Till'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Live Mid-Shift X-Report */}
      {showXReportModal && liveXReportData && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-info text-white">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2 small">
                  <FileText size={16} /> Mid-Shift X-Report (Live Telemetry)
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowXReportModal(false)}></button>
              </div>

              <div className="modal-body p-3 font-monospace small bg-light">
                <div className="p-3 bg-white border rounded text-center">
                  <h6 className="fw-bold text-dark mb-0">{company?.name || 'MULTI-KIOSK'}</h6>
                  <div className="text-muted small">{liveXReportData.branch_name}</div>
                  <div className="text-muted small">Kiosk: {liveXReportData.kiosk_code} ({liveXReportData.kiosk_name})</div>
                  <div className="border-bottom my-2"></div>
                  <div className="fw-bold text-info">*** MID-SHIFT X-REPORT ***</div>
                  <div className="text-muted" style={{ fontSize: '0.7rem' }}>Opened: {liveXReportData.opened_at}</div>
                  <div className="text-muted" style={{ fontSize: '0.7rem' }}>Cashier: {liveXReportData.cashier_name}</div>
                  <div className="border-bottom my-2"></div>

                  <div className="text-start">
                    <div className="d-flex justify-content-between">
                      <span>Total Completed Orders:</span>
                      <span>{liveXReportData.total_orders_count}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Gross Sales Revenue:</span>
                      <span>RM {liveXReportData.gross_sales.toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between text-success">
                      <span>Cash Sales:</span>
                      <span>RM {liveXReportData.cash_sales.toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Card Sales:</span>
                      <span>RM {liveXReportData.card_sales.toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>DuitNow QR Sales:</span>
                      <span>RM {liveXReportData.qr_sales.toFixed(2)}</span>
                    </div>

                    <div className="border-bottom my-2"></div>

                    <div className="d-flex justify-content-between">
                      <span>Starting Cash Float:</span>
                      <span>RM {liveXReportData.opening_cash_float.toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between fw-bold text-dark fs-6 mt-1">
                      <span>Expected Till Cash:</span>
                      <span>RM {liveXReportData.expected_cash_in_till.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowXReportModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Official Closed Z-Report Result */}
      {showZReportResultModal && completedZReportData && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 440 }}>
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2 small text-success">
                  <CheckCircle size={16} /> Shift #{completedZReportData.shift_id} Closed — Official Z-Report
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowZReportResultModal(false);
                    router.reload();
                  }}
                ></button>
              </div>

              <div className="modal-body p-3 font-monospace small bg-light">
                <div className="p-3 bg-white border rounded text-center">
                  <h6 className="fw-bold text-dark mb-0">{company?.name || 'MULTI-KIOSK'}</h6>
                  <div className="text-muted small">{completedZReportData.branch_name}</div>
                  <div className="text-muted small">Kiosk: {completedZReportData.kiosk_code} ({completedZReportData.kiosk_name})</div>
                  <div className="border-bottom my-2"></div>
                  <div className="fw-bold text-dark">*** OFFICIAL Z-REPORT ***</div>
                  <div className="text-muted" style={{ fontSize: '0.7rem' }}>Opened: {completedZReportData.opened_at}</div>
                  <div className="text-muted" style={{ fontSize: '0.7rem' }}>Closed: {completedZReportData.closed_at}</div>
                  <div className="text-muted" style={{ fontSize: '0.7rem' }}>Closed By: {completedZReportData.closed_by}</div>
                  <div className="border-bottom my-2"></div>

                  <div className="text-start">
                    <div className="d-flex justify-content-between">
                      <span>Total Completed Orders:</span>
                      <span>{completedZReportData.orders_count}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Gross Sales:</span>
                      <span>RM {completedZReportData.gross_sales.toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between text-success">
                      <span>Cash Sales:</span>
                      <span>RM {completedZReportData.cash_sales.toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Card Sales:</span>
                      <span>RM {completedZReportData.card_sales.toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>QR Sales:</span>
                      <span>RM {completedZReportData.qr_sales.toFixed(2)}</span>
                    </div>

                    <div className="border-bottom my-2"></div>

                    <div className="d-flex justify-content-between">
                      <span>Starting Float:</span>
                      <span>RM {completedZReportData.opening_float.toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Expected Till Cash:</span>
                      <span>RM {completedZReportData.expected_cash.toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between fw-bold text-primary">
                      <span>Physical Counted Cash:</span>
                      <span>RM {completedZReportData.closing_counted.toFixed(2)}</span>
                    </div>

                    <div className="border-top my-2"></div>

                    <div className="d-flex justify-content-between fw-bold fs-6">
                      <span>CASH VARIANCE:</span>
                      <span
                        className={
                          completedZReportData.cash_variance < 0
                            ? 'text-danger'
                            : completedZReportData.cash_variance > 0
                            ? 'text-warning'
                            : 'text-success'
                        }
                      >
                        {completedZReportData.cash_variance >= 0
                          ? `+RM ${completedZReportData.cash_variance.toFixed(2)}`
                          : `-RM ${Math.abs(completedZReportData.cash_variance).toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-primary btn-sm px-4"
                  onClick={() => {
                    setShowZReportResultModal(false);
                    router.reload();
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Modal: Order Receipt, ESC/POS Print & Cash Drawer */}
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
                      <div key={item.cart_item_id || item.product.id} className="mb-1">
                        <div className="d-flex justify-content-between text-dark fw-semibold">
                          <span>{item.quantity}x {item.product.name}</span>
                          <span>RM {(item.unit_price * item.quantity).toFixed(2)}</span>
                        </div>
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="ps-2 text-muted" style={{ fontSize: '0.75rem' }}>
                            {item.modifiers.map((m: any, idx: number) => (
                              <div key={idx}>+ {m.name} {m.price_adjustment > 0 ? `(RM ${m.price_adjustment.toFixed(2)})` : ''}</div>
                            ))}
                          </div>
                        )}
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
                    <Layers size={14} /> Recipe & Modifier BOM Deductions Recorded
                  </div>
                  <div style={{ fontSize: '0.75rem' }}>
                    Base ingredients and add-on recipes automatically deducted from stockroom. Material cost snapshot: RM {lastOrder.total_material_cost?.toFixed(2)}.
                  </div>
                </div>
              </div>

              <div className="modal-footer d-flex justify-content-between flex-wrap gap-2">
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                    onClick={handlePrintEscPosFromModal}
                    title="Direct binary ESC/POS thermal print"
                  >
                    <Printer size={14} /> ESC/POS Print
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-warning btn-sm d-flex align-items-center gap-1"
                    onClick={handleKickDrawerOnly}
                    title="Pulse cash drawer"
                  >
                    <Zap size={14} /> Kick Drawer
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => window.print()}
                    title="Standard browser dialog print"
                  >
                    Browser Print
                  </button>
                </div>
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

      {/* Modal: Hardware Printer & Cash Drawer Configuration */}
      {showPrinterModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-slate-900 text-white border border-secondary shadow-lg">
              <div className="modal-header border-secondary">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <Printer size={18} className="text-info" />
                  Thermal Printer & Cash Drawer Hardware
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowPrinterModal(false)}></button>
              </div>

              <div className="modal-body p-3">
                {/* Connection Status Card */}
                <div className={`p-3 rounded-3 border mb-3 ${isPrinterConnected ? 'bg-success bg-opacity-10 border-success' : 'bg-slate-950 border-secondary'}`}>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <div className="fw-bold text-white small">Printer Connection Status:</div>
                      <div className={`small fw-semibold ${isPrinterConnected ? 'text-success' : 'text-warning'}`}>
                        {isPrinterConnected ? '● Online (WebSerial Connected)' : '○ Disconnected / Unpaired'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleConnectPrinter}
                      className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                    >
                      <Cable size={14} />
                      <span>{isPrinterConnected ? 'Re-pair USB Printer' : 'Pair USB Printer'}</span>
                    </button>
                  </div>
                </div>

                {printerStatusMessage && (
                  <div className="alert alert-info p-2 small mb-3 border-0">
                    {printerStatusMessage}
                  </div>
                )}

                {/* Configuration Options */}
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small text-muted">Paper Width</label>
                    <select
                      className="form-select form-select-sm bg-dark text-white border-secondary"
                      value={printerConfig.paperWidth}
                      onChange={(e) => savePrinterConfig({ ...printerConfig, paperWidth: e.target.value as any })}
                    >
                      <option value="58mm">58mm (32 Columns Standard)</option>
                      <option value="80mm">80mm (42/48 Columns Wide)</option>
                    </select>
                  </div>

                  <div className="col-6">
                    <label className="form-label small text-muted">Baud Rate</label>
                    <select
                      className="form-select form-select-sm bg-dark text-white border-secondary font-monospace"
                      value={printerConfig.baudRate}
                      onChange={(e) => savePrinterConfig({ ...printerConfig, baudRate: parseInt(e.target.value) })}
                    >
                      <option value={9600}>9600 (Epson Standard)</option>
                      <option value={19200}>19200</option>
                      <option value={38400}>38400 (Sunmi / Star)</option>
                      <option value={115200}>115200 (High Speed)</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-3 border border-secondary border-opacity-50 mb-3 d-flex flex-column gap-2">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="autoKickCheck"
                      checked={printerConfig.autoKickDrawer}
                      onChange={(e) => savePrinterConfig({ ...printerConfig, autoKickDrawer: e.target.checked })}
                    />
                    <label className="form-check-label small text-white" htmlFor="autoKickCheck">
                      <strong>Auto-Kick Cash Drawer</strong> on Cash checkout
                    </label>
                  </div>

                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="autoPrintCheck"
                      checked={printerConfig.autoPrint}
                      onChange={(e) => savePrinterConfig({ ...printerConfig, autoPrint: e.target.checked })}
                    />
                    <label className="form-check-label small text-white" htmlFor="autoPrintCheck">
                      <strong>Silent Auto-Print</strong> thermal receipt on order completion
                    </label>
                  </div>
                </div>

                {/* Diagnostics */}
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    onClick={handleTestPrint}
                    className="btn btn-outline-info btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                  >
                    <Printer size={14} /> Test Receipt Print
                  </button>
                  <button
                    type="button"
                    onClick={handleKickDrawerOnly}
                    className="btn btn-outline-warning btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                  >
                    <Zap size={14} /> Test Drawer Kick
                  </button>
                </div>
              </div>

              <div className="modal-footer border-secondary">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowPrinterModal(false)}>
                  Close
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
