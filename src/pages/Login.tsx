import { useState } from 'react';
import { BookOpen, KeyRound, Sparkles, UserRound } from 'lucide-react';
import { useAuth } from '../App';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { login, register } = useAuth();

  const handle = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      if (mode === 'login') await login(name, pin);
      else await register(name, pin);
    } catch {
      setError(mode === 'login' ? 'Name oder PIN stimmt nicht.' : 'Registrierung nicht möglich.');
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 text-amber-50">
      <img
        src="/assets/wordwick-login-v1.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/45 via-slate-950/18 to-slate-950/8" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center">
        <div className="grid w-full items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-100/25 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-amber-100 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Aufnahmeprüfung beginnt
            </div>
            <h1 className="text-5xl font-black leading-none tracking-normal text-amber-50 drop-shadow-2xl sm:text-6xl">
              Wordwick Academy
            </h1>
            <p className="mt-5 max-w-lg text-lg font-semibold leading-8 text-amber-100 drop-shadow">
              Eine magische Lernschule für englische Wörter, wilde Verben und kleine Siege nach jeder bestandenen Quest.
            </p>
            <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
              {[
                ['Wortzauber', 'Vokabeln'],
                ['Verbenturm', 'Past forms'],
                ['Belohnungen', 'Elternplan'],
              ].map(([title, label]) => (
                <div key={title} className="rounded-2xl border border-amber-100/20 bg-white/10 p-4 backdrop-blur">
                  <div className="text-sm font-black text-amber-50">{title}</div>
                  <div className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-amber-200/70">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handle} className="parchment w-full rounded-[28px] border border-amber-100/70 p-6 text-stone-900 sm:p-8">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-blue-950/90 shadow-lg">
                <img
                  src="/assets/pip-paper-dragon-v1.png"
                  alt="Pip"
                  className="h-24 w-24 object-contain drop-shadow-xl"
                />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-950">{mode === 'login' ? 'Zurück in die Halle' : 'Neue Schülerkarte'}</h2>
                <p className="text-sm font-semibold text-stone-500">Pip wartet auf deinen vierstelligen Zaubercode.</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-black text-slate-950">
                  <UserRound className="h-4 w-4" />
                  Name
                </span>
                <input
                  value={name}
                  onChange={event => setName(event.target.value)}
                  className="w-full rounded-xl border border-amber-900/15 bg-white/70 px-4 py-3 text-lg font-bold outline-none ring-blue-800/25 transition focus:ring-4"
                  placeholder="Dein Name"
                  autoComplete="username"
                />
              </label>
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-black text-slate-950">
                  <KeyRound className="h-4 w-4" />
                  PIN
                </span>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={event => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full rounded-xl border border-amber-900/15 bg-white/70 px-4 py-3 text-center text-2xl font-black tracking-[0.35em] outline-none ring-blue-800/25 transition focus:ring-4"
                  placeholder="0000"
                  autoComplete="current-password"
                />
              </label>
            </div>

            {error && <div className="mt-4 rounded-xl bg-red-100 px-4 py-3 text-center text-sm font-bold text-red-700">{error}</div>}

            <button type="submit" className="magic-button mt-6 w-full">
              <BookOpen className="h-5 w-5" />
              {mode === 'login' ? 'Akademie betreten' : 'Schüler anlegen'}
            </button>

            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="mt-4 w-full rounded-xl px-4 py-3 text-sm font-black text-blue-950 transition hover:bg-blue-950/10"
            >
              {mode === 'login' ? 'Neue Schülerkarte erstellen' : 'Ich habe schon eine Schülerkarte'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
