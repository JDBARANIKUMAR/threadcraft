import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../../services/adminService';
import { Badge, EmptyState } from './ui';
import './admin.css';

const PAGE_SIZE = 12;

const CustomerListAdmin = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await adminService.getCustomers();
        setCustomers(res.data ?? res.customers ?? res);
      } catch {
        /* interceptor handles */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter((c) =>
      (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q)
    );
  }, [customers, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <section>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="admin-page-title">Customers</h1>
          <p className="admin-page-sub">{customers.length} registered account{customers.length === 1 ? '' : 's'}</p>
        </div>
        <input
          className="tc-input w-56"
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {loading ? (
        <div className="admin-card admin-card-pad"><span className="tc-spinner" /></div>
      ) : pageItems.length === 0 ? (
        <div className="admin-card">
          <EmptyState title={customers.length === 0 ? 'No customers yet' : 'No customers match your search'} />
        </div>
      ) : (
        <div className="admin-card">
          <div className="tc-table-wrap">
            <table className="tc-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th className="cell-center">Role</th>
                  <th className="cell-right">Orders</th>
                  <th className="cell-right">Joined</th>
                  <th className="cell-center">Details</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((c) => (
                  <tr
                    key={c._id}
                    className="cursor-pointer hover:bg-canvas/60"
                    onClick={() => navigate(`/admin/customers/${c._id}`)}
                  >
                    <td>
                      <div className="flex items-center gap-2.5">
                        <span className="h-8 w-8 shrink-0 bg-clay/20 text-clay flex items-center justify-center text-xs font-semibold">
                          {(c.name || '?').charAt(0).toUpperCase()}
                        </span>
                        <span className="font-medium">{c.name || '—'}</span>
                      </div>
                    </td>
                    <td className="text-ink-500">{c.email}</td>
                    <td className="cell-center">
                      <Badge tone={c.role === 'admin' ? 'info' : 'neutral'}>{c.role || 'customer'}</Badge>
                    </td>
                    <td className="cell-right">{c.orderCount ?? c.ordersCount ?? '—'}</td>
                    <td className="cell-right text-ink-500 whitespace-nowrap">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="cell-center"><span className="text-ink-400">›</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="tc-table-pagination">
          <button className="tc-btn-ghost !py-1.5" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
            ‹ Prev
          </button>
          <span className="text-sm text-ink-500">Page {safePage} of {totalPages}</span>
          <button className="tc-btn-ghost !py-1.5" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>
            Next ›
          </button>
        </div>
      )}
    </section>
  );
};

export default CustomerListAdmin;
