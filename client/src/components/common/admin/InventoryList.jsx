import React, { useEffect, useMemo, useState } from 'react';
import { productService } from '../../../services/productService';
import { adminService } from '../../../services/adminService';
import { useToast } from '../../../context/ToastContext';
import { Badge, EmptyState } from './ui';
import './admin.css';

const LOW_STOCK_THRESHOLD = 5;

const InventoryList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [onlyLow, setOnlyLow] = useState(false);
  const [savingKey, setSavingKey] = useState(null);
  const { success } = useToast();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productService.getProducts({ includeInactive: true, limit: 200 });
      setProducts(res.data ?? res.products ?? []);
    } catch {
      /* interceptor handles */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const rows = useMemo(() => {
    let list = products.map((p) => {
      const variants = (p.availableColours || []).filter((v) => v.active !== false);
      const variantStock = variants.reduce((s, v) => s + (v.stock != null ? Number(v.stock) || 0 : 0), 0);
      const hasVariantStock = variants.length > 0 && variants.some((v) => v.stock != null);
      const total = hasVariantStock ? variantStock : (p.stock ?? 0);
      return { _id: p._id, name: p.name, image: p.images?.[0] || null, variants, hasVariantStock, total };
    });
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (onlyLow) list = list.filter((p) => p.total <= LOW_STOCK_THRESHOLD);
    return list.sort((a, b) => a.total - b.total);
  }, [products, search, onlyLow]);

  const saveStock = async (product, variant, value) => {
    const key = `${product._id}:${variant?.name ?? 'base'}`;
    setSavingKey(key);
    try {
      if (variant) {
        await adminService.updateStock(product._id, value, variant.name);
      } else {
        await adminService.updateStock(product._id, value);
      }
      success(`Stock updated for ${product.name}${variant ? ` (${variant.name})` : ''}`);
      await fetchProducts();
    } catch {
      /* interceptor shows toast */
    } finally {
      setSavingKey(null);
    }
  };

  const lowCount = rows.filter((p) => p.total <= LOW_STOCK_THRESHOLD).length;

  return (
    <section>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="admin-page-title">Inventory</h1>
          <p className="admin-page-sub">
            {lowCount > 0
              ? <><Badge tone="danger">{lowCount} low</Badge><span className="ml-2">at or below {LOW_STOCK_THRESHOLD} units</span></>
              : 'All products have healthy stock'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input className="admin-input !w-52" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <label className="admin-check">
            <input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} />
            <span>Low stock only</span>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="admin-card admin-card-pad"><span className="tc-spinner" /></div>
      ) : rows.length === 0 ? (
        <div className="admin-card">
          <EmptyState title={products.length === 0 ? 'No products yet' : 'Nothing matches your filters'} />
        </div>
      ) : (
        <div className="tc-table-wrap">
          <table className="tc-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Variant stock</th>
                <th className="cell-center">Total</th>
                <th className="cell-center">Health</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 shrink-0 overflow-hidden border border-line bg-canvasd">
                        {p.image && <img src={p.image} alt="" className="h-full w-full object-cover" loading="lazy" />}
                      </div>
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td>
                    {p.variants.length === 0 ? (
                      <InlineStock
                        value={p.total}
                        onChange={(v) => saveStock({ _id: p._id, name: p.name }, null, v)}
                        saving={savingKey === `${p._id}:base`}
                      />
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {p.variants.map((v) => (
                          <span
                            key={v.name}
                            className="inline-flex items-center gap-1.5 border border-line bg-canvas px-1.5 py-0.5 text-xs"
                            title={`${v.name}: stock ${v.stock ?? 'fallback'}`}
                          >
                            <span className="h-2.5 w-2.5 inline-block border border-line" style={{ background: v.hex || '#ccc' }} />
                            {v.name}
                            <InlineStock
                              value={v.stock ?? 0}
                              onChange={(val) => saveStock({ _id: p._id, name: p.name }, v, val)}
                              saving={savingKey === `${p._id}:${v.name}`}
                            />
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="cell-center font-medium">{p.total}</td>
                  <td className="cell-center">
                    {p.total === 0 ? <Badge tone="danger">Out</Badge>
                      : p.total <= LOW_STOCK_THRESHOLD ? <Badge tone="warning">Low</Badge>
                      : <Badge tone="success">OK</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

const InlineStock = ({ value, onChange, saving }) => {
  const [val, setVal] = useState(value);
  useEffect(() => setVal(value), [value]);
  return (
    <span className="inline-flex items-center gap-1">
      <input
        type="number"
        min="0"
        className="admin-input !py-0.5 !text-xs !w-14"
        value={val}
        onChange={(e) => setVal(Math.max(0, parseInt(e.target.value, 10) || 0))}
        onBlur={() => val !== value && onChange(val)}
        onKeyDown={(e) => e.key === 'Enter' && val !== value && onChange(val)}
        aria-label="Stock quantity"
      />
      {saving && <span className="tc-spinner !h-3 !w-3" />}
    </span>
  );
};

export default InventoryList;
