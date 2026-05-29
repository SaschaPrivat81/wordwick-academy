import { useState, useEffect } from 'react';
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
      .then(r => r.json())
      .then(setRewards);
  }, []);

  const claim = async (id: number) => {
    const res = await fetch(`/api/rewards/${id}/claim`, {
      method: 'POST',
      credentials: 'include'
    });
    if (res.ok) {
      setRewards(prev => prev.map(r => r.id === id ? { ...r, claimed: true } : r));
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
        <div className="text-center">
          <div className="w-24 h-24 bg-indigo-500 rounded-full mx-auto mb-3 flex items-center justify-center text-4xl">👤</div>
          <h2 className="text-2xl font-bold text-slate-800">{user?.name}</h2>
          <div className="flex justify-center gap-4 mt-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-500">{user?.coins ?? 0}</div>
              <div className="text-xs text-slate-400">Münzen</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{user?.streak ?? 0}</div>
              <div className="text-xs text-slate-400">Tage Streak</div>
            </div>
          </div>
        </div>
      </div>

      <h3 className="font-bold text-slate-700 mb-3">🎁 Belohnungen</h3>
      <div className="space-y-3">
        {rewards.map(r => (
          <div key={r.id} className={`bg-white rounded-xl p-4 shadow-sm flex items-center justify-between ${r.claimed ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{r.icon}</span>
              <div>
                <div className="font-bold text-slate-800">{r.title}</div>
                <div className="text-sm text-amber-500 font-bold">{r.cost} 🪙</div>
              </div>
            </div>
            {r.claimed ? (
              <span className="text-sm text-emerald-500 font-bold">✅ Eingelöst</span>
            ) : (
              <button
                onClick={() => claim(r.id)}
                disabled={(user?.coins ?? 0) < r.cost}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                Einlösen
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
