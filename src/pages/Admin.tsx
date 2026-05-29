import { useState } from 'react';

export default function Admin() {
  const [csv, setCsv] = useState('');
  const [result, setResult] = useState('');
  const [userId, setUserId] = useState('');
  const [stats, setStats] = useState<any>(null);

  const importWords = async () => {
    const res = await fetch('/api/admin/words/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ csv }),
    });
    const data = await res.json();
    setResult(`${data.imported} Wörter importiert!`);
  };

  const loadStats = async () => {
    const res = await fetch(`/api/admin/stats/${userId}`, { credentials: 'include' });
    if (res.ok) setStats(await res.json());
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">🛠️ Admin-Bereich</h2>

      {/* CSV Import */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
        <h3 className="font-bold text-slate-700 mb-2">Vokabeln importieren (CSV)</h3>
        <p className="text-xs text-slate-400 mb-2">Format: german,english,type,category,past,participle</p>
        <textarea
          value={csv}
          onChange={e => setCsv(e.target.value)}
          rows={6}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono"
          placeholder={`german,english,type,category,past,participle
Hund,dog,vocab,tiere,,
gehen,go,irregular,verben,went,gone`}
        />
        <button onClick={importWords} className="mt-2 w-full py-2 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-400">
          Importieren
        </button>
        {result && <p className="mt-2 text-blue-600 font-bold text-sm">{result}</p>}
      </div>

      {/* Statistik */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-bold text-slate-700 mb-2">Fortschritt ansehen</h3>
        <div className="flex gap-2 mb-2">
          <input
            type="number"
            value={userId}
            onChange={e => setUserId(e.target.value)}
            placeholder="User-ID"
            className="flex-1 px-3 py-2 rounded-xl border border-slate-200"
          />
          <button onClick={loadStats} className="px-4 py-2 bg-slate-700 text-white rounded-xl font-bold">Laden</button>
        </div>
        {stats && (
          <div className="mt-2 space-y-2 text-sm">
            <p><strong>Name:</strong> {stats.user.name}</p>
            <p><strong>Gelernte Wörter:</strong> {stats.progressCount}</p>
            <p><strong>Beherrscht:</strong> {stats.masteredCount}</p>
            <p><strong>Schwierige Wörter:</strong></p>
            <ul className="list-disc pl-4">
              {stats.weakWords.map((w: any) => (
                <li key={w.id}>{w.german} → {w.english} ({w.wrongCount}x falsch)</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
