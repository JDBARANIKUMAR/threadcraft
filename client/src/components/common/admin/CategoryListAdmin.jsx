import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { categoryService } from '../../../services/categoryService';
import { useToast } from '../../../context/ToastContext';
import { Badge, EmptyState, PageHeader } from './ui';
import { imageUrl } from '../../../utils/imageUrl';
import './admin.css';

const CategoryListAdmin = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await categoryService.getAdminCategories();
      setCategories(res.data ?? []);
    } catch (e) {
      toastError(e.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category permanently? Products in it keep existing but lose their category link — deactivating is usually safer.')) return;
    try {
      await categoryService.deleteCategory(id);
      success('Category deleted');
      setCategories((prev) => prev.filter((c) => c._id !== id));
    } catch (e) {
      toastError(e.message || 'Failed to delete category');
    }
  };

  const sorted = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  );

  return (
    <section>
      <PageHeader
        title="Categories"
        subtitle="These appear on the homepage and in shop filters"
        actions={<button type="button" className="admin-btn admin-btn-primary" onClick={() => navigate('/admin/categories/create')}><FaPlus /> New Category</button>}
      />

      {loading ? (
        <div className="admin-card admin-card-pad"><span className="tc-spinner" /></div>
      ) : sorted.length === 0 ? (
        <div className="admin-card">
          <EmptyState
            title="No categories yet"
            hint="Create categories like “Oversized T-Shirts” — they show up on the storefront instantly."
            action={<button type="button" className="admin-btn admin-btn-primary" onClick={() => navigate('/admin/categories/create')}><FaPlus /> New Category</button>}
          />
        </div>
      ) : (
        <div className="tc-table-wrap">
          <table className="tc-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Slug</th>
                <th>Description</th>
                <th className="cell-center">Status</th>
                <th className="cell-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => {
                const img = imageUrl(c.image, 80);
                return (
                  <tr key={c._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 shrink-0 overflow-hidden bg-canvasd border border-line">
                          {img && <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />}
                        </div>
                        <span className="font-medium">{c.name}</span>
                      </div>
                    </td>
                    <td className="font-mono text-xs text-ink-500">{c.slug}</td>
                    <td className="text-ink-500 max-w-[260px] truncate">{c.description || '—'}</td>
                    <td className="cell-center">
                      <Badge tone={c.active ? 'success' : 'neutral'}>{c.active ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="cell-center">
                      <div className="inline-flex gap-1.5">
                        <button type="button" onClick={() => navigate(`/admin/categories/edit/${c._id}`)} className="admin-icon-btn" title="Edit"><FaEdit /></button>
                        <button type="button" onClick={() => handleDelete(c._id)} className="admin-icon-btn danger" title="Delete"><FaTrash /></button>
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

export default CategoryListAdmin;
