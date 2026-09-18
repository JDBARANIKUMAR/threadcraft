import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ShoppingBag, ArrowLeft, Minus, Plus } from 'lucide-react';
import DesignStudioCanvas from './DesignStudioCanvas';
import DesignStudioToolbar from './DesignStudioToolbar';
import { useCart } from '../../context/CartContext';
import { productService } from '../../services/productService';
import { designService } from '../../services/designService';
import { settingsService } from '../../services/settingsService';
import { formatINR } from '../../utils/formatPrice';

// shirtType options map to the Product schema enum — used to filter customizable products
const FIT_LABELS = {
  collar: 'Collar',
  casual: 'Casual',
  oversized: 'Oversized',
};

const CustomTShirtPage = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // ── DB-driven data ──
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [designs, setDesigns] = useState([]);
  const [perSidePrice, setPerSidePrice] = useState(150); // overwritten by /api/settings

  // Selected product drives style, colour, size and price — no hardcoded catalogue
  const [selectedProductId, setSelectedProductId] = useState('');
  const [baseColor, setBaseColor] = useState('');
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [view, setView] = useState('front');
  const [activeTab, setActiveTab] = useState('upload');
  const [toastMessage, setToastMessage] = useState('');

  // Design elements
  const [frontElements, setFrontElements] = useState([]);
  const [backElements, setBackElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  // History stack
  const [history, setHistory] = useState([{ frontElements: [], backElements: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    let alive = true;
    // Customizable, active products only — the studio customizes real catalogue items
    productService
      .getProducts({ customizableOnly: 'true', limit: 60 })
      .then((res) => {
        if (!alive) return;
        if (res?.success) {
          const list = res.data || [];
          setProducts(list);
          if (list.length > 0) {
            setSelectedProductId((current) => current || list[0]._id);
          }
        } else {
          setProductsError('Could not load products.');
        }
      })
      .catch(() => alive && setProductsError('Could not load products. Is the server running?'))
      .finally(() => alive && setProductsLoading(false));

    designService
      .getDesigns()
      .then((res) => alive && res?.success && setDesigns(res.data || []))
      .catch(() => {});

    settingsService
      .getSettings()
      .then((res) => {
        if (alive && res?.success && res.data?.customizationPricePerSide != null) {
          setPerSidePrice(res.data.customizationPricePerSide);
        }
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, []);

  const product = useMemo(
    () => products.find((p) => p._id === selectedProductId) || null,
    [products, selectedProductId]
  );

  const activeColours = useMemo(
    () => (product?.availableColours || []).filter((c) => c.active !== false),
    [product]
  );

  // Reset design-dependent selections when the product changes
  useEffect(() => {
    setFrontElements([]);
    setBackElements([]);
    setHistory([{ frontElements: [], backElements: [] }]);
    setHistoryIndex(0);
    setSelectedId(null);
    if (product) {
      setBaseColor(activeColours[0]?.hex || '#111827');
      setSize(product.availableSizes?.[1] || product.availableSizes?.[0] || 'M');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?._id]);

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
        productId: product?._id || null,
        productName: product?.name || 'Custom Tee',
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

  const basePrice = product ? Number(product.discountPrice ?? product.basePrice ?? 0) : 0;

  const priceBreakdown = useMemo(() => {
    const frontCharge = frontElements.length > 0 ? perSidePrice : 0;
    const backCharge = backElements.length > 0 ? perSidePrice : 0;
    const extraCharge = frontCharge + backCharge;
    const unitPrice = basePrice + extraCharge;
    return {
      basePrice,
      extraCharge,
      unitPrice,
      totalAmount: unitPrice * quantity,
    };
  }, [basePrice, frontElements, backElements, quantity, perSidePrice]);

  const selectedColourObj =
    activeColours.find((c) => c.hex === baseColor) || activeColours[0] || { name: 'Custom', hex: baseColor || '#111827' };

  const variantStock = useMemo(() => {
    if (!product) return 0;
    if (selectedColourObj?.stock != null) return Number(selectedColourObj.stock);
    if (activeColours.length > 0 && activeColours.some((c) => c.stock != null)) {
      return activeColours.reduce((sum, c) => sum + (c.stock != null ? Number(c.stock) : 0), 0);
    }
    return product.stock ?? 0;
  }, [product, selectedColourObj, activeColours]);

  const isOutOfStock = !product || variantStock <= 0;

  // Always references a REAL product — the server validates the variant,
  // size, stock and recomputes the customization cost itself.
  const handleAddToCart = (goToCheckout = false) => {
    if (!product || isOutOfStock) return;
    addToCart(
      {
        productId: product._id,
        product,
        name: `${product.name} (Customized)`,
        price: priceBreakdown.unitPrice,
        quantity: quantity,
        size: size,
        colour: { name: selectedColourObj.name, hex: selectedColourObj.hex },
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

  // ── Loading / empty / error states ──
  if (productsLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <p className="text-sm text-ink-500">Loading design studio…</p>
      </div>
    );
  }

  if (productsError && products.length === 0) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-xl font-semibold text-ink-900">Studio unavailable</p>
        <p className="mt-2 max-w-sm text-sm text-ink-500">{productsError}</p>
        <button type="button" onClick={() => window.location.reload()} className="btn-primary mt-6">
          Retry
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-xl font-semibold text-ink-900">No customizable products yet</p>
        <p className="mt-2 max-w-sm text-sm text-ink-500">
          The studio needs at least one product with customization enabled. Check back soon!
        </p>
        <button type="button" onClick={() => navigate('/shop')} className="btn-primary mt-6">
          Browse the shop
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-950 text-ink-900 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink-500 hover:text-ink-900 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Shop
          </button>

          <div className="flex items-center gap-3">
            {toastMessage && (
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-sm animate-fade-in">
                ✓ {toastMessage}
              </span>
            )}
            <span className="text-lg font-bold text-ink-900">
              Total: {formatINR(priceBreakdown.totalAmount)}
            </span>
          </div>
        </div>

        {/* Studio Grid */}
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left Canvas Panel */}
          <div className="space-y-4 rounded-3xl border border-line bg-canvasd p-4 sm:p-6 shadow-2xl">
            {/* Product, colour pickers — all from the selected DB product */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-line">
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full rounded-sm border border-line bg-white px-3 py-2 text-xs text-ink-900 outline-none focus:border-ink-900"
                >
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({formatINR(p.discountPrice ?? p.basePrice)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">Garment Color</label>
                <div className="flex items-center gap-2 pt-1">
                  {activeColours.map((swatch) => (
                    <button
                      key={swatch.name + swatch.hex}
                      type="button"
                      onClick={() => setBaseColor(swatch.hex)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        baseColor === swatch.hex
                          ? 'scale-110 border-white ring-2 ring-ink-900'
                          : 'border-line '
                      }`}
                      style={{ backgroundColor: swatch.hex }}
                      title={swatch.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Main Interactive Canvas */}
            <DesignStudioCanvas
              color={baseColor}
              shirtType={product?.shirtType === 'collar' ? 'polo' : 'round_neck'}
              view={view}
              elements={currentElements}
              selectedId={selectedId}
              onSelectElement={setSelectedId}
              onUpdateElement={handleUpdateElement}
              onDeleteElement={handleDeleteElement}
              showPrintBoundary={true}
            />
          </div>

          {/* Right Toolbar Panel */}
          <div className="h-full min-h-[500px]">
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
              designs={designs}
            />
          </div>
        </div>

        {/* Bottom Ordering Bar */}
        <div className="rounded-sm border border-line bg-white p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-xs text-ink-500 block">Selected Size</span>
              <div className="flex gap-1 mt-1">
                {(product?.availableSizes || ['S', 'M', 'L', 'XL', 'XXL']).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSize(sz)}
                    className={`w-8 h-8 rounded-sm text-xs font-bold border transition ${
                      size === sz
                        ? 'border-ink-900 bg-canvasd text-ink-900'
                        : 'border-line text-ink-500 hover:border-ink-400'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs text-ink-500 block">Quantity</span>
              <div className="inline-flex items-center gap-2 rounded-sm border border-line bg-white px-2 py-1 mt-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-1 text-ink-500 hover:text-ink-900"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold text-ink-900 min-w-5 text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(20, Math.max(1, variantStock), q + 1))}
                  className="p-1 text-ink-500 hover:text-ink-900"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="hidden sm:block">
              <span className="text-xs text-ink-500 block">Print charges</span>
              <p className="text-xs font-semibold text-ink-900 mt-1">
                {formatINR(perSidePrice)} per side
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleAddToCart(false)}
              disabled={isOutOfStock}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-sm border border-ink-900 bg-canvasd px-5 py-3 text-sm font-bold text-ink-900 transition hover:bg-ink-900/25 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ShoppingBag className="w-4 h-4" /> {isOutOfStock ? 'Out of stock' : 'Add Custom Tee to Cart'}
            </button>
            <button
              type="button"
              onClick={() => handleAddToCart(true)}
              disabled={isOutOfStock}
              className="flex-1 sm:flex-initial rounded-sm bg-ink-900 px-6 py-3 text-sm font-bold text-canvas transition hover:bg-ink-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomTShirtPage;
