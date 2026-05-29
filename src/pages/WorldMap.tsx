import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

interface Word {
  id: number;
  german: string;
  english: string;
  type: string;
  category: string;
  wordId: number;
  mastered: number;
}

interface QuestNode {
  id: number;
  title: string;
  x: number;
  y: number;
  emoji: string;
  words: number[];
}

const QUESTS: QuestNode[] = [
  { id: 1, title: 'Tier-Welt', x: 20, y: 70, emoji: '🦁', words: [1, 2] },
  { id: 2, title: 'Zu Hause', x: 50, y: 60, emoji: '🏠', words: [3] },
  { id: 3, title: 'Wilde Verben', x: 80, y: 50, emoji: '⚡', words: [4, 5, 6] },
  { id: 4, title: 'Sehen & trinken', x: 60, y: 30, emoji: '👁️', words: [7, 8] },
  { id: 5, title: 'Schlafen & schreiben', x: 30, y: 20, emoji: '✍️', words: [9, 10] },
];

export default function WorldMap() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<Record<number, Word>>({});
  const [selectedQuest, setSelectedQuest] = useState<QuestNode | null>(null);

  useEffect(() => {
    fetch('/api/progress', { credentials: 'include' })
      .then(r => r.json())
      .then((data: Word[]) => {
        const map: Record<number, Word> = {};
        for (const p of data) map[p.wordId] = p;
        setProgress(map);
      });
  }, []);

  const questStatus = (quest: QuestNode) => {
    const mastered = quest.words.filter(w => progress[w]?.mastered).length;
    if (mastered === quest.words.length) return 'completed';
    if (mastered > 0 || quest.id === 1) return 'unlocked';
    const prev = QUESTS[quest.id - 2];
    if (!prev) return 'unlocked';
    const prevMastered = prev.words.filter(w => progress[w]?.mastered).length;
    return prevMastered >= prev.words.length * 0.5 ? 'unlocked' : 'locked';
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Wilkommen */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
        <h2 className="text-xl font-bold text-slate-800">Hallo, {user?.name}! 👋</h2>
        <p className="text-slate-500 text-sm">Wähle eine Quest auf der Karte!</p>
      </div>

      {/* Weltkarte */}
      <div className="relative bg-emerald-100 rounded-3xl aspect-[4/5] overflow-hidden shadow-inner border-4 border-emerald-200">
        {/* Dekoration: Berge, Bäume, Fluss */}
        <div className="absolute inset-0 opacity-20">
          <svg viewBox="0 0 400 500" className="w-full h-full">
            <path d="M0,400 Q100,350 200,380 T400,360 L400,500 L0,500 Z" fill="#059669" />
            <path d="M50,200 L100,100 L150,200 Z" fill="#64748b" />
            <path d="M250,150 L300,50 L350,150 Z" fill="#64748b" />
            <circle cx="320" cy="80" r="25" fill="#fbbf24" />
          </svg>
        </div>

        {/* Quest-Nodes */}
        {QUESTS.map(quest => {
          const status = questStatus(quest);
          return (
            <button
              key={quest.id}
              onClick={() => status !== 'locked' && setSelectedQuest(quest)}
              className={`absolute quest-node ${status}`}
              style={{ left: `${quest.x}%`, top: `${quest.y}%`, transform: 'translate(-50%, -50%)' }}
            >
              <span className="text-2xl">{quest.emoji}</span>
              {status === 'completed' && <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-xs">⭐</span>}
              {status === 'locked' && <span className="absolute inset-0 flex items-center justify-center text-lg">🔒</span>}
            </button>
          );
        })}

        {/* Verbindungslinien */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          {QUESTS.slice(0, -1).map((q, i) => {
            const next = QUESTS[i + 1];
            return <line key={i} x1={q.x} y1={q.y} x2={next.x} y2={next.y} stroke="#10b981" strokeWidth="0.5" strokeDasharray="2" opacity="0.5" />;
          })}
        </svg>
      </div>

      {/* Quest-Detail Panel */}
      {selectedQuest && (
        <div className="mt-4 bg-white rounded-2xl p-4 shadow-lg border-2 border-indigo-100">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{selectedQuest.emoji}</span>
            <div>
              <h3 className="font-bold text-slate-800">Quest {selectedQuest.id}: {selectedQuest.title}</h3>
              <p className="text-sm text-slate-500">{selectedQuest.words.length} Wörter</p>
            </div>
          </div>
          <div className="flex gap-2 mb-3">
            {selectedQuest.words.map(wid => (
              <span key={wid} className={`w-3 h-3 rounded-full ${progress[wid]?.mastered ? 'bg-amber-400' : 'bg-slate-200'}`} />
            ))}
          </div>
          <button
            onClick={() => navigate(`/quest/${selectedQuest.id}`)}
            className="w-full py-3 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-400 active:scale-95 transition"
          >
            {selectedQuest.words.every(w => progress[w]?.mastered) ? 'Nochmal üben' : 'Quest starten!'} ⚔️
          </button>
        </div>
      )}
    </div>
  );
}
