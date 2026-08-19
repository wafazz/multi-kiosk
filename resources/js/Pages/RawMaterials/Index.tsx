import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import {
  Boxes,
  Plus,
  Edit2,
  AlertTriangle,
  CheckCircle,
  Sliders,
  DollarSign,
  Layers,
  ArrowRight
} from 'lucide-react';

interface LocationBalance {
  location_id: number;
  location_name: string;
  location_type: string;
  quantity: number;
}

interface RawMaterial {
  id: number;
  sku: string;
  name: string;
  category: string;
  base_uom: string;
  purchase_uom: string;
  conversion_rate: number;
  standard_cost_per_base_unit: number;
  purchase_cost_calculated: number;
  min_stock_alert_level: number;
  total_stock: number;
  total_valuation: number;
  is_low_stock: boolean;
  is_active: boolean;
  locations: LocationBalance[];
}

interface StockLocation {
  id: number;
  location_name: string;
  location_type: string;
}

interface Props {
  materials: RawMaterial[];
  stockLocations: StockLocation[];
}

export default function RawMaterialsIndex({ materials, stockLocations }: Props) {
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<RawMaterial | null>(null);

  const materialForm = useForm({
    sku: '',
    name: '',
    category: 'Coffee Beans & Tea',
    base_uom: 'g',
    purchase_uom: 'kg',
    conversion_rate: '1000',
    standard_cost_per_base_unit: '0.0800',
    min_stock_alert_level: '500',
  });

  const adjustForm = useForm({
    location_id: stockLocations[0]?.id?.toString() || '',
    raw_material_id: '',
    quantity_on_hand: '',
  });

  const handleOpenMaterialModal = (material?: RawMaterial) => {
    if (material) {
      setEditingMaterial(material);
      materialForm.setData({
        sku: material.sku,
        name: material.name,
        category: material.category,
        base_uom: material.base_uom,
        purchase_uom: material.purchase_uom,
        conversion_rate: material.conversion_rate.toString(),
        standard_cost_per_base_unit: material.standard_cost_per_base_unit.toString(),
        min_stock_alert_level: material.min_stock_alert_level.toString(),
      });
    } else {
      setEditingMaterial(null);
      materialForm.reset();
    }
    setShowMaterialModal(true);
  };

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMaterial) {
      materialForm.put(`/raw-materials/${editingMaterial.id}`, {
        onSuccess: () => {
          setShowMaterialModal(false);
          materialForm.reset();
        },
      });
    } else {
      materialForm.post('/raw-materials', {
        onSuccess: () => {
          setShowMaterialModal(false);
          materialForm.reset();
        },
      });
    }
  };

  const handleOpenAdjustModal = (mat: RawMaterial) => {
    setAdjustTarget(mat);
    adjustForm.setData({
      location_id: stockLocations[0]?.id?.toString() || '',
      raw_material_id: mat.id.toString(),
      quantity_on_hand: mat.total_stock.toString(),
    });
    setShowAdjustModal(true);
  };

  const handleSaveAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    adjustForm.post('/raw-materials/adjust-stock', {
      onSuccess: () => {
        setShowAdjustModal(false);
      },
    });
  };

  return (
    <AdminLayout title="Raw Material Master & Stock Balances">
      <Head title="Raw Materials Master" />

      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Raw Materials & Ingredient Master</h4>
          <p className="text-muted mb-0 small">
            Configure atomic measurement units (UOM), purchase multipliers, standard costs, and monitor inventory levels across warehouses and kiosks.
          </p>
        </div>

        <button
          onClick={() => handleOpenMaterialModal()}
          className="btn btn-primary btn-sm d-flex align-items-center gap-1"
        >
          <Plus size={16} />
          <span>New Raw Material</span>
        </button>
      </div>

      {/* Materials Table */}
      <div className="mk-card border-0 shadow-sm overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ minWidth: 200 }}>Item & SKU</th>
                <th>Category</th>
                <th>Base UOM & Multiplier</th>
                <th>Standard Base Cost</th>
                <th>Purchase Cost</th>
                <th>Total Balance</th>
                <th>Valuation</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {materials.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-5 text-muted small">
                    No raw materials registered. Click "New Raw Material" to create your first ingredient.
                  </td>
                </tr>
              ) : (
                materials.map((mat) => (
                  <tr key={mat.id}>
                    <td>
                      <div className="fw-bold text-dark">{mat.name}</div>
                      <span className="font-monospace text-muted small">{mat.sku}</span>
                    </td>
                    <td>
                      <span className="badge badge-soft-secondary">{mat.category}</span>
                    </td>
                    <td>
                      <div className="font-monospace small">
                        Base: <span className="fw-bold text-dark">{mat.base_uom}</span>
                      </div>
                      <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                        1 {mat.purchase_uom} = {mat.conversion_rate} {mat.base_uom}
                      </div>
                    </td>
                    <td>
                      <span className="font-monospace fw-semibold text-dark">
                        RM {mat.standard_cost_per_base_unit.toFixed(4)} / {mat.base_uom}
                      </span>
                    </td>
                    <td>
                      <span className="font-monospace text-muted small">
                        RM {mat.purchase_cost_calculated.toFixed(2)} / {mat.purchase_uom}
                      </span>
                    </td>
                    <td>
                      <div className="fw-bold font-monospace text-dark">
                        {mat.total_stock.toLocaleString()} {mat.base_uom}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                        Alert threshold: &le; {mat.min_stock_alert_level}
                      </div>
                    </td>
                    <td>
                      <span className="font-monospace text-primary fw-semibold">
                        RM {mat.total_valuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td>
                      {mat.is_low_stock ? (
                        <span className="badge badge-soft-danger d-flex align-items-center gap-1">
                          <AlertTriangle size={12} /> Low Stock
                        </span>
                      ) : (
                        <span className="badge badge-soft-success d-flex align-items-center gap-1">
                          <CheckCircle size={12} /> Normal
                        </span>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          onClick={() => handleOpenAdjustModal(mat)}
                          className="btn btn-outline-primary"
                          title="Adjust Stock Balance"
                        >
                          <Sliders size={13} />
                        </button>
                        <button
                          onClick={() => handleOpenMaterialModal(mat)}
                          className="btn btn-outline-secondary"
                          title="Edit Details"
                        >
                          <Edit2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create / Edit Raw Material */}
      {showMaterialModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  {editingMaterial ? `Edit ${editingMaterial.name}` : 'Register New Raw Material'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowMaterialModal(false)}></button>
              </div>
              <form onSubmit={handleSaveMaterial}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Material / Ingredient Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Espresso Coffee Beans (Arabica)"
                      value={materialForm.data.name}
                      onChange={(e) => materialForm.setData('name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold small">SKU Code *</label>
                      <input
                        type="text"
                        className="form-control text-uppercase font-monospace"
                        placeholder="e.g. RM-COF-01"
                        value={materialForm.data.sku}
                        onChange={(e) => materialForm.setData('sku', e.target.value)}
                        required
                        disabled={editingMaterial !== null}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold small">Category *</label>
                      <select
                        className="form-select"
                        value={materialForm.data.category}
                        onChange={(e) => materialForm.setData('category', e.target.value)}
                      >
                        <option value="Coffee Beans & Tea">Coffee Beans & Tea</option>
                        <option value="Dairy & Milk">Dairy & Milk</option>
                        <option value="Syrups & Flavorings">Syrups & Flavorings</option>
                        <option value="Packaging & Cups">Packaging & Cups</option>
                        <option value="Bakery Ingredients">Bakery Ingredients</option>
                      </select>
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-4">
                      <label className="form-label fw-semibold small">Base UOM *</label>
                      <input
                        type="text"
                        className="form-control font-monospace"
                        placeholder="g, ml, unit"
                        value={materialForm.data.base_uom}
                        onChange={(e) => materialForm.setData('base_uom', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-4">
                      <label className="form-label fw-semibold small">Purchase UOM *</label>
                      <input
                        type="text"
                        className="form-control font-monospace"
                        placeholder="kg, liter, box"
                        value={materialForm.data.purchase_uom}
                        onChange={(e) => materialForm.setData('purchase_uom', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-4">
                      <label className="form-label fw-semibold small">Multiplier *</label>
                      <input
                        type="number"
                        step="1"
                        className="form-control font-monospace"
                        placeholder="1000"
                        value={materialForm.data.conversion_rate}
                        onChange={(e) => materialForm.setData('conversion_rate', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold small">Standard Cost per Base Unit (RM) *</label>
                      <input
                        type="number"
                        step="0.0001"
                        className="form-control font-monospace"
                        placeholder="0.0800"
                        value={materialForm.data.standard_cost_per_base_unit}
                        onChange={(e) => materialForm.setData('standard_cost_per_base_unit', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold small">Min Stock Alert Level *</label>
                      <input
                        type="number"
                        step="1"
                        className="form-control font-monospace"
                        placeholder="500"
                        value={materialForm.data.min_stock_alert_level}
                        onChange={(e) => materialForm.setData('min_stock_alert_level', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowMaterialModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={materialForm.processing}>
                    Save Raw Material
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Quick Stock Adjustment */}
      {showAdjustModal && adjustTarget && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Stock Reconciliation: {adjustTarget.name}</h5>
                <button type="button" className="btn-close" onClick={() => setShowAdjustModal(false)}></button>
              </div>
              <form onSubmit={handleSaveAdjust}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Target Stock Location *</label>
                    <select
                      className="form-select"
                      value={adjustForm.data.location_id}
                      onChange={(e) => adjustForm.setData('location_id', e.target.value)}
                      required
                    >
                      {stockLocations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.location_name} ({loc.location_type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">
                      Actual Physical Stock Count ({adjustTarget.base_uom}) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control font-monospace"
                      value={adjustForm.data.quantity_on_hand}
                      onChange={(e) => adjustForm.setData('quantity_on_hand', e.target.value)}
                      required
                    />
                    <div className="form-text small">
                      Entering a count will directly set the balance for the selected location in the inventory ledger.
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAdjustModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={adjustForm.processing}>
                    Update Balance
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
