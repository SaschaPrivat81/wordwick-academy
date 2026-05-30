import { useEffect, useState } from 'react';
import { BookOpen, Database, FileText, LineChart, LockKeyhole, PlusCircle, Save, ShieldCheck, Trash2, UserPlus, Users, Wand2 } from 'lucide-react';

interface AdminWord {
  id: number;
  german: string;
  english: string;
  type: string;
  category?: string;
  past?: string;
  participle?: string;
}

interface AdminQuest {
  id: number;
  title: string;
  subtitle: string;
  chapter: string;
  kind: string;
  gameType?: string;
  reward?: string;
  guide: string;
  words: number[];
  wordItems: AdminWord[];
}

type UserRole = 'child' | 'parent' | 'admin';

interface AdminUser {
  id: number;
  name: string;
  pin: string;
  role: UserRole;
  coins: number;
  streak: number;
  lastPlayed?: string;
  avatar?: string;
  createdAt: string;
  progressCount: number;
  masteredCount: number;
}

interface UserForm {
  name: string;
  pin: string;
  role: UserRole;
}

interface UserDraft {
  name: string;
  pin: string;
  role: UserRole;
  coins: string;
  streak: string;
  avatar: string;
}

interface WordForm {
  german: string;
  english: string;
  type: 'vocab' | 'irregular';
  category: string;
  past: string;
  participle: string;
}

const emptyWordForm: WordForm = {
  german: '',
  english: '',
  type: 'vocab',
  category: '',
  past: '',
  participle: '',
};

const emptyUserForm: UserForm = {
  name: '',
  pin: '',
  role: 'child',
};

const inputClass = 'w-full rounded-xl border border-amber-900/15 bg-white/70 px-3 py-2 text-sm font-bold outline-none ring-blue-800/25 focus:ring-4';
const labelClass = 'mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-blue-950/55';

const roleOptions: [UserRole, string][] = [
  ['child', 'Kind'],
  ['parent', 'Elternteil'],
  ['admin', 'Admin'],
];

const roleLabels: Record<UserRole, string> = {
  child: 'Kind',
  parent: 'Elternteil',
  admin: 'Admin',
};

const gameTypes = [
  ['spark-catcher', 'Wortfunken fangen'],
  ['library-sorter', 'Bücherregal sortieren'],
  ['verb-assembler', 'Verbsteine ordnen'],
  ['text-input', 'Texteingabe'],
];

