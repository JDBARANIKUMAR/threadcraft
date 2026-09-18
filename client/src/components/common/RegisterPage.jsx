import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await register(name, email, password, phone);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-md border border-line bg-white p-6 sm:p-8">
        <p className="eyebrow text-ink-500">ThreadCraft</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink-900">Create account</h2>
        <p className="mt-2 text-sm text-ink-500">Save designs, track orders, check out faster.</p>

        {error && <p className="mt-4 border border-clay-100 bg-clay-50 px-3 py-2 text-sm text-clay-700">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="field-label">Name</label>
            <input type="text" required className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Email</label>
            <input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Password</label>
            <input type="password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Phone (optional)</label>
            <input type="text" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary w-full justify-center">
            Create account
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-ink-400">
          Already have an account?{' '}
          <button type="button" onClick={() => navigate('/login')} className="font-semibold text-ink-900 underline underline-offset-2">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
