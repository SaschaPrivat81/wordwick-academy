import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface Word {
  id: number;
  german: string;
  english: string;
  type: string;
  past?: string;
  participle?: string;
}

const QUEST_DATA: Record<number, { title: string; words: number[] }> = {
  1: { title: 'Tier-Welt', words: [1, 2] },
  2: { title: 'Zu Hause', words: [3] },
  3: { title: 'Wilde Verben', words: [4, 5, 6] },
  4: { title: 'Sehen & trinken', words: [7, 8] },
  5: { title: 'Schlafen & schreiben', words: [9, 10] },
};

export default function Quest() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const questId = Number(id);
  const quest = QUEST_DATA[questId];

  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    fetch('/api/words', { credentials: 'include' })
      .then(r => r.json())
      .then((all: Word[]) => {
        const filtered = all.filter(w => quest?.words.includes(w.id));
        setWords(filtered);
      });
  }, [questId]);

  const current = words[currentIndex];

  const report = async (isCorrect: boolean) => {
    if (!current) return;
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ wordId: current.id, correct: isCorrect }),
    });
  };

  const handleCorrect = async () => {
    setCorrect(c => c + 1);
    setCoinsEarned(c => c + 1);
    await report(true);
    nextCard();
  };

  const handleWrong = async () => {
    await report(false);
    nextCard();
  };

  const nextCard = () => {
    setFlipped(false);
    setShowResult(false);
    if (currentIndex + 1 >= words.length) {
      setFinished(true);
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  if (!quest) return <div className="p-8 text-center">Quest nicht gefunden</div>;
  if (words.length === 0) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>;

  if (finished) {
    const percent = Math.round((correct / words.length) * 100);
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-sm w-full">
          <div className="text-6xl mb-4">{percent >= 80 ? '🏆' : percent >= 50 ? '⭐' : '💪'}</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Quest geschafft!</h2>
          <p className="text-slate-500 mb-4">{correct} von {words.length} richtig</p>
          <div className="bg-amber-50 rounded-xl p-3 mb-6">
            <p className="text-amber-700 font-bold">+{coinsEarned} Münzen gesammelt! 🪙</p>
          </div>
          <button onClick={() => navigate('/')} className="w-full py-3 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-400">
            Zurück zur Karte 🗺️
          </button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="min-h-screen flex flex-col p-4 max-w-lg mx-auto">
      {/* Fortschritt */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate('/')} className="text-slate-400 hover:text-slate-600">←</button>
        <span className="font-bold text-slate-700">{quest.title}</span>
        <div className="flex-1 flex gap-1">
          {words.map((_, i) => (
            <div key={i} className={`h-2 flex-1 rounded-full ${i < currentIndex ? 'bg-emerald-400' : i === currentIndex ? 'bg-indigo-500' : 'bg-slate-200'}`} />
          ))}
        </div>
        <span className="text-sm text-slate-400">{currentIndex + 1}/{words.length}</span>
      </div>

      {/* Karteikarte */}
      <div className="flex-1 flex items-center justify-center">
        <div className={`w-full max-w-sm aspect-[3/4] card-flip ${flipped ? 'flipped' : ''}`} onClick={() => !showResult && setFlipped(!flipped)}>
          <div className="card-inner">
            {/* Vorderseite: Deutsch */}
            <div className="card-front bg-white shadow-xl border-2 border-indigo-100">
              <div className="text-center">
                <div className="text-sm text-slate-400 mb-2 uppercase tracking-wider">Deutsch</div>
                <h3 className="text-3xl font-extrabold text-slate-800">{current.german}</h3>
                {current.type === 'irregular' && (
                  <div className="mt-4 text-sm text-slate-500">
                    <p>Unregelmäßiges Verb</p>
                  </div>
                )}
                <p className="mt-8 text-slate-400 text-sm">Tippe zum Umdrehen 👆</p>
              </div>
            </div>

            {/* Rückseite: Englisch */}
            <div className="card-back bg-indigo-500 shadow-xl">
              <div className="text-center text-white">
                <div className="text-sm text-indigo-200 mb-2 uppercase tracking-wider">English</div>
                <h3 className="text-3xl font-extrabold">{current.english}</h3>
                {current.type === 'irregular' && (
                  <div className="mt-4 space-y-1 text-indigo-100">
                    <p>go – <strong>{current.past}</strong> – {current.participle}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      {flipped && !showResult && (
        <div className="mt-4 space-y-3">
          <p className="text-center text-sm text-slate-500">Kanntest du das Wort?</p>
          <div className="flex gap-3">
            <button onClick={handleWrong} className="flex-1 py-4 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200 active:scale-95 transition text-lg">
              ❌ Noch lernen
            </button>
            <button onClick={handleCorrect} className="flex-1 py-4 bg-emerald-100 text-emerald-600 font-bold rounded-xl hover:bg-emerald-200 active:scale-95 transition text-lg">
              ✅ Gewusst!
            </button>
          </div>
        </div>
      )}

      {!flipped && (
        <p className="text-center text-slate-400 text-sm mt-4">Karte antippen zum Umdrehen</p>
      )}
    </div>
  );
}
