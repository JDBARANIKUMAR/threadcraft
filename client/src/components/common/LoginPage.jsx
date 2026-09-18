import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const CustomerAuthForm = ({ mode, onModeChange, onSubmit, error, loading }) => {
  const [fields, setFields] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  const updateField = (event) => setFields((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submitForm = (event) => {
    event.preventDefault();
    onSubmit(fields);
  };

  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-2 border border-line bg-canvas p-1">
        {['login', 'signup'].map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onModeChange(option)}
            className={`py-2.5 text-sm font-semibold transition ${
              mode === option ? 'bg-ink-900 text-canvas' : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            {option === 'login' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>
      <form onSubmit={submitForm} className="mt-5 grid gap-4">
        {mode === 'signup' && (
          <label>
            <span className="field-label">Name</span>
            <input name="name" value={fields.name} onChange={updateField} required className="input" />
          </label>
        )}
        <label>
          <span className="field-label">Email</span>
          <input name="email" type="email" value={fields.email} onChange={updateField} required className="input" />
        </label>
        <label>
          <span className="field-label">Password</span>
          <input name="password" type="password" value={fields.password} onChange={updateField} required className="input" />
        </label>
        {mode === 'signup' && (
          <label>
            <span className="field-label">Confirm password</span>
            <input name="confirmPassword" type="password" value={fields.confirmPassword} onChange={updateField} required className="input" />
          </label>
        )}
        {error && <p className="border border-clay-100 bg-clay-50 px-3 py-2 text-sm text-clay-700">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary mt-1">
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>
    </div>
  );
};

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [customerMode, setCustomerMode] = useState('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCustomerSubmit = async (fields) => {
    setError('');
    if (customerMode === 'signup' && fields.password !== fields.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      if (customerMode === 'signup') {
        await register(fields.name, fields.email, fields.password, '');
      } else {
        await login(fields.email, fields.password);
      }
      localStorage.setItem('tc_login_role', 'customer');
      navigate('/');
    } catch (loginError) {
      setError(loginError.message || 'Authentication failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex min-h-[80vh] items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-md border border-line bg-white p-6 sm:p-8">
        <p className="eyebrow text-ink-500">ThreadCraft</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900">
          {customerMode === 'login' ? 'Welcome back' : 'Join the studio'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-500">
          Sign in to save your designs, track orders, and check out faster.
        </p>

        <CustomerAuthForm
          mode={customerMode}
          onModeChange={(mode) => { setCustomerMode(mode); setError(''); }}
          onSubmit={handleCustomerSubmit}
          error={error}
          loading={loading}
        />

        <p className="mt-6 text-center text-xs leading-5 text-ink-400">
          Seeded customer account: customer@example.com / Customer@123
        </p>
      </div>
    </section>
  );
};

export default LoginPage;
