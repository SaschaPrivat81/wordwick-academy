import { useState } from 'react';
import { useAuth } from '../App';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { login, register } = useAuth();

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'login') await login(name, pin);
      else await register(name, pin);
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-emerald-800 rounded-2xl mx-auto mb-4 flex items-center justify-center text-amber-100 text-3xl font-bold shadow-lg">WA</div>
          <h1 className="text-2xl font-extrabold text-slate-800">Wordwick Academy</h1>
          <p className="text-slate-400 text-sm mt-1">Lerne Englisch in der Zauberschule.</p>
        </div>

        <form onSubmit={handle} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-600">Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-lg"
              placeholder="Dein Name"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-600">PIN (4 Zahlen)</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-lg tracking-widest"
              placeholder="••••"
            />
          </div>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <button type="submit" className="w-full py-3 bg-indigo-500 text-white font-bold rounded-xl shadow-md hover:bg-indigo-400 active:scale-95 transition">
            {mode === 'login' ? 'Anmelden' : 'Registrieren'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-sm text-indigo-500 font-semibold">
            {mode === 'login' ? 'Neuer Account?' : 'Bereits dabei?'}
          </button>
        </div>
      </div>
    </div>
  );
}
