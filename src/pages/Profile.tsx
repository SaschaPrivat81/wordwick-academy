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

const cabinetSlots = [
  { left: '22%', top: '32%', width: '17%', height: '25%' },
  { left: '41%', top: '32%', width: '17%', height: '25%' },
  { left: '59%', top: '32%', width: '17%', height: '25%' },
  { left: '78%', top: '32%', width: '17%', height: '25%' },
  { left: '22%', top: '64%', width: '17%', height: '25%' },
  { left: '41%', top: '64%', width: '17%', height: '25%' },
  { left: '59%', top: '64%', width: '17%', height: '25%' },
  { left: '78%', top: '64%', width: '17%', height: '25%' },
];

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
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1500px] gap-5 px-4 py-5 xl:grid-cols-[320px_1fr]">
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

      <section className="rounded-[28px] border border-amber-100/25 bg-slate-950/40 p-4 shadow-2xl shadow-slate-950/25">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Gift className="h-7 w-7 text-amber-100" />
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-200/70">Belohnungsschrank</div>
              <h2 className="text-2xl font-black text-amber-50">Magische Fächer</h2>
            </div>
          </div>
          {message && <div className="rounded-full bg-blue-100 px-4 py-2 text-xs font-black text-blue-950">{message}</div>}
        </div>

        <div className="mt-4 overflow-x-auto pb-2">
          <div className="relative aspect-[16/9] min-w-[920px] overflow-hidden rounded-[24px] border border-amber-100/20 bg-slate-950 shadow-2xl shadow-slate-950/30">
            <img
              src="/assets/reward-cabinet-v1.png"
              alt="Magischer Belohnungsschrank"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-slate-950/5" />

            {rewards.slice(0, cabinetSlots.length).map((reward, index) => {
              const slot = cabinetSlots[index];
              return (
                <div
                  key={reward.id}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-2 shadow-xl backdrop-blur-sm ${
                    reward.claimed
                      ? 'border-blue-200/80 bg-blue-950/72 text-amber-50'
                      : reward.unlocked
                        ? 'border-amber-200/80 bg-amber-50/82 text-slate-950'
                        : 'border-stone-200/30 bg-slate-950/62 text-stone-200'
                  }`}
                  style={slot}
                >
                  <div className="flex h-full flex-col justify-between gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-2xl ${reward.unlocked || reward.claimed ? 'bg-blue-950 text-amber-100' : 'bg-stone-600 text-stone-200'}`}>
                        {reward.unlocked || reward.claimed ? reward.icon : <LockKeyhole className="h-5 w-5" />}
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] ${reward.kind === 'real' ? 'bg-amber-200 text-amber-950' : 'bg-blue-200 text-blue-950'}`}>
                        {reward.kind === 'real' ? 'Echt' : 'Spiel'}
                      </span>
                    </div>

                    <div>
                      <div className="line-clamp-2 text-sm font-black leading-tight">{reward.title}</div>
                      <div className={`mt-1 text-[10px] font-black uppercase tracking-[0.08em] ${reward.claimed ? 'text-amber-100/80' : reward.unlocked ? 'text-blue-950/70' : 'text-stone-200/70'}`}>
                        {reward.cost > 0 ? `${reward.cost} Funken` : reward.unlockType === 'coins' ? 'Frei' : reward.unlockType === 'final' ? 'Finallevel' : 'Level'}
                      </div>
                    </div>

                    {reward.claimed ? (
                      <span className="inline-flex items-center justify-center gap-1 rounded-lg bg-blue-100 px-2 py-1 text-[10px] font-black text-blue-950">
                        {reward.claimStatus === 'requested' ? <PackageCheck className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                        {claimLabels[reward.claimStatus ?? 'claimed'] ?? 'Erhalten'}
                      </span>
                    ) : (
                      <button
                        onClick={() => claim(reward)}
                        disabled={!reward.unlocked}
                        className={`rounded-lg px-2 py-1 text-[10px] font-black transition active:scale-95 disabled:cursor-not-allowed ${
                          reward.unlocked
                            ? 'bg-blue-800 text-amber-50 hover:bg-blue-700'
                            : 'bg-stone-700 text-stone-200'
                        }`}
                      >
                        {reward.unlocked ? 'Öffnen' : 'Gesperrt'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {rewards.length === 0 && (
              <div className="absolute left-1/2 top-1/2 w-72 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-amber-100/30 bg-slate-950/70 p-5 text-center text-sm font-bold text-amber-50 backdrop-blur-sm">
                Der Schrank ist noch leer. Im Elternbereich können neue Fächer befüllt werden.
              </div>
            )}
          </div>
        </div>

        {rewards.length > cabinetSlots.length && (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {rewards.slice(cabinetSlots.length).map(reward => (
              <div key={reward.id} className="rounded-2xl border border-amber-100/20 bg-white/10 p-4 text-amber-50">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{reward.icon}</div>
                  <div>
                    <div className="font-black">{reward.title}</div>
                    <div className="text-xs font-bold text-amber-100/65">{reward.cost} Funken</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
