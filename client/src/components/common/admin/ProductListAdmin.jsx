// client/src/components/common/admin/ProductListAdmin.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { productService } from '../../../services/productService';
import { useToast } from '../../../context/ToastContext';
import { Badge, EmptyState, PageHeader } from './ui';
import { imageUrl } from '../../../utils/imageUrl';
import './admin.css';

const ProductListAdmin = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productService.getProducts({ limit: 100, includeInactive: true });
      setProducts(res.data || []);
    } catch (e) {
      toastError(e.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product permanently? Consider deactivating it instead to keep order history clean.')) return;
    try {
      await productService.deleteProduct(id);
      success('Product deleted');
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (e) {
      toastError(e.message || 'Failed to delete product');
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => `${p.name} ${p.category?.name || ''} ${p.slug || ''}`.toLowerCase().includes(q));
  }, [products, search]);

  // Variant-aware total stock (mirrors Product.totalStock() on the server)
  const totalStock = (p) => {
    const variants = (p.availableColours || []).filter((c) => c.active !== false);
    if (variants.length && variants.some((c) => c.stock != null)) {
      return variants.reduce((s, c) => s + (c.stock != null ? Number(c.stock) || 0 : 0), 0);
    }
    return p.stock ?? 0;
  };

  return (
    <section>
      <PageHeader
        title="Products"
        subtitle={`${products.length} product${products.length === 1 ? '' : 's'} in the catalogue`}
        actions={
          <Link to="create" className="admin-btn admin-btn-primary">
            <FaPlus /> New Product
          </Link>
        }
      />

      <div className="admin-toolbar">
        <label className="admin-search">
          <span className="search-icon">⌕</span>
          <input
            className="admin-input"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>

      {loading ? (
        <div className="admin-card admin-card-pad"><span className="tc-spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="admin-card">
          <EmptyState
            title={search ? 'No products match your search' : 'No products yet'}
            hint={search ? 'Try a different search term.' : 'Create your first product — it appears in the shop immediately.'}
            action={!search && <Link to="create" className="admin-btn admin-btn-primary"><FaPlus /> New Product</Link>}
          />
        </div>
      ) : (
        <div className="tc-table-wrap">
          <table className="tc-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th className="cell-right">Price</th>
                <th className="cell-center">Variants</th>
                <th className="cell-center">Stock</th>
                <th className="cell-center">Status</th>
                <th className="cell-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const img = imageUrl(p.images?.[0], 80);
                return (
                  <tr key={p._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-8 shrink-0 overflow-hidden bg-canvasd border border-line">
                          {img && <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />}
                        </div>
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="text-ink-500">{p.category?.name || '—'}</td>
                    <td className="cell-right font-semibold">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p.discountPrice ?? p.basePrice)}
                    </td>
                    <td className="cell-center text-ink-500">{p.availableColours?.length || 0}</td>
                    <td className="cell-center">
                      {(() => {
                        const stock = totalStock(p);
                        return stock <= 10
                          ? <Badge tone={stock === 0 ? 'danger' : 'warning'}>{stock}</Badge>
                          : stock;
                      })()}
                    </td>
                    <td className="cell-center">
                      <Badge tone={p.active === false ? 'neutral' : 'success'}>
                        {p.active === false ? 'Inactive' : 'Active'}
                      </Badge>
                    </td>
                    <td className="cell-center">
                      <div className="inline-flex gap-1.5">
                        <button type="button" onClick={() => navigate(`edit/${p._id}`)} className="admin-icon-btn" title="Edit">
                          <FaEdit />
                        </button>
                        <button type="button" onClick={() => handleDelete(p._id)} className="admin-icon-btn danger" title="Delete">
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default ProductListAdmin;
