import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Check, Minus, Plus, ShoppingBag, Sparkles, X } from 'lucide-react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import TShirtMockupSVG from '../customizer/TShirtMockupSVG';
import DesignStudioCanvas from '../customizer/DesignStudioCanvas';
import DesignStudioToolbar from '../customizer/DesignStudioToolbar';
import DesignLibraryPanel from '../customizer/DesignLibraryPanel';
import { useCart } from '../../context/CartContext';
import { productService } from '../../services/productService';
import { designService } from '../../services/designService';
import { settingsService } from '../../services/settingsService';
import { formatINR } from '../../utils/formatPrice';

/* ─────────────────────── CUSTOMIZATION MODAL ───────────────────────────── */
const CustomizationModal = ({ product, initialColor, initialSize, onClose, onAddToCart }) => {
  const [view, setView] = useState('front');
  const [baseColor, setBaseColor] = useState(
    initialColor || product.availableColours?.[0]?.hex || '#111827'
  );
  const [size, setSize] = useState(initialSize || 'M');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('upload');
  const [toastMessage, setToastMessage] = useState('');

  const [frontElements, setFrontElements] = useState([]);
  const [backElements, setBackElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [history, setHistory] = useState([{ frontElements: [], backElements: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const pushHistory = (newFront, newBack) => {
    const updated = history.slice(0, historyIndex + 1);
    updated.push({ frontElements: newFront, backElements: newBack });
    setHistory(updated);
    setHistoryIndex(updated.length - 1);
  };

  const currentElements = view === 'front' ? frontElements : backElements;

  const setElementsForCurrentView = (updater) => {
    if (view === 'front') {
      const nextFront = typeof updater === 'function' ? updater(frontElements) : updater;
      setFrontElements(nextFront);
      pushHistory(nextFront, backElements);
    } else {
      const nextBack = typeof updater === 'function' ? updater(backElements) : updater;
      setBackElements(nextBack);
      pushHistory(frontElements, nextBack);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setFrontElements(prev.frontElements);
      setBackElements(prev.backElements);
      setHistoryIndex(historyIndex - 1);
      setSelectedId(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setFrontElements(next.frontElements);
      setBackElements(next.backElements);
      setHistoryIndex(historyIndex + 1);
      setSelectedId(null);
    }
  };

  const handleAddImage = (imageData) => {
    const newEl = {
      id: `img-${Date.now()}`,
      type: 'image',
      url: imageData.url,
      name: imageData.name,
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      zIndex: currentElements.length + 1,
      naturalWidth: imageData.naturalWidth,
      naturalHeight: imageData.naturalHeight,
      lowResWarning: imageData.lowResWarning,
    };
    setElementsForCurrentView((prev) => [...prev, newEl]);
    setSelectedId(newEl.id);
  };

  const handleAddText = (textData) => {
    const newEl = {
      id: `txt-${Date.now()}`,
      type: 'text',
      text: textData.text,
      fontFamily: textData.fontFamily,
      color: textData.color,
      fontSize: textData.fontSize,
      bold: textData.bold,
      italic: textData.italic,
      align: textData.align,
      isCurved: textData.isCurved,
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      zIndex: currentElements.length + 1,
    };
    setElementsForCurrentView((prev) => [...prev, newEl]);
    setSelectedId(newEl.id);
  };

  const handleUpdateElement = (id, changes) => {
    setElementsForCurrentView((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...changes } : el))
    );
  };

  const handleDeleteElement = (id) => {
    setElementsForCurrentView((prev) => prev.filter((el) => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleMoveLayer = (id, direction) => {
    if (direction === 'select') {
      setSelectedId(id);
      return;
    }
    setElementsForCurrentView((prev) => {
      const index = prev.findIndex((el) => el.id === id);
      if (index === -1) return prev;
      const copy = [...prev];
      if (direction === 'up' && index < copy.length - 1) {
        const temp = copy[index];
        copy[index] = copy[index + 1];
        copy[index + 1] = temp;
      } else if (direction === 'down' && index > 0) {
        const temp = copy[index];
        copy[index] = copy[index - 1];
        copy[index - 1] = temp;
      }
      return copy;
    });
  };

  const handleClearAll = () => {
    if (window.confirm(`Clear all elements on ${view} view?`)) {
      setElementsForCurrentView([]);
      setSelectedId(null);
    }
  };

  const handleSaveDesign = () => {
    try {
      const savedDesign = {
        productId: product._id,
        productName: product.name,
        baseColor,
        size,
        frontElements,
        backElements,
        savedAt: new Date().toISOString(),
      };
      const existing = JSON.parse(localStorage.getItem('saved_threadcraft_designs') || '[]');
      existing.unshift(savedDesign);
      localStorage.setItem('saved_threadcraft_designs', JSON.stringify(existing.slice(0, 10)));

      setToastMessage('Design saved to browser storage!');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // Pricing estimate — per-side charge comes from admin settings (per product or global).
  // The server recomputes the authoritative price at add-to-cart/checkout time.
  const perSidePrice = product.customizationPrice ?? product._globalCustomizationPrice ?? 150;

  const priceBreakdown = useMemo(() => {
    const basePrice = Number(product.discountPrice ?? product.basePrice ?? 0);
    const frontCharge = frontElements.length > 0 ? perSidePrice : 0;
    const backCharge = backElements.length > 0 ? perSidePrice : 0;
    const extraCharge = frontCharge + backCharge;
    const unitPrice = basePrice + extraCharge;
    return { basePrice, extraCharge, unitPrice, totalAmount: unitPrice * quantity };
  }, [product, frontElements, backElements, quantity, perSidePrice]);

  const handleSubmitToCart = (goToCheckout = false) => {
    onAddToCart(
      {
        productId: product._id,
        product,
        name: `${product.name} (Customized)`,
        image: product.images?.[0] || product.availableColours?.[0]?.mockupFront || '',
        price: priceBreakdown.unitPrice,
        quantity: quantity,
        size: size,
        colour: { name: initialColorName(product, baseColor), hex: baseColor },
        customization: {
          isCustomized: true,
          baseColor,
          frontElements,
          backElements,
          extraCharge: priceBreakdown.extraCharge,
          customPrintCost: priceBreakdown.extraCharge,
        },
      },
      goToCheckout
    );
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return createPortal(
    <div
      className="customize-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="customize-modal-panel p-4 md:p-6 lg:p-8 max-w-6xl w-full max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="eyebrow text-ink-900">Design Studio</span>
            </div>
            <h2 className="mt-0.5 text-xl font-semibold text-ink-900 sm:text-2xl">{product.name}</h2>
          </div>

          <div className="flex items-center gap-3">
            {toastMessage && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 animate-fade-in">
                ✓ {toastMessage}
              </span>
            )}
            <div className="text-right hidden sm:block">
              <span className="text-xs text-ink-500 block">Total Price</span>
              <span className="text-lg font-semibold text-ink-900">
                {formatINR(priceBreakdown.totalAmount)}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="border border-line p-2 text-ink-500 transition hover:border-ink-900 hover:text-ink-900"
              aria-label="Close designer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Grid */}
        <div className="flex-1 grid gap-6 md:grid-cols-[1.1fr_0.9fr] overflow-hidden min-h-0">
          {/* LEFT: Canvas Studio */}
          <div className="flex flex-col justify-between border border-line bg-white p-3 sm:p-5 overflow-y-auto">
            {/* Colour swatches (from product variants) */}
            <div className="flex items-center justify-between mb-3 bg-canvas p-2.5 border border-line">
              <span className="text-xs font-medium text-ink-600">Garment Base Colour:</span>
              <div className="flex items-center gap-2">
                {(product.availableColours || [])
                  .filter((color) => color.active !== false)
                  .map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setBaseColor(color.hex)}
                      title={color.name}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        baseColor === color.hex
                          ? 'border-ink-900 ring-1 ring-ink-900'
                          : 'border-ink-900/20 hover:border-ink-900/50'
                      }`}
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}
              </div>
            </div>

            {/* Interactive Canvas */}
            <DesignStudioCanvas
              color={baseColor}
              view={view}
              elements={currentElements}
              selectedId={selectedId}
              onSelectElement={setSelectedId}
              onUpdateElement={handleUpdateElement}
              onDeleteElement={handleDeleteElement}
              showPrintBoundary={true}
            />
          </div>

          {/* RIGHT: Tools Panel */}
          <div className="flex flex-col h-full min-h-0">
            <DesignStudioToolbar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              view={view}
              onToggleView={setView}
              elements={currentElements}
              selectedId={selectedId}
              onAddImage={handleAddImage}
              onAddText={handleAddText}
              onUpdateElement={handleUpdateElement}
              onDeleteElement={handleDeleteElement}
              onMoveLayer={handleMoveLayer}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={historyIndex > 0}
              canRedo={historyIndex < history.length - 1}
              onClearAll={handleClearAll}
              onSaveDesign={handleSaveDesign}
              designs={product._designLibrary}
            />
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="pt-4 mt-4 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-ink-500">Size:</span>
              <div className="flex gap-1">
                {(product.availableSizes || ['S', 'M', 'L', 'XL']).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSize(sz)}
                    className={`w-8 h-8 text-xs font-semibold border transition ${
                      size === sz
                        ? 'border-ink-900 bg-ink-900 text-canvas'
                        : 'border-line text-ink-600 hover:border-ink-900'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-ink-500">Qty:</span>
              <div className="inline-flex items-center gap-2 border border-line bg-white px-2 py-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-1 text-ink-500 hover:text-ink-900"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-semibold text-ink-900 min-w-5 text-center">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                  className="p-1 text-ink-500 hover:text-ink-900"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleSubmitToCart(false)}
              className="btn-secondary flex-1 sm:flex-initial"
            >
              <ShoppingBag className="w-4 h-4" /> Add Customized Tee ({formatINR(priceBreakdown.totalAmount)})
            </button>
            <button
              type="button"
              onClick={() => handleSubmitToCart(true)}
              className="btn-primary flex-1 sm:flex-initial"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Resolve the colour object for a chosen hex from the product's active variants
const initialColorName = (product, hex) => {
  const match = (product.availableColours || []).find((c) => c.hex === hex);
  return match ? match.name : 'Custom';
};

/* ────────────────────────── MAIN PRODUCT DETAIL ────────────────────────── */
const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [globalCustomizationPrice, setGlobalCustomizationPrice] = useState(null);
  const [designLibrary, setDesignLibrary] = useState([]);

  const [selectedColour, setSelectedColour] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [showCustomizer, setShowCustomizer] = useState(() => location.pathname.endsWith('/customize'));
  const [added, setAdded] = useState(false);

  // Active colour variants only (admin can disable individual colours)
  const activeColours = useMemo(
    () => (product?.availableColours || []).filter((c) => c.active !== false),
    [product]
  );

  // Fetch the product from the API (id or slug)
  useEffect(() => {
    let alive = true;
    const fetchProduct = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await productService.getProductById(id);
        if (alive && res?.success && res.data) {
          setProduct(res.data);
        } else if (alive) {
          setNotFound(true);
        }
      } catch {
        if (alive) setNotFound(true);
      } finally {
        if (alive) setLoading(false);
      }
    };
    fetchProduct();
    return () => {
      alive = false;
    };
  }, [id]);

  // Global customization price (admin-controlled) for the studio estimate
  useEffect(() => {
    settingsService
      .getSettings()
      .then((res) => {
        if (res?.success && res.data) setGlobalCustomizationPrice(res.data.customizationPricePerSide);
      })
      .catch(() => {});
  }, []);

  // Design library from the API (admin-managed graphics for the customizer)
  useEffect(() => {
    designService
      .getDesigns()
      .then((res) => {
        if (res?.success) setDesignLibrary(res.data || []);
      })
      .catch(() => {
        // Graphics tab simply stays empty if the API is unavailable
      });
  }, []);

  // Sync selection defaults when product loads
  useEffect(() => {
    if (product) {
      setSelectedColour(activeColours[0] || null);
      setSelectedSize(product.availableSizes?.[1] || product.availableSizes?.[0] || 'M');
      setActiveImageIdx(0);
      setQuantity(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?._id]);

  // Keep selection valid if variants change (e.g. selected colour disabled)
  useEffect(() => {
    if (product && selectedColour && !activeColours.some((c) => c.hex === selectedColour.hex)) {
      setSelectedColour(activeColours[0] || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeColours]);

  // Sync customizer state if route is /products/:id/customize
  useEffect(() => {
    if (location.pathname.endsWith('/customize')) {
      setShowCustomizer(true);
    }
  }, [location.pathname]);

  // Colour-variant aware image list:
  // gallery = [selected colour variant images/mockup (if any), ...product images]
  const images = useMemo(() => {
    if (!product) return [];
    const list = [];
    if (selectedColour) {
      const variantImgs = [
        selectedColour.mockup,
        selectedColour.mockupFront,
        ...(selectedColour.images || []),
      ].filter(Boolean);
      list.push(...variantImgs);
    }
    (product.images || []).forEach((img) => list.push(img));
    // De-duplicate while keeping order
    return list.filter((img, idx) => list.indexOf(img) === idx);
  }, [product, selectedColour]);

  // Reset gallery to the colour mockup whenever the colour changes
  useEffect(() => {
    setActiveImageIdx(0);
  }, [selectedColour?.hex]);

  // Hover-zoom
  const zoomRef = useRef(null);
  const lensRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const container = zoomRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xPct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, (y / rect.height) * 100));
    container.style.setProperty('--zoom-x', `${xPct}%`);
    container.style.setProperty('--zoom-y', `${yPct}%`);

    if (lensRef.current) {
      lensRef.current.style.left = `${x}px`;
      lensRef.current.style.top = `${y}px`;
    }
  }, []);

  const effectivePrice = product ? (product.discountPrice ?? product.basePrice) : 0;

  // Stock for the selected variant (falls back to product-level stock for legacy data)
  const variantStock = useMemo(() => {
    if (!product) return 0;
    if (selectedColour?.stock != null) return selectedColour.stock;
    const variants = activeColours;
    if (variants.length > 0 && variants.some((c) => c.stock != null)) {
      return variants.reduce((sum, c) => sum + (c.stock != null ? Number(c.stock) : 0), 0);
    }
    return product.stock ?? 0;
  }, [product, selectedColour, activeColours]);

  const isOutOfStock = variantStock <= 0;

  const handleAddToCart = (goToCheckout = false) => {
    if (!product || isOutOfStock) return;
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
    addToCart(
      {
        productId: product._id || product.id,
        product,
        name: product.name,
        image: images[activeImageIdx] || images[0],
        price: effectivePrice,
        quantity,
        size: selectedSize,
        colour: selectedColour || { name: 'Default', hex: '#111827' },
      },
      goToCheckout
    );
  };

  const handleCustomizedAddToCart = (cartItem, goToCheckout) => {
    addToCart(cartItem, goToCheckout);
    setShowCustomizer(false);
  };

  // Attach fetched admin data for the modal (kept off the product document itself)
  const productWithStudioData = product
    ? { ...product, _globalCustomizationPrice: globalCustomizationPrice, _designLibrary: designLibrary }
    : null;

  // Tinting fallback for colours without a dedicated mockup image
  const hasVariantImage = !!(selectedColour?.mockup || selectedColour?.mockupFront || selectedColour?.images?.length);
  const showTintPreview = !hasVariantImage && !!product?.images?.length;
  const tintColor = selectedColour?.hex || '#111827';

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="aspect-[4/5] animate-pulse bg-canvasd" />
          <div className="space-y-4 py-4">
            <div className="h-4 w-24 animate-pulse bg-canvasd" />
            <div className="h-9 w-3/4 animate-pulse bg-canvasd" />
            <div className="h-6 w-32 animate-pulse bg-canvasd" />
            <div className="h-24 w-full animate-pulse bg-canvasd" />
          </div>
        </div>
      </section>
    );
  }

  if (notFound || !product) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <p className="eyebrow text-ink-500">404</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-ink-900">Product not found</h1>
        <p className="mt-3 text-sm text-ink-500">
          This item may have been removed or is no longer available.
        </p>
        <Link to="/shop" className="btn-primary mt-8">Back to shop</Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb + back */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-ink-500 transition hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        {/* ═══════════ LEFT: Image Gallery ═══════════ */}
        <div>
          <div
            className="gallery-zoom-container aspect-[4/5] w-full"
            ref={zoomRef}
            onMouseMove={handleMouseMove}
          >
            <img
              src={images[activeImageIdx] || images[0]}
              alt={`${product.name}${selectedColour ? ` — ${selectedColour.name}` : ''}`}
              className="gallery-main-img"
              draggable={false}
            />
            <div ref={lensRef} className="zoom-lens" />
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="gallery-thumbs">
              {images.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  className={`gallery-thumb ${idx === activeImageIdx ? 'active' : ''}`}
                  onClick={() => setActiveImageIdx(idx)}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img src={img} alt={`${product.name} thumbnail ${idx + 1}`} draggable={false} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ═══════════ RIGHT: Product Info ═══════════ */}
        <div className="flex flex-col">
          {product.shirtType && (
            <p className="eyebrow text-ink-500">
              {product.shirtType.charAt(0).toUpperCase() + product.shirtType.slice(1)} fit
              {product.category?.name ? ` · ${product.category.name}` : ''}
            </p>
          )}
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900 sm:text-4xl">{product.name}</h1>

          {/* Price row */}
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-semibold text-ink-900">{formatINR(effectivePrice)}</span>
            {product.discountPrice ? (
              <>
                <span className="text-base text-ink-400 line-through">{formatINR(product.basePrice)}</span>
                <span className="bg-clay-50 border border-clay-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wideplus text-clay-600">
                  {Math.round(((product.basePrice - product.discountPrice) / product.basePrice) * 100)}% off
                </span>
              </>
            ) : null}
          </div>

          {/* Stock (variant-aware) */}
          <p className="mt-3 text-xs font-medium">
            {isOutOfStock ? (
              <span className="text-ink-400">
                {activeColours.length > 0 ? 'Out of stock for this colour' : 'Out of stock'}
              </span>
            ) : variantStock <= 10 ? (
              <span className="text-clay-600">Only {variantStock} left in stock</span>
            ) : (
              <span className="text-emerald-700">In stock, ready to ship</span>
            )}
          </p>

          <p className="mt-5 text-base leading-7 text-ink-700">{product.description}</p>

          {/* ── Colour Selector (active variants from DB) ── */}
          {activeColours.length > 0 && (
            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="font-medium text-ink-900">Colour</span>
                <span className="text-ink-500">{selectedColour?.name || '—'}</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {activeColours.map((color) => (
                  <button
                    key={color.name + color.hex}
                    type="button"
                    aria-label={`Select ${color.name}`}
                    aria-pressed={selectedColour?.hex === color.hex}
                    onClick={() => setSelectedColour(color)}
                    title={color.name}
                    className={`color-swatch ${selectedColour?.hex === color.hex ? 'active' : ''}`}
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
              {showTintPreview && !isOutOfStock && (
                <p className="mt-2 text-[11px] text-ink-400">
                  Previewing {selectedColour?.name?.toLowerCase()} — the studio below renders this colour exactly.
                </p>
              )}
            </div>
          )}

          {/* ── Size Selector ── */}
          {product.availableSizes?.length > 0 && (
            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="font-medium text-ink-900">Size</span>
                <span className="text-ink-500">{selectedSize}</span>
              </div>
              <div className="flex max-w-md flex-wrap gap-2">
                {product.availableSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    aria-pressed={selectedSize === size}
                    className={`min-w-[3rem] border px-4 py-2.5 text-sm font-medium transition ${
                      selectedSize === size
                        ? 'border-ink-900 bg-ink-900 text-canvas'
                        : 'border-line text-ink-700 hover:border-ink-900'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Quantity ── */}
          <div className="mt-8">
            <span className="mb-3 block text-sm font-medium text-ink-900">Quantity</span>
            <div className="inline-flex items-center border border-line bg-white">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-2.5 text-ink-600 transition hover:text-ink-900"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-8 text-center text-sm font-semibold text-ink-900">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(20, Math.max(1, variantStock), q + 1))}
                className="p-2.5 text-ink-600 transition hover:text-ink-900"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ── Purchase actions ── */}
          <div className="mt-8 grid max-w-lg grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleAddToCart(false)}
              disabled={isOutOfStock}
              className="btn-secondary justify-center"
            >
              {added ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
              {added ? 'Added' : 'Add to cart'}
            </button>
            <button
              type="button"
              onClick={() => handleAddToCart(true)}
              disabled={isOutOfStock}
              className="btn-primary justify-center"
            >
              Buy now
            </button>
          </div>

          {/* ── Customize This Tee (only when enabled for this product) ── */}
          {product.customizationEnabled && (
            <button
              type="button"
              onClick={() => setShowCustomizer(true)}
              className="group mt-4 inline-flex items-center gap-2.5 self-start border border-ink-900 px-5 py-3 text-sm font-semibold text-ink-900 transition hover:bg-ink-900 hover:text-canvas"
            >
              <Sparkles className="h-4 w-4" />
              <span>
                Customize this tee
                {perSideLabel(product, globalCustomizationPrice) &&
                  ` · ${formatINR(perSideLabel(product, globalCustomizationPrice))}/side`}
              </span>
            </button>
          )}

          {/* Meta */}
          <dl className="mt-10 space-y-3 border-t border-line pt-6 text-sm">
            {product.fabric && (
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 text-ink-400">Fabric</dt>
                <dd className="text-ink-700">{product.fabric}</dd>
              </div>
            )}
            {product.fit && (
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 text-ink-400">Fit</dt>
                <dd className="text-ink-700">{product.fit}</dd>
              </div>
            )}
            <div className="flex gap-3">
              <dt className="w-24 shrink-0 text-ink-400">Care</dt>
              <dd className="text-ink-700">Machine wash cold, inside out. Do not iron directly on print.</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Tint preview panel for colours without mockup images */}
      {showTintPreview && (
        <div className="mt-12 border border-line bg-white p-5 sm:p-8">
          <p className="eyebrow text-ink-900">Colour preview — {selectedColour?.name}</p>
          <div className="mt-5 grid gap-8 sm:grid-cols-[300px_1fr] sm:items-center">
            <div className="mx-auto w-64 max-w-full" style={{ color: tintColor }}>
              <TShirtMockupSVG color={tintColor} shirtType={product.shirtType || 'round_neck'} view="front" />
            </div>
            <div>
              <p className="text-sm leading-6 text-ink-600">
                The exact studio mockup for this colourway is rendered live — the printed design you add
                in the studio will sit precisely where shown.
              </p>
              <button
                type="button"
                onClick={() => product.customizationEnabled && setShowCustomizer(true)}
                className="btn-quiet mt-4"
              >
                Open in design studio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ Customization Modal ═══════════ */}
      {showCustomizer && productWithStudioData && (
        <CustomizationModal
          product={productWithStudioData}
          initialColor={selectedColour?.hex}
          initialSize={selectedSize}
          onClose={() => setShowCustomizer(false)}
          onAddToCart={handleCustomizedAddToCart}
        />
      )}
    </section>
  );
};

// Per-side price shown next to the customize button (product-level override or global setting)
const perSideLabel = (product, globalPrice) => {
  if (product.customizationPrice != null) return product.customizationPrice;
  if (globalPrice != null) return globalPrice;
  return null;
};

export default ProductDetail;
