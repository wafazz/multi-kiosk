import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Layers,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle,
  X,
  Sparkles
} from 'lucide-react';

interface Ingredient {
  id: number;
  raw_material_id: number;
  raw_material_name: string;
  base_uom: string;
  quantity_required: number;
  unit_cost: number;
  line_cost: number;
}

interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  description: string;
  selling_price: number;
  cost_price: number;
  gross_margin_percent: number;
  image_url: string;
  is_active: boolean;
  ingredients: Ingredient[];
}

interface RawMaterial {
  id: number;
  sku: string;
  name: string;
  category: string;
  base_uom: string;
  standard_cost_per_base_unit: number;
}

interface Props {
  products: Product[];
  rawMaterials: RawMaterial[];
}

export default function ProductsIndex({ products, rawMaterials }: Props) {
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showBomModal, setShowBomModal] = useState(false);
  const [bomProduct, setBomProduct] = useState<Product | null>(null);

  // BOM items state
  const [bomItems, setBomItems] = useState<Array<{ raw_material_id: number; quantity_required: number }>>([]);

  const productForm = useForm({
    sku: '',
    name: '',
    category: 'Coffee & Beverages',
    description: '',
    selling_price: '',
    image_url: '',
  });

  const handleOpenProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      productForm.setData({
        sku: product.sku,
        name: product.name,
        category: product.category,
        description: product.description || '',
        selling_price: product.selling_price.toString(),
        image_url: product.image_url || '',
      });
    } else {
      setEditingProduct(null);
      productForm.reset();
    }
    setShowProductModal(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      productForm.put(`/products/${editingProduct.id}`, {
        onSuccess: () => {
          setShowProductModal(false);
          productForm.reset();
        },
      });
    } else {
      productForm.post('/products', {
        onSuccess: () => {
          setShowProductModal(false);
          productForm.reset();
        },
      });
    }
  };

  const handleDeleteProduct = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete product "${name}"?`)) {
      router.delete(`/products/${id}`);
    }
  };

  const handleOpenBomModal = (product: Product) => {
    setBomProduct(product);
    setBomItems(
      product.ingredients.map((ing) => ({
        raw_material_id: ing.raw_material_id,
        quantity_required: ing.quantity_required,
      }))
    );
    setShowBomModal(true);
  };

  const handleAddBomItem = () => {
    if (rawMaterials.length > 0) {
      setBomItems([...bomItems, { raw_material_id: rawMaterials[0].id, quantity_required: 1 }]);
    }
  };

  const handleRemoveBomItem = (index: number) => {
    setBomItems(bomItems.filter((_, idx) => idx !== index));
  };

  const handleBomChange = (index: number, field: 'raw_material_id' | 'quantity_required', value: any) => {
    const updated = [...bomItems];
    updated[index] = { ...updated[index], [field]: value };
    setBomItems(updated);
  };

  // Live BOM Cost calculation in modal
  const liveBomCost = bomItems.reduce((acc, item) => {
    const mat = rawMaterials.find((m) => m.id === Number(item.raw_material_id));
    if (mat) {
      return acc + (Number(item.quantity_required) || 0) * (Number(mat.standard_cost_per_base_unit) || 0);
    }
    return acc;
  }, 0);

  const handleSaveBom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bomProduct) return;

    router.post(
      `/products/${bomProduct.id}/recipe`,
      { items: bomItems },
      {
        onSuccess: () => {
          setShowBomModal(false);
        },
      }
    );
  };

  return (
    <AdminLayout title="Product Catalog & Recipe (BOM) Builder">
      <Head title="Products & Recipes" />

      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Products & Recipe (BOM) Master</h4>
          <p className="text-muted mb-0 small">
            Define sellable catalog items, configure ingredient recipes (Bill of Materials), and audit gross product margins.
          </p>
        </div>

        <button
          onClick={() => handleOpenProductModal()}
          className="btn btn-primary btn-sm d-flex align-items-center gap-1"
        >
          <Plus size={16} />
          <span>New Product</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="mk-card border-0 shadow-sm overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ minWidth: 220 }}>Product Name & SKU</th>
                <th>Category</th>
                <th>Selling Price</th>
                <th>BOM Cost</th>
                <th>Gross Margin</th>
                <th>Ingredients (BOM)</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-muted small">
                    No products added yet. Click "New Product" to add your first menu item.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt=""
                            className="rounded"
                            style={{ width: 38, height: 38, objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="rounded p-2 bg-light border text-primary d-flex align-items-center justify-content-center" style={{ width: 38, height: 38 }}>
                            <Package size={18} />
                          </div>
                        )}
                        <div>
                          <div className="fw-bold text-dark">{product.name}</div>
                          <span className="font-monospace text-muted small">{product.sku}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-soft-secondary">{product.category}</span>
                    </td>
                    <td>
                      <span className="fw-bold text-dark font-monospace">RM {product.selling_price.toFixed(2)}</span>
                    </td>
                    <td>
                      <span className="font-monospace text-danger fw-semibold">RM {product.cost_price.toFixed(2)}</span>
                    </td>
                    <td>
                      <span className={`badge ${product.gross_margin_percent >= 60 ? 'badge-soft-success' : 'badge-soft-warning'}`}>
                        {product.gross_margin_percent}%
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleOpenBomModal(product)}
                        className="btn btn-sm btn-outline-primary py-1 px-2 d-flex align-items-center gap-1 rounded-pill"
                      >
                        <Layers size={13} />
                        <span>{product.ingredients.length} Ingredients</span>
                      </button>
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          onClick={() => handleOpenProductModal(product)}
                          className="btn btn-outline-secondary"
                          title="Edit Details"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          className="btn btn-outline-danger"
                          title="Delete Product"
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

      {/* Modal: Product Details */}
      {showProductModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  {editingProduct ? `Edit ${editingProduct.name}` : 'Create Sellable Product'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowProductModal(false)}></button>
              </div>
              <form onSubmit={handleSaveProduct}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Product Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Iced Caffe Latte (16oz)"
                      value={productForm.data.name}
                      onChange={(e) => productForm.setData('name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold small">SKU Code *</label>
                      <input
                        type="text"
                        className="form-control text-uppercase font-monospace"
                        placeholder="e.g. LAT-ICE-16"
                        value={productForm.data.sku}
                        onChange={(e) => productForm.setData('sku', e.target.value)}
                        required
                        disabled={editingProduct !== null}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold small">Category *</label>
                      <select
                        className="form-select"
                        value={productForm.data.category}
                        onChange={(e) => productForm.setData('category', e.target.value)}
                      >
                        <option value="Coffee & Beverages">Coffee & Beverages</option>
                        <option value="Pastries & Bakery">Pastries & Bakery</option>
                        <option value="Desserts">Desserts</option>
                        <option value="Snacks & Grab">Snacks & Grab</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Selling Price (RM) *</label>
                    <input
                      type="number"
                      step="0.10"
                      className="form-control"
                      placeholder="12.00"
                      value={productForm.data.selling_price}
                      onChange={(e) => productForm.setData('selling_price', e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Image URL (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="https://..."
                      value={productForm.data.image_url}
                      onChange={(e) => productForm.setData('image_url', e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowProductModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={productForm.processing}>
                    Save Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Interactive Recipe (BOM) Builder */}
      {showBomModal && bomProduct && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                    <Layers size={20} className="text-primary" />
                    Recipe & Bill of Materials: {bomProduct.name}
                  </h5>
                  <span className="text-muted small">
                    Selling Price: RM {bomProduct.selling_price.toFixed(2)} • Raw ingredients consumed per 1 unit sold
                  </span>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowBomModal(false)}></button>
              </div>

              <form onSubmit={handleSaveBom}>
                <div className="modal-body">
                  {/* Live Cost Calculation Callout */}
                  <div className="p-3 rounded-3 bg-light border d-flex align-items-center justify-content-between mb-3">
                    <div>
                      <div className="text-muted small">Calculated Raw Material BOM Cost</div>
                      <h4 className="fw-bold text-danger mb-0 font-monospace">RM {liveBomCost.toFixed(3)}</h4>
                    </div>
                    <div className="text-end">
                      <div className="text-muted small">Projected Gross Margin</div>
                      <h4 className={`fw-bold mb-0 ${bomProduct.selling_price > liveBomCost ? 'text-success' : 'text-danger'}`}>
                        {bomProduct.selling_price > 0
                          ? ((bomProduct.selling_price - liveBomCost) / bomProduct.selling_price * 100).toFixed(1)
                          : 0}
                        %
                      </h4>
                    </div>
                  </div>

                  {/* Ingredients Table */}
                  <div className="table-responsive">
                    <table className="table table-sm align-middle">
                      <thead className="table-light small">
                        <tr>
                          <th>Raw Material Ingredient</th>
                          <th style={{ width: 140 }}>Quantity Required</th>
                          <th>Base Unit</th>
                          <th>Unit Cost</th>
                          <th>Cost Subtotal</th>
                          <th style={{ width: 40 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {bomItems.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-4 text-muted small">
                              No raw materials linked to this product recipe. Click "Add Ingredient" below.
                            </td>
                          </tr>
                        ) : (
                          bomItems.map((item, idx) => {
                            const rawMat = rawMaterials.find((m) => m.id === Number(item.raw_material_id));
                            const subtotal = rawMat
                              ? (Number(item.quantity_required) || 0) * (Number(rawMat.standard_cost_per_base_unit) || 0)
                              : 0;

                            return (
                              <tr key={idx}>
                                <td>
                                  <select
                                    className="form-select form-select-sm"
                                    value={item.raw_material_id}
                                    onChange={(e) => handleBomChange(idx, 'raw_material_id', Number(e.target.value))}
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
                                    onChange={(e) => handleBomChange(idx, 'quantity_required', parseFloat(e.target.value) || 0)}
                                    required
                                  />
                                </td>
                                <td>
                                  <span className="badge badge-soft-secondary font-monospace">
                                    {rawMat?.base_uom || '-'}
                                  </span>
                                </td>
                                <td className="font-monospace small text-muted">
                                  RM {(rawMat?.standard_cost_per_base_unit || 0).toFixed(4)}
                                </td>
                                <td className="font-monospace small fw-bold text-dark">
                                  RM {subtotal.toFixed(3)}
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveBomItem(idx)}
                                    className="btn btn-xs btn-link text-danger p-0"
                                    title="Remove Item"
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
                  </div>

                  <button
                    type="button"
                    onClick={handleAddBomItem}
                    className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 mt-2"
                  >
                    <Plus size={14} /> Add Ingredient Line
                  </button>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowBomModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    Save Recipe BOM
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
