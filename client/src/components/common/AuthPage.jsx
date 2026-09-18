import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AuthPage = ({ mode = 'login' }) => {
  const navigate = useNavigate();
  const { login, register, isAuthenticated } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const isLogin = mode === 'login';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password, form.phone);
      }
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="max-w-xl mx-auto py-12">
      <div className="rounded-sm border border-white/10 bg-slate-900/70 p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <span className="text-xs uppercase tracking-[0.3em] text-ink-500">ThreadCraft Studio</span>
          <h1 className="mt-3 text-3xl font-black text-ink-900">
            {isLogin ? 'Welcome back' : 'Create account'}
          </h1>
        </div>

        {error && (
          <div className="mb-4 rounded-sm border border-rose-400/50 bg-rose-950/50 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <label className="block">
              <span className="mb-2 block text-sm text-ink-700">Full name</span>
              <input
                className="w-full rounded-sm border border-line bg-slate-950 px-4 py-3 text-ink-900 outline-none focus:border-ink-900"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>
          )}

          <label className="block">
            <span className="mb-2 block text-sm text-ink-700">Email address</span>
            <input
              type="email"
              className="w-full rounded-sm border border-line bg-slate-950 px-4 py-3 text-ink-900 outline-none focus:border-ink-900"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>

          {!isLogin && (
            <label className="block">
              <span className="mb-2 block text-sm text-ink-700">Phone</span>
              <input
                className="w-full rounded-sm border border-line bg-slate-950 px-4 py-3 text-ink-900 outline-none focus:border-ink-900"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>
          )}

          <label className="block">
            <span className="mb-2 block text-sm text-ink-700">Password</span>
            <input
              type="password"
              className="w-full rounded-sm border border-line bg-slate-950 px-4 py-3 text-ink-900 outline-none focus:border-ink-900"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-sm bg-ink-900 px-6 py-3 font-bold text-slate-950 transition hover:bg-brand-600 disabled:opacity-70"
          >
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create account'}
          </button>
        </form>
      </div>
    </section>
  );
};

export default AuthPage;
