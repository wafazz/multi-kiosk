import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import {
  Sliders,
  Plus,
  Edit2,
  Trash2,
  Layers,
  DollarSign,
  Package,
  CheckCircle,
  X,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';

interface RecipeLine {
  id: number;
  raw_material_id: number;
  raw_material_name: string;
  base_uom: string;
  quantity_required: number;
  unit_cost: number;
  line_cost: number;
}

interface ModifierOption {
  id: number;
  name: string;
  price_adjustment: number;
  is_active: boolean;
  calculated_bom_cost: number;
  recipes: RecipeLine[];
}

interface ModifierGroup {
  id: number;
  name: string;
  selection_type: 'SINGLE' | 'MULTIPLE';
  is_required: boolean;
  min_selections: number;
  max_selections: number;
  is_active: boolean;
  products_count: number;
  products: Array<{ id: number; name: string; sku: string }>;
  options: ModifierOption[];
}

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
}

interface RawMaterial {
  id: number;
  name: string;
  sku: string;
  base_uom: string;
  standard_cost_per_base_unit: number;
}

interface Props {
  modifierGroups: ModifierGroup[];
  products: Product[];
  rawMaterials: RawMaterial[];
}

export default function ModifiersIndex({ modifierGroups, products, rawMaterials }: Props) {
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ModifierGroup | null>(null);
  const [showOptionModal, setShowOptionModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ModifierGroup | null>(null);
  const [editingOption, setEditingOption] = useState<ModifierOption | null>(null);

  // Group Form
  const groupForm = useForm({
    name: '',
    selection_type: 'MULTIPLE',
    is_required: false,
    min_selections: 0,
    max_selections: 3,
    product_ids: [] as number[],
  });

  // Option Form with dynamic BOM recipe items
  const [optionBomItems, setOptionBomItems] = useState<Array<{ raw_material_id: number; quantity_required: number }>>([]);
  const optionForm = useForm({
    modifier_group_id: '',
    name: '',
    price_adjustment: '0.00',
  });

  const handleOpenGroupModal = (group?: ModifierGroup) => {
    if (group) {
      setEditingGroup(group);
      groupForm.setData({
        name: group.name,
        selection_type: group.selection_type,
        is_required: group.is_required,
        min_selections: group.min_selections,
        max_selections: group.max_selections,
        product_ids: group.products.map((p) => p.id),
      });
    } else {
      setEditingGroup(null);
      groupForm.reset();
      groupForm.setData('product_ids', []);
    }
    setShowGroupModal(true);
  };

  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGroup) {
      groupForm.put(`/modifiers/groups/${editingGroup.id}`, {
        onSuccess: () => {
          setShowGroupModal(false);
          groupForm.reset();
        },
      });
    } else {
      groupForm.post('/modifiers/groups', {
        onSuccess: () => {
          setShowGroupModal(false);
          groupForm.reset();
        },
      });
    }
  };

  const handleDeleteGroup = (group: ModifierGroup) => {
    if (confirm(`Are you sure you want to delete modifier group "${group.name}"?`)) {
      router.delete(`/modifiers/groups/${group.id}`);
    }
  };

  const handleOpenOptionModal = (group: ModifierGroup, option?: ModifierOption) => {
    setSelectedGroup(group);
    if (option) {
      setEditingOption(option);
      optionForm.setData({
        modifier_group_id: group.id.toString(),
        name: option.name,
        price_adjustment: option.price_adjustment.toString(),
      });
      setOptionBomItems(
        option.recipes.map((r) => ({
          raw_material_id: r.raw_material_id,
          quantity_required: r.quantity_required,
        }))
      );
    } else {
      setEditingOption(null);
      optionForm.reset();
      optionForm.setData({
        modifier_group_id: group.id.toString(),
        name: '',
        price_adjustment: '0.00',
      });
      setOptionBomItems([]);
    }
    setShowOptionModal(true);
  };

  const handleAddOptionBomItem = () => {
    if (rawMaterials.length > 0) {
      setOptionBomItems([...optionBomItems, { raw_material_id: rawMaterials[0].id, quantity_required: 1 }]);
    }
  };

  const handleRemoveOptionBomItem = (index: number) => {
    setOptionBomItems(optionBomItems.filter((_, idx) => idx !== index));
  };

  const handleOptionBomChange = (index: number, field: 'raw_material_id' | 'quantity_required', val: any) => {
    const updated = [...optionBomItems];
    updated[index] = { ...updated[index], [field]: val };
    setOptionBomItems(updated);
  };

  const liveOptionBomCost = optionBomItems.reduce((acc, item) => {
    const mat = rawMaterials.find((m) => m.id === Number(item.raw_material_id));
    if (mat) {
      return acc + (Number(item.quantity_required) || 0) * (Number(mat.standard_cost_per_base_unit) || 0);
    }
    return acc;
  }, 0);

  const handleSaveOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingOption) {
      router.post(
        `/modifiers/options/${editingOption.id}/recipe`,
        {
          name: optionForm.data.name,
          price_adjustment: parseFloat(optionForm.data.price_adjustment) || 0,
          recipes: optionBomItems,
        },
        {
          onSuccess: () => {
            setShowOptionModal(false);
          },
        }
      );
    } else {
      router.post(
        '/modifiers/options',
        {
          modifier_group_id: selectedGroup?.id,
          name: optionForm.data.name,
          price_adjustment: parseFloat(optionForm.data.price_adjustment) || 0,
          recipes: optionBomItems,
        },
        {
          onSuccess: () => {
            setShowOptionModal(false);
          },
        }
      );
    }
  };

  const handleDeleteOption = (option: ModifierOption) => {
    if (confirm(`Are you sure you want to delete option "${option.name}"?`)) {
      router.delete(`/modifiers/options/${option.id}`);
    }
  };

  const toggleProductSelection = (productId: number) => {
    const current = [...groupForm.data.product_ids];
    if (current.includes(productId)) {
      groupForm.setData('product_ids', current.filter((id) => id !== productId));
    } else {
      groupForm.setData('product_ids', [...current, productId]);
    }
  };

  return (
    <AdminLayout title="Product Modifiers & Add-on Recipe (BOM) Deductions">
      <Head title="Product Modifiers & Add-ons" />

      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Product Modifiers & Add-on Recipe BOMs</h4>
          <p className="text-muted mb-0 small">
            Configure customizable add-ons, extra shots, milk choices, and size upgrades with dynamic price adjustments and automatic raw material recipe deductions.
          </p>
        </div>

        <button onClick={() => handleOpenGroupModal()} className="btn btn-primary btn-sm d-flex align-items-center gap-1">
          <Plus size={16} />
          <span>New Modifier Group</span>
        </button>
      </div>

      {/* Groups Grid */}
      {modifierGroups.length === 0 ? (
        <div className="mk-card p-5 text-center border-0 shadow-sm">
          <Sliders size={48} className="text-muted mb-3 mx-auto" />
          <h5 className="fw-bold text-dark">No modifier groups created yet</h5>
          <p className="text-muted small">
            Create modifier groups (e.g. "Espresso Shots & Toppings", "Milk Substitutes") to allow add-ons with attached BOM ingredient deductions.
          </p>
          <button onClick={() => handleOpenGroupModal()} className="btn btn-primary btn-sm mx-auto">
            Create First Modifier Group
          </button>
        </div>
      ) : (
        <div className="d-flex flex-column gap-4">
          {modifierGroups.map((group) => (
            <div key={group.id} className="mk-card border-0 shadow-sm overflow-hidden">
              {/* Group Header */}
              <div className="p-3 bg-white border-bottom d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded p-2 bg-primary bg-opacity-10 text-primary">
                    <Sliders size={20} />
                  </div>
                  <div>
                    <div className="d-flex align-items-center gap-2">
                      <h5 className="fw-bold mb-0 text-dark">{group.name}</h5>
                      <span className="badge badge-soft-secondary">{group.selection_type}</span>
                      {group.is_required && <span className="badge badge-soft-danger">Required</span>}
                    </div>
                    <div className="text-muted small mt-1">
                      Attached to <span className="fw-semibold text-primary">{group.products_count} products</span> (e.g.{' '}
                      {group.products.slice(0, 3).map((p) => p.name).join(', ') || 'None'}
                      {group.products.length > 3 ? '...' : ''})
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button
                    onClick={() => handleOpenOptionModal(group)}
                    className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                  >
                    <Plus size={14} /> Add Option / Add-on
                  </button>
                  <button
                    onClick={() => handleOpenGroupModal(group)}
                    className="btn btn-sm btn-outline-secondary"
                    title="Edit Group"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group)}
                    className="btn btn-sm btn-outline-danger"
                    title="Delete Group"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Options Table */}
              <div className="p-0">
                <div className="table-responsive">
                  <table className="table table-hover table-sm align-middle mb-0">
                    <thead className="table-light small">
                      <tr>
                        <th style={{ minWidth: 200 }}>Add-on / Option Name</th>
                        <th>Price Charge</th>
                        <th>Attached Recipe BOM Deductions</th>
                        <th>Calculated Add-on BOM Cost</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.options.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-4 text-muted small">
                            No options in this group. Click "Add Option / Add-on" to create choices.
                          </td>
                        </tr>
                      ) : (
                        group.options.map((opt) => (
                          <tr key={opt.id}>
                            <td>
                              <div className="fw-bold text-dark">{opt.name}</div>
                            </td>
                            <td>
                              <span className="font-monospace fw-bold text-primary">
                                {opt.price_adjustment > 0 ? `+RM ${opt.price_adjustment.toFixed(2)}` : 'FREE (RM 0.00)'}
                              </span>
                            </td>
                            <td>
                              {opt.recipes.length === 0 ? (
                                <span className="text-muted small">No ingredient deduction</span>
                              ) : (
                                <div className="d-flex flex-wrap gap-1">
                                  {opt.recipes.map((r) => (
                                    <span key={r.id} className="badge badge-soft-info small font-monospace">
                                      {r.raw_material_name}: +{r.quantity_required} {r.base_uom}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td>
                              <span className="font-monospace text-danger small fw-semibold">
                                RM {opt.calculated_bom_cost.toFixed(3)}
                              </span>
                            </td>
                            <td className="text-end">
                              <div className="btn-group btn-group-sm">
                                <button
                                  onClick={() => handleOpenOptionModal(group, opt)}
                                  className="btn btn-outline-secondary"
                                  title="Edit BOM Recipe"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteOption(opt)}
                                  className="btn btn-outline-danger"
                                  title="Delete Option"
                                >
                                  <Trash2 size={13} />
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
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create / Edit Modifier Group */}
      {showGroupModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  {editingGroup ? `Edit ${editingGroup.name}` : 'Create Modifier Group'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowGroupModal(false)}></button>
              </div>

              <form onSubmit={handleSaveGroup}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Group Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Espresso Shots & Toppings"
                      value={groupForm.data.name}
                      onChange={(e) => groupForm.setData('name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold small">Selection Type *</label>
                      <select
                        className="form-select"
                        value={groupForm.data.selection_type}
                        onChange={(e) => groupForm.setData('selection_type', e.target.value as any)}
                      >
                        <option value="MULTIPLE">Multiple Selections (Checkboxes)</option>
                        <option value="SINGLE">Single Choice Only (Radio Buttons)</option>
                      </select>
                    </div>

                    <div className="col-6">
                      <label className="form-label fw-semibold small">Required / Optional</label>
                      <div className="form-check form-switch mt-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="reqCheck"
                          checked={groupForm.data.is_required}
                          onChange={(e) => groupForm.setData('is_required', e.target.checked)}
                        />
                        <label className="form-check-label small" htmlFor="reqCheck">
                          Mandatory Choice
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Product Attachment Checklist */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold small d-flex align-items-center gap-1">
                      <Package size={14} className="text-primary" /> Apply to Products
                    </label>
                    <div className="p-2 border rounded bg-light overflow-y-auto" style={{ maxHeight: 180 }}>
                      {products.map((p) => (
                        <div key={p.id} className="form-check py-1">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`prod-${p.id}`}
                            checked={groupForm.data.product_ids.includes(p.id)}
                            onChange={() => toggleProductSelection(p.id)}
                          />
                          <label className="form-check-label small text-dark d-flex justify-content-between" htmlFor={`prod-${p.id}`}>
                            <span>{p.name}</span>
                            <span className="font-monospace text-muted small">{p.sku}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowGroupModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={groupForm.processing}>
                    Save Group
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Option & BOM Recipe */}
      {showOptionModal && selectedGroup && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                    <Layers size={20} className="text-primary" />
                    {editingOption ? `Edit Option: ${editingOption.name}` : `Add Option to "${selectedGroup.name}"`}
                  </h5>
                  <span className="text-muted small">Configure customer price adjustment and automatic raw material stock deduction</span>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowOptionModal(false)}></button>
              </div>

              <form onSubmit={handleSaveOption}>
                <div className="modal-body">
                  <div className="row g-2 mb-3">
                    <div className="col-7">
                      <label className="form-label fw-semibold small">Option / Add-on Display Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Extra Espresso Shot"
                        value={optionForm.data.name}
                        onChange={(e) => optionForm.setData('name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-5">
                      <label className="form-label fw-semibold small">Price Surcharge (RM) *</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light font-monospace small">+RM</span>
                        <input
                          type="number"
                          step="0.50"
                          min="0"
                          className="form-control font-monospace"
                          placeholder="3.00"
                          value={optionForm.data.price_adjustment}
                          onChange={(e) => optionForm.setData('price_adjustment', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Calculated Cost Callout */}
                  <div className="p-3 rounded-3 bg-light border d-flex align-items-center justify-content-between mb-3">
                    <div>
                      <div className="text-muted small">Calculated Raw Ingredient Deduction Cost</div>
                      <h4 className="fw-bold text-danger mb-0 font-monospace">RM {liveOptionBomCost.toFixed(3)}</h4>
                    </div>
                    <div className="text-end">
                      <div className="text-muted small">Option Gross Profit Impact</div>
                      <h4 className="fw-bold text-success mb-0 font-monospace">
                        +RM {Math.max(0, (parseFloat(optionForm.data.price_adjustment) || 0) - liveOptionBomCost).toFixed(2)}
                      </h4>
                    </div>
                  </div>

                  {/* Modifier BOM Ingredients */}
                  <div className="mb-2">
                    <label className="form-label fw-semibold small d-flex align-items-center gap-1">
                      <Layers size={14} className="text-primary" /> Raw Material Stock Deductions per Sale
                    </label>
                    <table className="table table-sm align-middle">
                      <thead className="table-light small">
                        <tr>
                          <th>Raw Material Ingredient</th>
                          <th style={{ width: 160 }}>Quantity to Deduct</th>
                          <th>Base Unit</th>
                          <th>Unit Cost</th>
                          <th style={{ width: 40 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {optionBomItems.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-3 text-muted small">
                              No ingredient deductions linked. (e.g., Temperature options like "Less Ice" have no extra cost, while "Extra Shot" has +18g beans).
                            </td>
                          </tr>
                        ) : (
                          optionBomItems.map((item, idx) => {
                            const rawMat = rawMaterials.find((m) => m.id === Number(item.raw_material_id));
                            return (
                              <tr key={idx}>
                                <td>
                                  <select
                                    className="form-select form-select-sm"
                                    value={item.raw_material_id}
                                    onChange={(e) => handleOptionBomChange(idx, 'raw_material_id', Number(e.target.value))}
                                    required
                                  >
                                    {rawMaterials.map((m) => (
                                      <option key={m.id} value={m.id}>
                                        {m.name} ({m.sku})
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0.001"
                                    className="form-control form-control-sm font-monospace"
                                    value={item.quantity_required}
                                    onChange={(e) => handleOptionBomChange(idx, 'quantity_required', parseFloat(e.target.value) || 0)}
                                    required
                                  />
                                </td>
                                <td>
                                  <span className="badge badge-soft-secondary font-monospace">
                                    {rawMat?.base_uom || ''}
                                  </span>
                                </td>
                                <td className="font-monospace small text-muted">
                                  RM {(rawMat?.standard_cost_per_base_unit || 0).toFixed(4)}
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOptionBomItem(idx)}
                                    className="btn btn-xs btn-link text-danger p-0"
                                  >
                                    <X size={16} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>

                    <button
                      type="button"
                      onClick={handleAddOptionBomItem}
                      className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                    >
                      <Plus size={14} /> Add Ingredient Deduction
                    </button>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowOptionModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    Save Modifier Option
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
