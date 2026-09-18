import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Instagram, Twitter, Facebook, Home, Menu, ShoppingBag, User } from 'lucide-react';

const Footer = () => {
  const location = useLocation();

  return (
    <>
      <footer className="bg-canvas border-t border-line text-ink-900 pt-14 pb-24 md:pb-10 relative z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 border-b border-line pb-10">
            {/* 1. Shipping Info (Policies) */}
            <div>
              <h5 className="eyebrow mb-4 text-ink-900">Shipping Info</h5>
              <ul className="space-y-3 text-sm text-ink-500">
                <li><Link to="/shipping-policy" className="hover:text-ink-900 transition-colors">Shipping Policy</Link></li>
                <li><Link to="/returns-policy" className="hover:text-ink-900 transition-colors">Returns &amp; Exchanges</Link></li>
                <li><Link to="/terms-conditions" className="hover:text-ink-900 transition-colors">Terms &amp; Conditions</Link></li>
                <li><Link to="/privacy-policy" className="hover:text-ink-900 transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>

            {/* 2. The Company */}
            <div>
              <h5 className="eyebrow mb-4 text-ink-900">The Company</h5>
              <ul className="space-y-3 text-sm text-ink-500">
                <li><Link to="/about" className="hover:text-ink-900 transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-ink-900 transition-colors">Contact Us</Link></li>
                <li><Link to="/store-locator" className="hover:text-ink-900 transition-colors">Store Locator</Link></li>
                <li><Link to="/admin" className="hover:text-ink-900 transition-colors flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Admin Portal</Link></li>
              </ul>
            </div>

            {/* 3. My Account */}
            <div>
              <h5 className="eyebrow mb-4 text-ink-900">My Account</h5>
              <ul className="space-y-3 text-sm text-ink-500">
                <li><Link to="/profile" className="hover:text-ink-900 transition-colors">Account Dashboard</Link></li>
                <li><Link to="/orders" className="hover:text-ink-900 transition-colors">Track Your Order</Link></li>
                <li><Link to="/returns" className="hover:text-ink-900 transition-colors">Exchange / Return</Link></li>
                <li><Link to="/support" className="hover:text-ink-900 transition-colors">FAQ &amp; Support</Link></li>
              </ul>
            </div>

            {/* 4. Newsletter */}
            <div>
              <h5 className="eyebrow mb-4 text-ink-900">Stay in the Loop</h5>
              <p className="text-sm text-ink-500 mb-4">Sign up for drop alerts and first access to limited runs.</p>
              <form className="flex mb-6" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Email address"
                  className="input flex-1 min-w-0 rounded-none"
                />
                <button type="button" className="bg-ink-900 text-canvas px-4 text-sm font-semibold hover:bg-ink-800 transition-colors">
                  Subscribe
                </button>
              </form>

              <div className="flex items-center gap-3">
                <a href="#" aria-label="Instagram" className="w-8 h-8 border border-line flex items-center justify-center text-ink-600 hover:border-ink-900 hover:text-ink-900 transition-colors"><Instagram className="w-4 h-4" /></a>
                <a href="#" aria-label="Twitter" className="w-8 h-8 border border-line flex items-center justify-center text-ink-600 hover:border-ink-900 hover:text-ink-900 transition-colors"><Twitter className="w-4 h-4" /></a>
                <a href="#" aria-label="Facebook" className="w-8 h-8 border border-line flex items-center justify-center text-ink-600 hover:border-ink-900 hover:text-ink-900 transition-colors"><Facebook className="w-4 h-4" /></a>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col items-center md:items-start gap-1">
              <Link to="/" className="inline-flex items-center">
                <span className="font-display text-lg font-bold tracking-[0.08em]">THREADCRAFT</span>
              </Link>
              <p className="text-[10px] font-medium text-ink-400 uppercase tracking-wideplus">
                © {new Date().getFullYear()} — Independent streetwear, printed to order
              </p>
            </div>

            <p className="text-[11px] text-ink-400">Payments secured by Razorpay · UPI, cards &amp; netbanking</p>
          </div>
        </div>
      </footer>

      {/* Sticky Bottom Nav (Mobile Only) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-canvas border-t border-line px-4 flex justify-between items-center z-40 h-16">
        <Link to="/" className={`flex flex-col items-center gap-1 flex-1 ${location.pathname === '/' ? 'text-ink-900' : 'text-ink-400'}`}>
          <Home className="w-5 h-5" />
          <span className="text-[9px] font-semibold uppercase tracking-wideplus">Home</span>
        </Link>
        <Link to="/shop" className={`flex flex-col items-center gap-1 flex-1 ${location.pathname === '/shop' ? 'text-ink-900' : 'text-ink-400'}`}>
          <Menu className="w-5 h-5" />
          <span className="text-[9px] font-semibold uppercase tracking-wideplus">Shop</span>
        </Link>
        <Link to="/customize" className={`flex flex-col items-center gap-1 flex-1 ${location.pathname === '/customize' ? 'text-ink-900' : 'text-ink-400'}`}>
          <span className="text-lg leading-none">✎</span>
          <span className="text-[9px] font-semibold uppercase tracking-wideplus">Studio</span>
        </Link>
        <Link to="/cart" className={`flex flex-col items-center gap-1 flex-1 ${location.pathname === '/cart' ? 'text-ink-900' : 'text-ink-400'}`}>
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[9px] font-semibold uppercase tracking-wideplus">Cart</span>
        </Link>
        <Link to="/profile" className={`flex flex-col items-center gap-1 flex-1 ${location.pathname === '/profile' ? 'text-ink-900' : 'text-ink-400'}`}>
          <User className="w-5 h-5" />
          <span className="text-[9px] font-semibold uppercase tracking-wideplus">Account</span>
        </Link>
      </div>
    </>
  );
};

export default Footer;
