import { useEffect, useState } from 'react';
import { Gift, Sparkles, Trophy, UserRound } from 'lucide-react';
import { useAuth } from '../App';

interface Reward {
  id: number;
  title: string;
  cost: number;
  icon: string;
  claimed: boolean;
}

export default function Profile() {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);

  useEffect(() => {
    fetch('/api/rewards', { credentials: 'include' })
      .then(response => response.json())
      .then(setRewards);
  }, []);

  const claim = async (id: number) => {
    const response = await fetch(`/api/rewards/${id}/claim`, {
      method: 'POST',
      credentials: 'include',
    });
    if (response.ok) {
      setRewards(previous => previous.map(reward => reward.id === id ? { ...reward, claimed: true } : reward));
    }
  };

  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl gap-5 px-4 py-5 lg:grid-cols-[340px_1fr]">
      <section className="ink-panel rounded-[28px] border border-amber-100/20 p-6 text-amber-50">
        <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-amber-200 text-emerald-950">
          <UserRound className="h-12 w-12" />
        </div>
        <div className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-amber-200/70">Schuelerkarte</div>
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

      <section className="parchment rounded-[28px] border border-amber-100/70 p-6">
        <div className="flex items-center gap-3">
          <Gift className="h-7 w-7 text-emerald-900" />
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-900/60">Belohnungsschrank</div>
            <h2 className="text-2xl font-black text-emerald-950">Magische Preise</h2>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          {rewards.map(reward => (
            <div key={reward.id} className={`flex items-center justify-between gap-4 rounded-2xl border border-amber-900/10 bg-white/60 p-4 ${reward.claimed ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-900 text-2xl text-amber-100">
                  {reward.icon}
                </div>
                <div>
                  <div className="font-black text-emerald-950">{reward.title}</div>
                  <div className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-amber-700">{reward.cost} Funken</div>
                </div>
              </div>
              {reward.claimed ? (
                <span className="rounded-full bg-emerald-100 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-emerald-800">Erhalten</span>
              ) : (
                <button
                  onClick={() => claim(reward.id)}
                  disabled={(user?.coins ?? 0) < reward.cost}
                  className="magic-button px-4 py-2"
                >
                  Einloesen
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
