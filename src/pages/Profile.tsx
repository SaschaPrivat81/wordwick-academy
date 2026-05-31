import { Link } from 'react-router-dom';
import { BookMarked, Gift, House, Map, Sparkles, Trophy, UserRound } from 'lucide-react';
import { useAuth } from '../App';

const playerPlaces = [
  { to: '/', label: 'Karte', helper: 'Zur Akademiekarte', Icon: Map },
  { to: '/pip-home', label: 'Pips Zuhause', helper: 'Horst und Fundstücke', Icon: House },
  { to: '/sparkbook', label: 'Funkenbuch', helper: 'Wörter sammeln', Icon: BookMarked },
  { to: '/rewards', label: 'Schrank', helper: 'Belohnungen öffnen', Icon: Gift },
];

export default function Profile() {
  const { user } = useAuth();

  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl gap-4 px-3 py-3 sm:px-4 sm:py-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <section className="ink-panel rounded-[24px] border border-amber-100/20 p-5 text-amber-50 xl:rounded-[28px] xl:p-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-amber-200 text-slate-950">
          <UserRound className="h-12 w-12" />
        </div>
        <div className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-amber-200/70">Schülerkarte</div>
        <h1 className="mt-2 text-3xl font-black">{user?.name}</h1>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-amber-100/20 bg-white/10 p-4">
            <div className="flex items-center gap-2 text-amber-200">
              <Sparkles className="h-5 w-5" />
              <span className="text-3xl font-black">{user?.coins ?? 0}</span>
            </div>
            <div className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-amber-100/60">Funken</div>
          </div>
          <div className="rounded-2xl border border-amber-100/20 bg-white/10 p-4">
            <div className="flex items-center gap-2 text-amber-200">
              <Trophy className="h-5 w-5" />
              <span className="text-3xl font-black">{user?.streak ?? 0}</span>
            </div>
            <div className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-amber-100/60">Tage</div>
          </div>
        </div>
      </section>

      <section className="parchment rounded-[24px] border border-amber-100/70 p-5 xl:rounded-[28px] xl:p-6">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-950/60">Spielorte</div>
        <h2 className="mt-2 text-2xl font-black text-slate-950">Wohin soll Pip als Nächstes?</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {playerPlaces.map(place => {
            const Icon = place.Icon;
            return (
              <Link
                key={place.to}
                to={place.to}
                className="group flex min-h-28 items-center gap-4 rounded-2xl border border-blue-950/10 bg-white/65 p-4 shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-white active:scale-[0.99]"
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-950 text-amber-100 transition group-hover:bg-blue-800">
                  <Icon className="h-7 w-7" />
                </span>
                <span>
                  <span className="block text-lg font-black text-slate-950">{place.label}</span>
                  <span className="mt-1 block text-sm font-bold text-stone-600">{place.helper}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
