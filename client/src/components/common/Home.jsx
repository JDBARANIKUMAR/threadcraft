import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { productService } from '../../services/productService';
import { bannerService } from '../../services/bannerService';
import { categoryService } from '../../services/categoryService';
import { formatINR } from '../../utils/formatPrice';

// ── Hero carousel — driven entirely by the Banner collection (admin-managed) ──
const HeroCarousel = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    let alive = true;
    bannerService
      .getActiveBanners()
      .then((res) => {
        if (alive && res?.success) setSlides(res.data || []);
      })
      .catch(() => {
        // No banners / API down → clean fallback below, never a crash
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const hasSlides = slides.length > 0;

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);

  useEffect(() => {
    if (!isPaused && hasSlides && slides.length > 1) {
      timerRef.current = setInterval(nextSlide, 5000);
    }
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused, hasSlides, slides.length]);

  if (loading) {
    return <div className="w-full h-[62vh] min-h-[420px] md:h-[72vh] animate-pulse bg-canvasd" />;
  }

  // Clean fallback when the admin has not published any banners
  if (!hasSlides) {
    return (
      <div className="w-full h-[46vh] min-h-[320px] md:h-[52vh] flex flex-col items-center justify-center bg-ink-900 text-canvas px-6 text-center">
        <p className="eyebrow text-white/70">ThreadCraft Studio</p>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1]">
          Wear your identity.
        </h1>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/shop" className="inline-flex items-center gap-2 bg-canvas text-ink-900 px-6 py-3 text-sm font-semibold hover:bg-white transition-colors">
            Shop now <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/customize" className="inline-flex items-center gap-2 border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
            Design your tee
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-[62vh] min-h-[420px] md:h-[72vh] overflow-hidden group bg-ink-900"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div
        className="flex transition-transform duration-700 ease-out h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((slide) => (
          <div key={slide._id} className="min-w-full h-full relative">
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            {/* Grounded legibility scrim — flat, not a glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/75 via-ink-950/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 lg:p-14">
              <div className="max-w-7xl mx-auto">
                <Link to={slide.buttonLink || '/shop'} className="block max-w-2xl">
                  {slide.badgeText && (
                    <p className="text-[11px] font-semibold uppercase tracking-wideplus text-white/80">
                      {slide.badgeText}
                    </p>
                  )}
                  <h1 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-white leading-[1.1]">
                    {slide.title}
                  </h1>
                  {slide.subtitle && (
                    <p className="mt-3 text-sm sm:text-base text-white/85 leading-relaxed max-w-lg">
                      {slide.subtitle}
                    </p>
                  )}
                  <span className="mt-6 inline-flex items-center gap-2 bg-canvas text-ink-900 px-6 py-3 text-sm font-semibold hover:bg-white transition-colors">
                    {slide.buttonText || 'Shop now'} <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-canvas/95 hover:bg-white text-ink-900 hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
            aria-label="Previous slide"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-canvas/95 hover:bg-white text-ink-900 hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
            aria-label="Next slide"
          >
            ›
          </button>

          <div className="absolute bottom-5 right-6 sm:right-10 flex items-center gap-2 z-10">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Go to slide ${idx + 1}`}
                onClick={() => setCurrentIndex(idx)}
                className={`h-[3px] rounded-full transition-all ${
                  idx === currentIndex ? 'bg-white w-8' : 'bg-white/50 w-4'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ── Categories — fetched live from the Category collection (admin-managed) ──
const FeaturedCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    categoryService
      .getCategories()
      .then((res) => {
        if (alive && res?.success) setCategories(res.data || []);
      })
      .catch(() => {
        // Section simply hides when categories cannot load
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="py-14 sm:py-16 bg-canvas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rule-heading mb-8">
            <h2 className="eyebrow text-ink-900">Shop by Fit</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="aspect-[4/3] animate-pulse bg-canvasd" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null; // admin hasn't created categories yet

  return (
    <section className="py-14 sm:py-16 bg-canvas">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rule-heading mb-8">
          <h2 className="eyebrow text-ink-900">Shop by Fit</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {categories.map((cat) => (
            <Link key={cat._id} to={`/shop?category=${cat.slug || cat._id}`} className="group block">
              <div className="aspect-[4/3] overflow-hidden bg-canvasd">
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-canvasd">
                    <span className="font-display text-4xl text-ink-300">{cat.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div className="pt-3 pb-1">
                <h3 className="font-display text-lg font-semibold text-ink-900">{cat.name}</h3>
                {cat.description && <p className="mt-0.5 text-sm text-ink-500 line-clamp-1">{cat.description}</p>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

const TShirtProductScroll = () => {
  const scrollerRef = useRef(null);
  const [shopProducts, setShopProducts] = useState([]);

  useEffect(() => {
    let alive = true;
    productService
      .getProducts({ limit: 10 })
      .then((res) => {
        if (alive && res?.success) setShopProducts(res.data || []);
      })
      .catch(() => {
        // Homepage rail degrades gracefully; shop page shows the full error state
      });
    return () => {
      alive = false;
    };
  }, []);

  const scrollByCard = (direction) => {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollBy({ left: direction * 300, behavior: 'smooth' });
  };

  if (shopProducts.length === 0) return null;

  return (
    <section className="pb-20 sm:pb-24 bg-canvas">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rule-heading mb-8">
          <h2 className="eyebrow text-ink-900">The Collection</h2>
          <Link to="/shop" className="text-xs font-semibold text-ink-500 hover:text-ink-900 transition-colors whitespace-nowrap">
            View all →
          </Link>
        </div>

        <div
          ref={scrollerRef}
          className="hide-scrollbar flex gap-5 overflow-x-auto pb-2 snap-x"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {shopProducts.map((product) => (
            <Link
              key={product._id}
              to={`/products/${product._id}`}
              className="group w-[220px] sm:w-[250px] shrink-0 snap-start"
            >
              <div className="aspect-[4/5] overflow-hidden bg-canvasd">
                <img
                  src={
                    product.availableColours?.[0]?.mockup ||
                    product.availableColours?.[0]?.mockupFront ||
                    product.availableColours?.[0]?.thumbnail ||
                    product.images?.[0]
                  }
                  alt={product.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="pt-3 flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-medium text-ink-900">{product.name}</h3>
                  <div className="mt-1 flex gap-1.5">
                    {product.availableColours?.slice(0, 4).map((color, idx) => (
                      <span
                        key={idx}
                        className="w-3 h-3 rounded-full border border-ink-900/20"
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm font-semibold text-ink-900 whitespace-nowrap">
                  {formatINR(product.discountPrice || product.basePrice)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

const Home = () => (
  <div className="w-full bg-canvas min-h-screen">
    <HeroCarousel />
    <FeaturedCategories />
    <TShirtProductScroll />
  </div>
);

export default Home;
