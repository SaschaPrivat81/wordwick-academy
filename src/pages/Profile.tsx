import { useEffect, useState } from 'react';
import { CheckCircle2, Gift, LockKeyhole, PackageCheck, Sparkles, Trophy, UserRound } from 'lucide-react';
import { useAuth } from '../App';

interface Reward {
  id: number;
  title: string;
  description: string;
  cost: number;
  icon: string;
  kind: 'real' | 'game';
  unlockType: 'coins' | 'quest' | 'final';
  questTitle?: string;
  claimed: boolean;
  claimStatus?: 'requested' | 'claimed' | 'fulfilled' | 'cancelled';
  unlocked: boolean;
  lockedReason: string;
}

const claimLabels: Record<string, string> = {
  requested: 'Angefordert',
  claimed: 'Erhalten',
  fulfilled: 'Ausgegeben',
  cancelled: 'Storniert',
};

export default function Profile() {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [sparkBalance, setSparkBalance] = useState(user?.coins ?? 0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setSparkBalance(user?.coins ?? 0);
    fetch('/api/rewards', { credentials: 'include' })
      .then(response => response.json())
      .then(setRewards);
  }, [user]);

  const claim = async (reward: Reward) => {
    setMessage('');
    const response = await fetch(`/api/rewards/${reward.id}/claim`, {
      method: 'POST',
      credentials: 'include',
    });
    const data = await response.json();
    if (response.ok) {
      setRewards(previous => previous.map(item => item.id === reward.id ? { ...item, claimed: true, claimStatus: data.status } : item));
      setSparkBalance(current => Math.max(0, current - reward.cost));
      setMessage(data.status === 'requested' ? 'Pip hat die Belohnung in den Elternbereich gelegt.' : 'Das Fach ist geöffnet.');
    } else {
      setMessage(data.error ?? 'Dieses Fach öffnet sich noch nicht.');
    }
  };

  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl gap-5 px-4 py-5 lg:grid-cols-[340px_1fr]">
      <section className="ink-panel rounded-[28px] border border-amber-100/20 p-6 text-amber-50">
        <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-amber-200 text-slate-950">
          <UserRound className="h-12 w-12" />
        </div>
        <div className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-amber-200/70">Schülerkarte</div>
        <h1 className="mt-2 text-3xl font-black">{user?.name}</h1>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-amber-100/20 bg-white/10 p-4">
            <div className="flex items-center gap-2 text-amber-200">
              <Sparkles className="h-5 w-5" />
              <span className="text-3xl font-black">{sparkBalance}</span>
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

      <section className="parchment rounded-[28px] border border-amber-100/70 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Gift className="h-7 w-7 text-blue-950" />
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-950/60">Belohnungsschrank</div>
              <h2 className="text-2xl font-black text-slate-950">Magische Fächer</h2>
            </div>
          </div>
          {message && <div className="rounded-full bg-blue-100 px-4 py-2 text-xs font-black text-blue-950">{message}</div>}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {rewards.map(reward => (
            <div
              key={reward.id}
              className={`relative min-h-64 overflow-hidden rounded-2xl border p-4 shadow-lg shadow-slate-950/10 ${
                reward.claimed
                  ? 'border-blue-800/20 bg-blue-100/70'
                  : reward.unlocked
                    ? 'border-amber-400/60 bg-white/75'
                    : 'border-slate-950/10 bg-slate-200/70'
              }`}
            >
              <div className="absolute inset-x-4 top-3 h-2 rounded-full bg-slate-950/10" />
              <div className="mt-4 flex items-start justify-between gap-3">
                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl shadow-inner ${reward.unlocked || reward.claimed ? 'bg-blue-950 text-amber-100' : 'bg-stone-500 text-stone-200'}`}>
                  {reward.unlocked || reward.claimed ? reward.icon : <LockKeyhole className="h-7 w-7" />}
                </div>
                <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${reward.kind === 'real' ? 'bg-amber-200 text-amber-950' : 'bg-blue-200 text-blue-950'}`}>
                  {reward.kind === 'real' ? 'Echt' : 'Spiel'}
                </span>
              </div>

              <div className="mt-4">
                <div className="text-lg font-black leading-tight text-slate-950">{reward.title}</div>
                <p className="mt-2 min-h-12 text-sm font-semibold leading-6 text-stone-600">{reward.description || 'Dieses Fach wartet auf eine Beschreibung aus dem Elternbereich.'}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {reward.cost > 0 && <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black text-blue-950">{reward.cost} Funken</span>}
                {reward.unlockType !== 'coins' && (
                  <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black text-blue-950">
                    {reward.unlockType === 'final' ? 'Finallevel' : 'Level'}{reward.questTitle ? `: ${reward.questTitle}` : ''}
                  </span>
                )}
              </div>

              <div className="mt-5">
                {reward.claimed ? (
                  <span className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-950 px-4 py-3 text-sm font-black text-amber-50">
                    {reward.claimStatus === 'requested' ? <PackageCheck className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    {claimLabels[reward.claimStatus ?? 'claimed'] ?? 'Erhalten'}
                  </span>
                ) : (
                  <button
                    onClick={() => claim(reward)}
                    disabled={!reward.unlocked}
                    className="magic-button w-full px-4 py-3"
                  >
                    {reward.unlocked ? 'Fach öffnen' : reward.lockedReason}
                  </button>
                )}
              </div>
            </div>
          ))}
          {rewards.length === 0 && (
            <div className="rounded-2xl border border-amber-900/10 bg-white/60 p-5 text-sm font-bold text-stone-600">
              Der Schrank ist noch leer. Im Elternbereich können neue Fächer befüllt werden.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
