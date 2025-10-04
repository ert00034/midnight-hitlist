'use client';

import { useState } from 'react';

export function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const login = async () => {
    setError('');
    const r = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (r.ok) {
      window.location.reload();
    } else {
      setError('Invalid password');
    }
  };

  return (
    <div className="max-w-md rounded-lg bg-slate-900/40 p-6 ring-1 ring-white/10">
      <label className="block text-sm text-slate-300">Admin Password</label>
      <input
        type="password"
        className="mt-2 w-full rounded bg-slate-800 px-3 py-2 text-slate-100 ring-1 ring-white/10 focus:outline-none focus:ring-sky-400"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <div className="mt-2 text-sm text-red-400">{error}</div>}
      <button onClick={login} className="mt-4 w-full rounded bg-sky-500 px-4 py-2 font-medium text-white hover:bg-sky-400">Log in</button>
    </div>
  );
}