export default function Admin() {
  const [csv, setCsv] = useState('');
  const [result, setResult] = useState('');
  const [userId, setUserId] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [content, setContent] = useState<{ quests: AdminQuest[]; words: AdminWord[] } | null>(null);
  const [contentError, setContentError] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userForm, setUserForm] = useState<UserForm>(emptyUserForm);
  const [userDrafts, setUserDrafts] = useState<Record<number, UserDraft>>({});
  const [userResult, setUserResult] = useState('');
  const [wordForm, setWordForm] = useState<WordForm>(emptyWordForm);
  const [wordResult, setWordResult] = useState('');
  const [questDrafts, setQuestDrafts] = useState<Record<number, Partial<AdminQuest>>>({});
  const [selectedWords, setSelectedWords] = useState<Record<number, string>>({});

  const loadContent = async () => {
    const response = await fetch('/api/admin/content', { credentials: 'include' });
    if (!response.ok) {
      setContentError('Der Content-Bereich ist für Eltern/Admins vorgesehen.');
      return;
    }
    const data = await response.json();
    setContent(data);
    setQuestDrafts(Object.fromEntries(data.quests.map((quest: AdminQuest) => [quest.id, {
      title: quest.title,
      subtitle: quest.subtitle,
      chapter: quest.chapter,
      kind: quest.kind,
      gameType: quest.gameType ?? 'text-input',
      reward: quest.reward ?? '',
      guide: quest.guide,
    }])));
    setContentError('');
  };

  const loadUsers = async () => {
    const response = await fetch('/api/admin/users', { credentials: 'include' });
    if (!response.ok) {
      setContentError('Der Admin-Bereich ist für Eltern/Admins vorgesehen.');
      return;
    }
    const data = await response.json();
    setUsers(data);
    setUserDrafts(Object.fromEntries(data.map((user: AdminUser) => [user.id, {
      name: user.name,
      pin: user.pin,
      role: user.role,
      coins: String(user.coins),
      streak: String(user.streak),
      avatar: user.avatar ?? 'blocky',
    }])));
    setContentError('');
  };

  useEffect(() => {
    loadContent();
    loadUsers();
  }, []);

  const updateUserForm = <K extends keyof UserForm>(field: K, value: UserForm[K]) => {
    setUserForm(current => ({ ...current, [field]: value }));
  };

  const createUser = async () => {
    setUserResult('');
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(userForm),
    });
    const data = await response.json();
    if (!response.ok) {
      setUserResult(data.error ?? 'Nutzer konnte nicht angelegt werden.');
      return;
    }
    setUserResult(`${data.name} wurde angelegt.`);
    setUserForm(emptyUserForm);
    await loadUsers();
  };

  const updateUserDraft = <K extends keyof UserDraft>(userId: number, field: K, value: UserDraft[K]) => {
    setUserDrafts(current => ({
      ...current,
      [userId]: { ...current[userId], [field]: value },
    }));
  };

  const saveUser = async (userId: number) => {
    setUserResult('');
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(userDrafts[userId]),
    });
    const data = await response.json();
    if (!response.ok) {
      setUserResult(data.error ?? 'Nutzer konnte nicht gespeichert werden.');
      return;
    }
    setUserResult(`${data.name} wurde gespeichert.`);
    await loadUsers();
  };

  const updateWordForm = <K extends keyof WordForm>(field: K, value: WordForm[K]) => {
    setWordForm(current => ({ ...current, [field]: value }));
  };

  const createWord = async () => {
    setWordResult('');
    const response = await fetch('/api/admin/words', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(wordForm),
    });
    const data = await response.json();
    if (!response.ok) {
      setWordResult(data.error ?? 'Wort konnte nicht angelegt werden.');
      return;
    }
    setWordResult(`${data.german} / ${data.english} angelegt.`);
    setWordForm(emptyWordForm);
    await loadContent();
  };

  const importWords = async () => {
    const res = await fetch('/api/admin/words/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ csv }),
    });
    const data = await res.json();
    setResult(`${data.imported ?? 0} Wörter importiert.`);
    await loadContent();
  };

  const updateQuestDraft = (questId: number, field: keyof AdminQuest, value: string) => {
    setQuestDrafts(current => ({
      ...current,
      [questId]: { ...current[questId], [field]: value },
    }));
  };

  const saveQuest = async (questId: number) => {
    await fetch(`/api/admin/quests/${questId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(questDrafts[questId]),
    });
    await loadContent();
  };

  const assignWord = async (questId: number) => {
    const wordId = selectedWords[questId];
    if (!wordId) return;
    await fetch(`/api/admin/quests/${questId}/words`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ wordId }),
    });
    setSelectedWords(current => ({ ...current, [questId]: '' }));
    await loadContent();
  };

  const removeWord = async (questId: number, wordId: number) => {
    await fetch(`/api/admin/quests/${questId}/words/${wordId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    await loadContent();
  };

  const loadStats = async () => {
    if (!userId) {
      setStats(null);
      return;
    }
    const res = await fetch(`/api/admin/stats/${userId}`, { credentials: 'include' });
    if (res.ok) setStats(await res.json());
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-5">
      <div className="mb-5 flex items-center gap-3 text-amber-50">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-200 text-slate-950">
          <Wand2 className="h-6 w-6" />
        </div>
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-200/70">Akademieleitung</div>
          <h1 className="text-3xl font-black">Content & Fortschritt</h1>
        </div>
      </div>

      {contentError && (
        <section className="ink-panel mb-5 rounded-[28px] border border-amber-100/20 p-5 text-amber-50">
          <div className="flex items-center gap-3">
            <LockKeyhole className="h-6 w-6 text-amber-200" />
            <p className="font-bold">{contentError}</p>
          </div>
        </section>
      )}

      <section className="parchment mb-5 rounded-[28px] border border-amber-100/70 p-5">
        <div className="mb-4 flex items-center gap-3">
          <Users className="h-6 w-6 text-blue-950" />
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-950/60">Familienzugänge</div>
            <h2 className="text-2xl font-black text-slate-950">Benutzer & Rollen</h2>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
          <div className="grid gap-3 md:grid-cols-2">
            {users.map(user => {
              const draft = userDrafts[user.id] ?? {
                name: user.name,
                pin: user.pin,
                role: user.role,
                coins: String(user.coins),
                streak: String(user.streak),
                avatar: user.avatar ?? 'blocky',
              };
              return (
                <div key={user.id} className="rounded-2xl border border-amber-900/10 bg-white/60 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.16em] text-blue-950/50">ID {user.id}</div>
                      <div className="text-lg font-black text-slate-950">{user.name}</div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-950">
                      <ShieldCheck className="h-3 w-3" />
                      {roleLabels[user.role]}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label>
                      <span className={labelClass}>Name</span>
                      <input className={inputClass} value={draft.name} onChange={event => updateUserDraft(user.id, 'name', event.target.value)} />
                    </label>
                    <label>
                      <span className={labelClass}>PIN</span>
                      <input
                        className={inputClass}
                        value={draft.pin}
                        inputMode="numeric"
                        maxLength={4}
                        onChange={event => updateUserDraft(user.id, 'pin', event.target.value.replace(/\D/g, '').slice(0, 4))}
                      />
                    </label>
                    <label>
                      <span className={labelClass}>Rolle</span>
                      <select className={inputClass} value={draft.role} onChange={event => updateUserDraft(user.id, 'role', event.target.value as UserRole)}>
                        {roleOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </label>
                    <label>
                      <span className={labelClass}>Avatar</span>
                      <input className={inputClass} value={draft.avatar} onChange={event => updateUserDraft(user.id, 'avatar', event.target.value)} />
                    </label>
                    <label>
                      <span className={labelClass}>Münzen</span>
                      <input className={inputClass} type="number" min={0} value={draft.coins} onChange={event => updateUserDraft(user.id, 'coins', event.target.value)} />
                    </label>
                    <label>
                      <span className={labelClass}>Serie</span>
                      <input className={inputClass} type="number" min={0} value={draft.streak} onChange={event => updateUserDraft(user.id, 'streak', event.target.value)} />
                    </label>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-stone-600">
                    <span>{user.progressCount} Wörter gesehen · {user.masteredCount} beherrscht</span>
                    <button onClick={() => saveUser(user.id)} className="gold-button px-4 py-2">
                      <Save className="h-4 w-4" />
                      Speichern
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-amber-900/10 bg-white/60 p-4">
            <div className="mb-4 flex items-center gap-3">
              <UserPlus className="h-6 w-6 text-blue-950" />
              <h3 className="text-xl font-black text-slate-950">Zugang anlegen</h3>
            </div>
            <div className="grid gap-3">
              <label>
                <span className={labelClass}>Name</span>
                <input className={inputClass} value={userForm.name} onChange={event => updateUserForm('name', event.target.value)} />
              </label>
              <label>
                <span className={labelClass}>4-stelliger Code</span>
                <input
                  className={inputClass}
                  value={userForm.pin}
                  inputMode="numeric"
                  maxLength={4}
                  onChange={event => updateUserForm('pin', event.target.value.replace(/\D/g, '').slice(0, 4))}
                />
              </label>
              <label>
                <span className={labelClass}>Rolle</span>
                <select className={inputClass} value={userForm.role} onChange={event => updateUserForm('role', event.target.value as UserRole)}>
                  {roleOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
            </div>
            <button onClick={createUser} className="magic-button mt-3 w-full">
              <UserPlus className="h-4 w-4" />
              Zugang speichern
            </button>
            {userResult && <p className="mt-2 text-sm font-black text-blue-800">{userResult}</p>}
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_400px]">
        <section className="parchment rounded-[28px] border border-amber-100/70 p-5">
          <div className="mb-4 flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-blue-950" />
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-950/60">Levelstruktur</div>
              <h2 className="text-2xl font-black text-slate-950">Kartenorte befüllen</h2>
            </div>
          </div>

          <div className="grid gap-4">
            {(content?.quests ?? []).map(quest => {
              const draft = questDrafts[quest.id] ?? quest;
              const availableWords = (content?.words ?? []).filter(word => !quest.words.includes(word.id));
              return (
                <div key={quest.id} className="rounded-2xl border border-amber-900/10 bg-white/60 p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <label>
                      <span className={labelClass}>Titel</span>
                      <input className={inputClass} value={draft.title ?? ''} onChange={event => updateQuestDraft(quest.id, 'title', event.target.value)} />
                    </label>
                    <label>
                      <span className={labelClass}>Kapitel</span>
                      <input className={inputClass} value={draft.chapter ?? ''} onChange={event => updateQuestDraft(quest.id, 'chapter', event.target.value)} />
                    </label>
                    <label>
                      <span className={labelClass}>Untertitel</span>
                      <input className={inputClass} value={draft.subtitle ?? ''} onChange={event => updateQuestDraft(quest.id, 'subtitle', event.target.value)} />
                    </label>
                    <label>
                      <span className={labelClass}>Belohnung</span>
                      <input className={inputClass} value={draft.reward ?? ''} onChange={event => updateQuestDraft(quest.id, 'reward', event.target.value)} />
                    </label>
                    <label>
                      <span className={labelClass}>Inhaltstyp</span>
                      <select className={inputClass} value={draft.kind ?? 'vocab'} onChange={event => updateQuestDraft(quest.id, 'kind', event.target.value)}>
                        <option value="vocab">Vokabeln</option>
                        <option value="verb">Verben</option>
                        <option value="mixed">Gemischt</option>
                      </select>
                    </label>
                    <label>
                      <span className={labelClass}>Spieltyp</span>
                      <select className={inputClass} value={draft.gameType ?? 'text-input'} onChange={event => updateQuestDraft(quest.id, 'gameType', event.target.value)}>
                        {gameTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </label>
                  </div>

                  <label className="mt-3 block">
                    <span className={labelClass}>Pips Hinweis</span>
                    <textarea
                      className={`${inputClass} min-h-20`}
                      value={draft.guide ?? ''}
                      onChange={event => updateQuestDraft(quest.id, 'guide', event.target.value)}
                    />
                  </label>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <select
                      className={inputClass}
                      value={selectedWords[quest.id] ?? ''}
                      onChange={event => setSelectedWords(current => ({ ...current, [quest.id]: event.target.value }))}
                    >
                      <option value="">Wort aus Wortbank wählen</option>
                      {availableWords.map(word => (
                        <option key={word.id} value={word.id}>
                          {word.german} / {word.english}{word.type === 'irregular' ? ` / ${word.past} / ${word.participle}` : ''}
                        </option>
                      ))}
                    </select>
                    <button onClick={() => assignWord(quest.id)} className="magic-button shrink-0">
                      <PlusCircle className="h-4 w-4" />
                      Hinzufügen
                    </button>
                    <button onClick={() => saveQuest(quest.id)} className="gold-button shrink-0">
                      <Save className="h-4 w-4" />
                      Speichern
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {quest.wordItems.length > 0 ? quest.wordItems.map(word => (
                      <button
                        key={word.id}
                        onClick={() => removeWord(quest.id, word.id)}
                        className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-950 transition hover:bg-red-100 hover:text-red-800"
                      >
                        {word.german} / {word.english}
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )) : (
                      <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-bold text-stone-600">Noch kein Inhalt</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="grid content-start gap-5">
          <section className="parchment rounded-[28px] border border-amber-100/70 p-5">
            <div className="mb-4 flex items-center gap-3">
              <PlusCircle className="h-6 w-6 text-blue-950" />
              <h2 className="text-xl font-black text-slate-950">Wort anlegen</h2>
            </div>
            <div className="grid gap-3">
              <label>
                <span className={labelClass}>Deutsch</span>
                <input className={inputClass} value={wordForm.german} onChange={event => updateWordForm('german', event.target.value)} />
              </label>
              <label>
                <span className={labelClass}>Englisch</span>
                <input className={inputClass} value={wordForm.english} onChange={event => updateWordForm('english', event.target.value)} />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className={labelClass}>Typ</span>
                  <select className={inputClass} value={wordForm.type} onChange={event => updateWordForm('type', event.target.value as WordForm['type'])}>
                    <option value="vocab">Vokabel</option>
                    <option value="irregular">Unregelmäßiges Verb</option>
                  </select>
                </label>
                <label>
                  <span className={labelClass}>Kategorie</span>
                  <input className={inputClass} value={wordForm.category} onChange={event => updateWordForm('category', event.target.value)} />
                </label>
              </div>
              {wordForm.type === 'irregular' && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label>
                    <span className={labelClass}>Past Simple</span>
                    <input className={inputClass} value={wordForm.past} onChange={event => updateWordForm('past', event.target.value)} />
                  </label>
                  <label>
                    <span className={labelClass}>Past Participle</span>
                    <input className={inputClass} value={wordForm.participle} onChange={event => updateWordForm('participle', event.target.value)} />
                  </label>
                </div>
              )}
            </div>
            <button onClick={createWord} className="magic-button mt-3 w-full">Wort speichern</button>
            {wordResult && <p className="mt-2 text-sm font-black text-blue-800">{wordResult}</p>}
          </section>

          <section className="parchment rounded-[28px] border border-amber-100/70 p-5">
            <div className="mb-4 flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-950" />
              <h2 className="text-xl font-black text-slate-950">CSV-Import</h2>
            </div>
            <p className="mb-2 text-xs font-bold text-stone-500">Format: german,english,type,category,past,participle</p>
            <textarea
              value={csv}
              onChange={event => setCsv(event.target.value)}
              rows={6}
              className="w-full rounded-xl border border-amber-900/15 bg-white/70 px-3 py-2 font-mono text-sm outline-none ring-blue-800/25 focus:ring-4"
              placeholder={`german,english,type,category,past,participle
Hund,dog,vocab,tiere,,
gehen,go,irregular,verben,went,gone`}
            />
            <button onClick={importWords} className="magic-button mt-3 w-full">Importieren</button>
            {result && <p className="mt-2 text-sm font-black text-blue-800">{result}</p>}
          </section>

          <section className="parchment rounded-[28px] border border-amber-100/70 p-5">
            <div className="mb-4 flex items-center gap-3">
              <Database className="h-6 w-6 text-blue-950" />
              <h2 className="text-xl font-black text-slate-950">Wortbank</h2>
            </div>
            <div className="max-h-64 space-y-2 overflow-auto pr-1">
              {(content?.words ?? []).map(word => (
                <div key={word.id} className="rounded-xl bg-white/60 px-3 py-2 text-sm">
                  <span className="font-black text-slate-950">{word.german}</span>
                  <span className="text-stone-500"> / {word.english}</span>
                  {word.type === 'irregular' && <span className="text-stone-500"> / {word.past} / {word.participle}</span>}
                </div>
              ))}
            </div>
          </section>

          <section className="parchment rounded-[28px] border border-amber-100/70 p-5">
            <div className="mb-4 flex items-center gap-3">
              <LineChart className="h-6 w-6 text-blue-950" />
              <h2 className="text-xl font-black text-slate-950">Fortschritt</h2>
            </div>
            <div className="flex gap-2">
              <select
                value={userId}
                onChange={event => setUserId(event.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-amber-900/15 bg-white/70 px-3 py-2 outline-none ring-blue-800/25 focus:ring-4"
              >
                <option value="">Nutzer wählen</option>
                {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
              </select>
              <button onClick={loadStats} className="magic-button px-4 py-2">Laden</button>
            </div>
            {stats && (
              <div className="mt-4 space-y-2 text-sm font-semibold text-stone-700">
                <p><strong>Name:</strong> {stats.user.name}</p>
                <p><strong>Gelernte Wörter:</strong> {stats.progressCount}</p>
                <p><strong>Beherrscht:</strong> {stats.masteredCount}</p>
                {stats.weakWords.length > 0 && <p><strong>Schwierige Wörter:</strong></p>}
                {stats.weakWords.map((word: any) => (
                  <p key={word.id}>{word.german} / {word.english} ({word.wrongCount}x falsch)</p>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
