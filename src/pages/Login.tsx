import { useState } from 'react';
import { BookOpen, KeyRound, Sparkles, UserRound, Wand2 } from 'lucide-react';
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
      setError(mode === 'login' ? 'Name oder PIN stimmt nicht.' : 'Registrierung nicht moeglich.');
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 text-amber-50">
      <div className="absolute inset-0 opacity-60">
        <svg viewBox="0 0 900 900" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <linearGradient id="towerGlow" x1="0" x2="1">
              <stop offset="0" stopColor="#17392f" />
              <stop offset="1" stopColor="#4f704f" />
            </linearGradient>
          </defs>
          <circle cx="708" cy="138" r="74" fill="#f8e7b0" opacity="0.55" />
          <path d="M0 720 C150 642 248 724 378 660 C530 584 618 650 900 586 L900 900 L0 900 Z" fill="#10251f" />
          <path d="M182 604 L244 346 L306 604 Z" fill="url(#towerGlow)" />
          <path d="M214 348 L244 278 L274 348 Z" fill="#e4b95f" />
          <path d="M336 612 L414 246 L492 612 Z" fill="#16382f" />
          <path d="M376 248 L414 158 L452 248 Z" fill="#d9a441" />
          <path d="M502 620 L568 392 L634 620 Z" fill="#244f40" />
          <path d="M536 392 L568 318 L600 392 Z" fill="#f0ce75" />
          <rect x="244" y="506" width="340" height="166" rx="18" fill="#244f40" />
          <rect x="378" y="576" width="76" height="96" rx="38" fill="#0b1d19" />
          <g fill="#f8e7b0" opacity="0.72">
            <rect x="392" y="328" width="44" height="62" rx="22" />
            <rect x="224" y="430" width="38" height="52" rx="19" />
            <rect x="548" y="454" width="38" height="52" rx="19" />
            <rect x="300" y="552" width="40" height="44" rx="20" />
            <rect x="492" y="552" width="40" height="44" rx="20" />
          </g>
        </svg>
      </div>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl items-center">
        <div className="grid w-full items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-100/25 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-amber-100 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Aufnahmepruefung beginnt
            </div>
            <h1 className="text-5xl font-black leading-none tracking-normal text-amber-50 sm:text-6xl">
              Wordwick Academy
            </h1>
            <p className="mt-5 max-w-lg text-lg font-semibold leading-8 text-amber-100/80">
              Eine magische Lernschule fuer englische Woerter, wilde Verben und kleine Siege nach jeder bestandenen Quest.
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
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-900 text-amber-100 shadow-lg">
                <Wand2 className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-emerald-950">{mode === 'login' ? 'Zurueck in die Halle' : 'Neue Schuelerkarte'}</h2>
                <p className="text-sm font-semibold text-stone-500">Name und vierstelliger Zaubercode</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-black text-emerald-950">
                  <UserRound className="h-4 w-4" />
                  Name
                </span>
                <input
                  value={name}
                  onChange={event => setName(event.target.value)}
                  className="w-full rounded-xl border border-amber-900/15 bg-white/70 px-4 py-3 text-lg font-bold outline-none ring-emerald-800/25 transition focus:ring-4"
                  placeholder="Dein Name"
                  autoComplete="username"
                />
              </label>
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-black text-emerald-950">
                  <KeyRound className="h-4 w-4" />
                  PIN
                </span>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={event => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full rounded-xl border border-amber-900/15 bg-white/70 px-4 py-3 text-center text-2xl font-black tracking-[0.35em] outline-none ring-emerald-800/25 transition focus:ring-4"
                  placeholder="0000"
                  autoComplete="current-password"
                />
              </label>
            </div>

            {error && <div className="mt-4 rounded-xl bg-red-100 px-4 py-3 text-center text-sm font-bold text-red-700">{error}</div>}

            <button type="submit" className="magic-button mt-6 w-full">
              <BookOpen className="h-5 w-5" />
              {mode === 'login' ? 'Akademie betreten' : 'Schueler anlegen'}
            </button>

            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="mt-4 w-full rounded-xl px-4 py-3 text-sm font-black text-emerald-900 transition hover:bg-emerald-900/10"
            >
              {mode === 'login' ? 'Neue Schuelerkarte erstellen' : 'Ich habe schon eine Schuelerkarte'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
