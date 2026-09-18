import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { useWishlist } from '../../context/WishlistContext';
import ProductCard from './ProductCard';
import { ProductCardSkeleton } from './Skeleton';

// Filter facets mirror the Product model's `shirtType` enum (a schema concern, not business data)
const SHIRT_TYPE_FILTERS = [
  { value: 'collar', label: 'Collar' },
  { value: 'casual', label: 'Casual' },
  { value: 'oversized', label: 'Oversized' },
];

const SORT_OPTIONS = [
  { value: '', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Most Reviewed' },
];

const ProductList = ({ searchQuery = '', showFavorites = false, shirtTypeParam = '', categoryParam = '' }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [activeTypes, setActiveTypes] = useState(() => {
    const fromUrl = searchParams.get('shirtType');
    if (fromUrl) return fromUrl.split(',').filter(Boolean);
    return shirtTypeParam ? [shirtTypeParam] : [];
  });
  const [activeCategory, setActiveCategory] = useState(() => searchParams.get('category') || categoryParam || '');
  const [sort, setSort] = useState(() => searchParams.get('sort') || '');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(showFavorites);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const { wishlist } = useWishlist();

  // Load active categories from the API for the filter sidebar
  useEffect(() => {
    let alive = true;
    categoryService
      .getCategories()
      .then((res) => {
        if (alive && res?.success) setCategories(res.data || []);
      })
      .catch(() => {
        // Filter section simply stays empty if categories can't load
      });
    return () => {
      alive = false;
    };
  }, []);

  // Sync URL ⇄ active filters so filters are shareable and survive refresh
  useEffect(() => {
    const fromUrl = searchParams.get('shirtType');
    const next = fromUrl ? fromUrl.split(',').filter(Boolean) : shirtTypeParam ? [shirtTypeParam] : [];
    setActiveTypes((current) => (JSON.stringify(current) === JSON.stringify(next) ? current : next));
    const cat = searchParams.get('category') || '';
    setActiveCategory((current) => (current === cat ? current : cat));
    const s = searchParams.get('sort') || '';
    setSort((current) => (current === s ? current : s));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const updateParams = (mutate) => {
    const params = new URLSearchParams(searchParams);
    mutate(params);
    setSearchParams(params, { replace: true });
  };

  const toggleType = (value) => {
    setActiveTypes((current) => {
      const next = current.includes(value)
        ? current.filter((t) => t !== value)
        : [...current, value];
      updateParams((params) => {
        if (next.length > 0) params.set('shirtType', next.join(','));
        else params.delete('shirtType');
      });
      return next;
    });
  };

  const toggleCategory = (value) => {
    const next = activeCategory === value ? '' : value;
    setActiveCategory(next);
    updateParams((params) => {
      if (next) params.set('category', next);
      else params.delete('category');
    });
  };

  const changeSort = (value) => {
    setSort(value);
    updateParams((params) => {
      if (value) params.set('sort', value);
      else params.delete('sort');
    });
  };

  const clearFilters = () => {
    setActiveTypes([]);
    setActiveCategory('');
    setSort('');
    updateParams((params) => {
      params.delete('shirtType');
      params.delete('category');
      params.delete('sort');
      params.delete('search');
    });
  };

  // Fetch from the backend catalog API (server-side filtering)
  useEffect(() => {
    const controller = new AbortController();
    const fetchProducts = async () => {
      setLoading(true);
      setError('');
      try {
        const params = {};
        if (searchQuery.trim()) params.search = searchQuery.trim();
        if (activeTypes.length > 0) params.shirtType = activeTypes.join(',');
        if (activeCategory) params.category = activeCategory;
        if (sort) params.sort = sort;
        params.limit = 60;
        const res = await productService.getProducts(params);
        if (res?.success) {
          setProducts(res.data || []);
          setTotal(res.pagination?.total ?? (res.data || []).length);
        } else {
          setError('Could not load products. Please try again.');
        }
      } catch (err) {
        if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
          setError(err.message || 'Could not load products. Is the server running?');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
    return () => controller.abort();
  }, [searchQuery, activeTypes, activeCategory, sort]);

  const displayedProducts = useMemo(() => {
    if (!showFavoritesOnly) return products;
    const favoriteIds = new Set((wishlist || []).map((item) => item._id));
    return products.filter((p) => favoriteIds.has(p._id));
  }, [products, showFavoritesOnly, wishlist]);

  const hasActiveFilters = activeTypes.length > 0 || !!searchQuery.trim() || !!activeCategory || !!sort;

  const activeFilterLabels = [
    ...activeTypes.map((t) => SHIRT_TYPE_FILTERS.find((f) => f.value === t)?.label || t),
    ...(activeCategory
      ? [categories.find((c) => (c.slug || c._id) === activeCategory)?.name || activeCategory]
      : []),
    ...(searchQuery.trim() ? [`“${searchQuery.trim()}”`] : []),
  ];

  const FilterPanel = (
    <div className="space-y-6">
      {categories.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wideplus text-ink-900 mb-3">
            Categories
          </p>
          <ul className="space-y-2.5">
            {categories.map((cat) => {
              const key = cat.slug || cat._id;
              const checked = activeCategory === key;
              return (
                <li key={cat._id}>
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-700 hover:text-ink-900">
                    <input
                      type="radio"
                      name="category"
                      checked={checked}
                      onChange={() => toggleCategory(key)}
                      className="h-3.5 w-3.5 rounded-none border-ink-300 text-ink-900 focus:ring-ink-900"
                    />
                    <span className={checked ? 'font-semibold text-ink-900' : ''}>{cat.name}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wideplus text-ink-900 mb-3">
          Fit &amp; Style
        </p>
        <ul className="space-y-2.5">
          {SHIRT_TYPE_FILTERS.map(({ value, label }) => {
            const checked = activeTypes.includes(value);
            return (
              <li key={value}>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-700 hover:text-ink-900">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleType(value)}
                    className="h-3.5 w-3.5 rounded-none border-ink-300 text-ink-900 focus:ring-ink-900"
                  />
                  <span className={checked ? 'font-semibold text-ink-900' : ''}>{label}</span>
                </label>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-[11px] leading-relaxed text-ink-400">
          Select multiple fits to combine them in one view.
        </p>
      </div>
    </div>
  );

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 pt-8">
      {/* Heading */}
      <div className="rule-heading mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900">
            {showFavorites || showFavoritesOnly ? 'My Favourites' : 'All T-Shirts'}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {loading ? 'Loading collection…' : `${total} ${total === 1 ? 'style' : 'styles'}`}
          </p>
        </div>
      </div>

      <div className="flex gap-10">
        {/* Sidebar filters (desktop) */}
        <aside className="hidden lg:block w-48 shrink-0">
          <div className="sticky top-32">{FilterPanel}</div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Active filter chips */}
              {activeFilterLabels.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 border border-ink-900 bg-ink-900 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wideplus text-canvas"
                >
                  {label}
                </span>
              ))}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wideplus text-ink-500 hover:text-clay-600 transition-colors"
                >
                  <X className="h-3 w-3" /> Clear all
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <label className="hidden sm:flex items-center gap-2 text-xs text-ink-500">
                Sort
                <select
                  value={sort}
                  onChange={(e) => changeSort(e.target.value)}
                  className="border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-900 outline-none focus:border-ink-900"
                >
                  {SORT_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              {showFavorites && (
                <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-600">
                  <input
                    type="checkbox"
                    checked={showFavoritesOnly}
                    onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                    className="h-3.5 w-3.5"
                  />
                  Only favourites
                </label>
              )}
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden inline-flex items-center gap-1.5 border border-line px-3 py-1.5 text-xs font-semibold text-ink-700"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
                {activeTypes.length + (activeCategory ? 1 : 0) > 0 && (
                  <span className="ml-0.5 bg-ink-900 text-canvas px-1.5 rounded-full text-[10px]">
                    {activeTypes.length + (activeCategory ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Product grid */}
          {loading ? (
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <ProductCardSkeleton key={idx} />
              ))}
            </div>
          ) : error ? (
            <div className="border border-line bg-white px-6 py-14 text-center">
              <p className="text-sm font-medium text-ink-900">Something went wrong</p>
              <p className="mt-1.5 text-sm text-ink-500">{error}</p>
              <button type="button" onClick={clearFilters} className="btn-secondary mt-5">
                Reset filters &amp; retry
              </button>
            </div>
          ) : displayedProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
              {displayedProducts.map((product) => (
                <ProductCard key={product._id || product.id} product={product} />
              ))}
            </div>
          ) : (
            /* Empty state */
            <div className="border border-line bg-white px-6 py-16 text-center">
              <p className="font-display text-lg font-semibold text-ink-900">Nothing matches those filters</p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-500">
                {showFavoritesOnly
                  ? 'Tap the heart on any product to save it here.'
                  : 'Try removing a filter or clearing your search to see the full collection.'}
              </p>
              {hasActiveFilters && (
                <button type="button" onClick={clearFilters} className="btn-primary mt-6">
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div
          className="fixed inset-0 z-[70] bg-ink-950/40"
          onClick={() => setMobileFiltersOpen(false)}
        >
          <div
            className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-canvas p-5 overflow-y-auto shadow-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm font-semibold text-ink-900">Filters</p>
              <button type="button" onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters">
                <X className="h-5 w-5 text-ink-500" />
              </button>
            </div>
            {FilterPanel}
            <div className="mt-8 grid gap-2">
              <label className="flex items-center justify-between text-xs text-ink-500">
                Sort
                <select
                  value={sort}
                  onChange={(e) => changeSort(e.target.value)}
                  className="border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-900"
                >
                  {SORT_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <button type="button" onClick={() => { clearFilters(); }} className="btn-quiet justify-center">
                Clear all
              </button>
              <button type="button" onClick={() => setMobileFiltersOpen(false)} className="btn-primary justify-center">
                Show results
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductList;
