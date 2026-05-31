import { useEffect, useState } from 'react';
import { BookOpen, Database, Download, FileText, Gift, LineChart, LockKeyhole, PackageCheck, PlusCircle, Save, Search, ShieldCheck, Trash2, UploadCloud, UserPlus, Users, Wand2 } from 'lucide-react';

interface AdminWord {
  id: number;
  german: string;
  english: string;
  type: 'vocab' | 'irregular';
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
type AdminTab = 'users' | 'rewards' | 'levels' | 'import' | 'progress';

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

type RewardKind = 'real' | 'game';
type RewardUnlockType = 'coins' | 'quest' | 'final';
type RewardVisibility = 'visible' | 'unlocked';
type RewardClaimStatus = 'requested' | 'approved' | 'claimed' | 'fulfilled' | 'cancelled';

interface AdminReward {
  id: number;
  title: string;
  description: string;
  cost: number;
  icon: string;
  kind: RewardKind;
  unlockType: RewardUnlockType;
  questId?: number | null;
  questTitle?: string | null;
  active: number;
  sortOrder: number;
  requiresApproval: number;
  visibility: RewardVisibility;
  parentNote: string;
}

interface RewardDraft {
  title: string;
  description: string;
  cost: string;
  icon: string;
  kind: RewardKind;
  unlockType: RewardUnlockType;
  questId: string;
  active: boolean;
  sortOrder: string;
  requiresApproval: boolean;
  visibility: RewardVisibility;
  parentNote: string;
}

interface RewardClaim {
  id: number;
  userName: string;
  rewardTitle: string;
  icon: string;
  kind: RewardKind;
  parentNote?: string;
  status: RewardClaimStatus;
  claimedAt: string;
}

interface WordForm {
  german: string;
  english: string;
  type: 'vocab' | 'irregular';
  category: string;
  past: string;
  participle: string;
}

interface ImportPreviewRow {
  rowNumber: number;
  german: string;
  english: string;
  type: 'vocab' | 'irregular';
  category: string;
  past: string;
  participle: string;
  level: number | null;
  questTitle: string | null;
  action: 'create' | 'link' | 'skip' | 'error';
  valid: boolean;
  errors: string[];
}

interface ImportPreview {
  rows: ImportPreviewRow[];
  parseErrors: string[];
  summary: {
    total: number;
    valid: number;
    creates: number;
    links: number;
    skips: number;
    errors: number;
  };
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

const emptyRewardDraft: RewardDraft = {
  title: '',
  description: '',
  cost: '0',
  icon: '🎁',
  kind: 'real',
  unlockType: 'coins',
  questId: '',
  active: true,
  sortOrder: '10',
  requiresApproval: true,
  visibility: 'visible',
  parentNote: '',
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

const rewardKindLabels: Record<RewardKind, string> = {
  real: 'Echte Belohnung',
  game: 'Spiel-Belohnung',
};

const unlockTypeLabels: Record<RewardUnlockType, string> = {
  coins: 'Wortfunken',
  quest: 'Levelabschluss',
  final: 'Finallevel',
};

const claimStatusLabels: Record<RewardClaimStatus, string> = {
  requested: 'Offen',
  approved: 'Liegt bereit',
  claimed: 'Im Spiel erhalten',
  fulfilled: 'Ausgegeben',
  cancelled: 'Später',
};

const gameTypes = [
  ['spark-catcher', 'Wortfunken fangen'],
  ['library-sorter', 'Bücherregal sortieren'],
  ['verb-assembler', 'Verbsteine ordnen'],
  ['text-input', 'Texteingabe'],
];

const importActionLabels: Record<ImportPreviewRow['action'], string> = {
  create: 'Neu',
  link: 'Verknüpfen',
  skip: 'Schon vorhanden',
  error: 'Fehler',
};

const importActionClasses: Record<ImportPreviewRow['action'], string> = {
  create: 'bg-blue-100 text-blue-950',
  link: 'bg-amber-100 text-amber-900',
  skip: 'bg-stone-200 text-stone-600',
  error: 'bg-red-100 text-red-800',
};

const adminTabs: { id: AdminTab; label: string; icon: typeof Users }[] = [
  { id: 'users', label: 'Benutzer', icon: Users },
  { id: 'rewards', label: 'Belohnungen', icon: Gift },
  { id: 'levels', label: 'Level', icon: BookOpen },
  { id: 'import', label: 'Wörter & Import', icon: FileText },
  { id: 'progress', label: 'Fortschritt', icon: LineChart },
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [csv, setCsv] = useState('');
  const [result, setResult] = useState('');
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [userId, setUserId] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [content, setContent] = useState<{ quests: AdminQuest[]; words: AdminWord[] } | null>(null);
  const [contentError, setContentError] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userForm, setUserForm] = useState<UserForm>(emptyUserForm);
  const [userDrafts, setUserDrafts] = useState<Record<number, UserDraft>>({});
  const [userResult, setUserResult] = useState('');
  const [rewards, setRewards] = useState<AdminReward[]>([]);
  const [rewardClaims, setRewardClaims] = useState<RewardClaim[]>([]);
  const [rewardDrafts, setRewardDrafts] = useState<Record<number, RewardDraft>>({});
  const [rewardForm, setRewardForm] = useState<RewardDraft>(emptyRewardDraft);
  const [rewardResult, setRewardResult] = useState('');
  const [wordForm, setWordForm] = useState<WordForm>(emptyWordForm);
  const [wordDrafts, setWordDrafts] = useState<Record<number, WordForm>>({});
  const [wordResult, setWordResult] = useState('');
  const [questDrafts, setQuestDrafts] = useState<Record<number, Partial<AdminQuest>>>({});
  const [selectedWords, setSelectedWords] = useState<Record<number, string>>({});
  const readyQuestCount = content?.quests.filter(quest => quest.words.length > 0).length ?? 0;
  const totalQuestCount = content?.quests.length ?? 0;
  const wordBankCount = content?.words.length ?? 0;
  const openRewardClaims = rewardClaims.filter(claim => claim.status === 'requested').length;

  const loadContent = async () => {
    const response = await fetch('/api/admin/content', { credentials: 'include' });
    if (!response.ok) {
      setContentError('Der Content-Bereich ist für Eltern/Admins vorgesehen.');
      return;
    }
    const data = await response.json();
    setContent(data);
    setWordDrafts(Object.fromEntries(data.words.map((word: AdminWord) => [word.id, {
      german: word.german,
      english: word.english,
      type: word.type,
      category: word.category ?? '',
      past: word.past ?? '',
      participle: word.participle ?? '',
    }])));
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

  const toRewardDraft = (reward: AdminReward): RewardDraft => ({
    title: reward.title,
    description: reward.description ?? '',
    cost: String(reward.cost),
    icon: reward.icon || '🎁',
    kind: reward.kind ?? 'real',
    unlockType: reward.unlockType ?? 'coins',
    questId: reward.questId ? String(reward.questId) : '',
    active: reward.active === 1,
    sortOrder: String(reward.sortOrder ?? 0),
    requiresApproval: reward.requiresApproval !== 0,
    visibility: reward.visibility ?? 'visible',
    parentNote: reward.parentNote ?? '',
  });

  const loadRewards = async () => {
    const response = await fetch('/api/admin/rewards', { credentials: 'include' });
    if (!response.ok) {
      setContentError('Der Belohnungsschrank ist für Eltern/Admins vorgesehen.');
      return;
    }
    const data = await response.json();
    setRewards(data.rewards);
    setRewardClaims(data.claims);
    setRewardDrafts(Object.fromEntries(data.rewards.map((reward: AdminReward) => [reward.id, toRewardDraft(reward)])));
    setContentError('');
  };

  useEffect(() => {
    loadContent();
    loadUsers();
    loadRewards();
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

  const updateRewardForm = <K extends keyof RewardDraft>(field: K, value: RewardDraft[K]) => {
    setRewardForm(current => ({
      ...current,
      [field]: value,
      ...(field === 'unlockType' && value === 'coins' ? { questId: '' } : {}),
      ...(field === 'kind' && value === 'game' ? { requiresApproval: false } : {}),
    }));
  };

  const createReward = async () => {
    setRewardResult('');
    const response = await fetch('/api/admin/rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(rewardForm),
    });
    const data = await response.json();
    if (!response.ok) {
      setRewardResult(data.error ?? 'Belohnung konnte nicht angelegt werden.');
      return;
    }
    setRewardResult(`${data.title} wurde in den Schrank gestellt.`);
    setRewardForm(emptyRewardDraft);
    await loadRewards();
  };

  const updateRewardDraft = <K extends keyof RewardDraft>(rewardId: number, field: K, value: RewardDraft[K]) => {
    setRewardDrafts(current => ({
      ...current,
      [rewardId]: {
        ...current[rewardId],
        [field]: value,
        ...(field === 'unlockType' && value === 'coins' ? { questId: '' } : {}),
        ...(field === 'kind' && value === 'game' ? { requiresApproval: false } : {}),
      },
    }));
  };

  const saveReward = async (rewardId: number) => {
    setRewardResult('');
    const response = await fetch(`/api/admin/rewards/${rewardId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(rewardDrafts[rewardId]),
    });
    const data = await response.json();
    if (!response.ok) {
      setRewardResult(data.error ?? 'Belohnung konnte nicht gespeichert werden.');
      return;
    }
    setRewardResult(`${data.title} wurde gespeichert.`);
    await loadRewards();
  };

  const updateClaimStatus = async (claimId: number, status: RewardClaimStatus) => {
    await fetch(`/api/admin/reward-claims/${claimId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    await loadRewards();
  };

  const updateWordForm = <K extends keyof WordForm>(field: K, value: WordForm[K]) => {
    setWordForm(current => ({
      ...current,
      [field]: value,
      ...(field === 'type' && value === 'vocab' ? { past: '', participle: '' } : {}),
    }));
  };

  const updateWordDraft = <K extends keyof WordForm>(wordId: number, field: K, value: WordForm[K]) => {
    setWordDrafts(current => ({
      ...current,
      [wordId]: {
        ...current[wordId],
        [field]: value,
        ...(field === 'type' && value === 'vocab' ? { past: '', participle: '' } : {}),
      },
    }));
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

  const saveWord = async (wordId: number) => {
    setWordResult('');
    const response = await fetch(`/api/admin/words/${wordId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(wordDrafts[wordId]),
    });
    const data = await response.json();
    if (!response.ok) {
      setWordResult(data.error ?? 'Wort konnte nicht gespeichert werden.');
      return;
    }
    setWordResult(`${data.german} / ${data.english} wurde gespeichert.`);
    await loadContent();
  };

  const deleteWord = async (wordId: number) => {
    setWordResult('');
    const word = content?.words.find(item => item.id === wordId);
    const response = await fetch(`/api/admin/words/${wordId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      const data = await response.json();
      setWordResult(data.error ?? 'Wort konnte nicht gelöscht werden.');
      return;
    }
    setWordResult(`${word?.german ?? 'Das Wort'} wurde aus der Wortbank entfernt.`);
    await loadContent();
  };

  const previewImport = async () => {
    setResult('');
    setImportPreview(null);
    const res = await fetch('/api/admin/words/import-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ csv }),
    });
    const data = await res.json();
    if (!res.ok) {
      setResult(data.error ?? 'CSV konnte nicht gelesen werden.');
      return;
    }
    setImportPreview(data);
    setResult(data.summary.errors > 0 ? 'Bitte Fehler prüfen und danach erneut importieren.' : 'Vorschau ist bereit.');
  };

  const importWords = async () => {
    setResult('');
    const res = await fetch('/api/admin/words/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ csv }),
    });
    const data = await res.json();
    if (!res.ok) {
      setImportPreview(data.preview ?? importPreview);
      setResult(data.error ?? 'CSV konnte nicht importiert werden.');
      return;
    }
    setResult(`${data.imported ?? 0} Wörter importiert, ${data.linked ?? 0} Level-Zuordnungen erstellt, ${data.skipped ?? 0} Duplikate übersprungen.`);
    setImportPreview(data.preview ?? null);
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

      <section className="parchment mb-5 rounded-[28px] border border-amber-100/70 p-4">
        <div className="mb-3 grid gap-2 text-center text-xs font-black text-blue-950/70 sm:grid-cols-4">
          <div className="rounded-xl bg-white/60 px-3 py-2">{users.length} Zugänge</div>
          <div className="rounded-xl bg-white/60 px-3 py-2">{readyQuestCount}/{totalQuestCount} Level befüllt</div>
          <div className="rounded-xl bg-white/60 px-3 py-2">{wordBankCount} Wörter</div>
          <div className="rounded-xl bg-white/60 px-3 py-2">{openRewardClaims} offene Anfragen</div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {adminTabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition active:scale-[0.98] ${active ? 'bg-blue-950 text-amber-50 shadow-lg shadow-blue-950/15' : 'bg-white/65 text-blue-950 hover:bg-white'}`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className={`${activeTab === 'users' ? '' : 'hidden'} parchment mb-5 rounded-[28px] border border-amber-100/70 p-5`}>
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

      <section className={`${activeTab === 'rewards' ? '' : 'hidden'} parchment mb-5 rounded-[28px] border border-amber-100/70 p-5`}>
        <div className="mb-4 flex items-center gap-3">
          <Gift className="h-6 w-6 text-blue-950" />
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-950/60">Belohnungsschrank</div>
            <h2 className="text-2xl font-black text-slate-950">Fächer befüllen</h2>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <div className="grid gap-3 lg:grid-cols-2">
            {rewards.map(reward => {
              const draft = rewardDrafts[reward.id] ?? toRewardDraft(reward);
              return (
                <div key={reward.id} className={`rounded-2xl border border-amber-900/10 bg-white/60 p-4 ${draft.active ? '' : 'opacity-65'}`}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-950 text-xl text-amber-100">{draft.icon}</div>
                      <div>
                        <div className="text-xs font-black uppercase tracking-[0.16em] text-blue-950/50">Fach {reward.id}</div>
                        <div className="font-black text-slate-950">{reward.title}</div>
                      </div>
                    </div>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-blue-950">
                      {draft.active ? 'Aktiv' : 'Aus'}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label>
                      <span className={labelClass}>Titel</span>
                      <input className={inputClass} value={draft.title} onChange={event => updateRewardDraft(reward.id, 'title', event.target.value)} />
                    </label>
                    <label>
                      <span className={labelClass}>Symbol</span>
                      <input className={inputClass} value={draft.icon} onChange={event => updateRewardDraft(reward.id, 'icon', event.target.value)} />
                    </label>
                    <label>
                      <span className={labelClass}>Typ</span>
                      <select className={inputClass} value={draft.kind} onChange={event => updateRewardDraft(reward.id, 'kind', event.target.value as RewardKind)}>
                        <option value="real">Echte Belohnung</option>
                        <option value="game">Spiel-Belohnung</option>
                      </select>
                    </label>
                    <label>
                      <span className={labelClass}>Freischaltung</span>
                      <select className={inputClass} value={draft.unlockType} onChange={event => updateRewardDraft(reward.id, 'unlockType', event.target.value as RewardUnlockType)}>
                        <option value="coins">Wortfunken</option>
                        <option value="quest">Levelabschluss</option>
                        <option value="final">Finallevel</option>
                      </select>
                    </label>
                    <label>
                      <span className={labelClass}>Kosten</span>
                      <input className={inputClass} type="number" min={0} value={draft.cost} onChange={event => updateRewardDraft(reward.id, 'cost', event.target.value)} />
                    </label>
                    <label>
                      <span className={labelClass}>Sortierung</span>
                      <input className={inputClass} type="number" value={draft.sortOrder} onChange={event => updateRewardDraft(reward.id, 'sortOrder', event.target.value)} />
                    </label>
                    <label>
                      <span className={labelClass}>Sichtbarkeit</span>
                      <select className={inputClass} value={draft.visibility} onChange={event => updateRewardDraft(reward.id, 'visibility', event.target.value as RewardVisibility)}>
                        <option value="visible">Immer sichtbar</option>
                        <option value="unlocked">Erst freigeschaltet</option>
                      </select>
                    </label>
                    {draft.unlockType !== 'coins' && (
                      <label className="sm:col-span-2">
                        <span className={labelClass}>Verbundenes Level</span>
                        <select className={inputClass} value={draft.questId} onChange={event => updateRewardDraft(reward.id, 'questId', event.target.value)}>
                          <option value="">Level wählen</option>
                          {(content?.quests ?? []).map(quest => <option key={quest.id} value={quest.id}>{quest.id}. {quest.title}</option>)}
                        </select>
                      </label>
                    )}
                  </div>

                  <label className="mt-3 block">
                    <span className={labelClass}>Beschreibung</span>
                    <textarea className={`${inputClass} min-h-20`} value={draft.description} onChange={event => updateRewardDraft(reward.id, 'description', event.target.value)} />
                  </label>

                  <label className="mt-3 block">
                    <span className={labelClass}>Elternnotiz</span>
                    <textarea className={`${inputClass} min-h-16`} value={draft.parentNote} onChange={event => updateRewardDraft(reward.id, 'parentNote', event.target.value)} />
                  </label>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-3">
                      <label className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-blue-950/60">
                        <input type="checkbox" checked={draft.active} onChange={event => updateRewardDraft(reward.id, 'active', event.target.checked)} />
                        Aktiv
                      </label>
                      <label className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-blue-950/60">
                        <input type="checkbox" checked={draft.requiresApproval} onChange={event => updateRewardDraft(reward.id, 'requiresApproval', event.target.checked)} />
                        Elternfreigabe
                      </label>
                    </div>
                    <button onClick={() => saveReward(reward.id)} className="gold-button px-4 py-2">
                      <Save className="h-4 w-4" />
                      Speichern
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid content-start gap-4">
            <div className="rounded-2xl border border-amber-900/10 bg-white/60 p-4">
              <div className="mb-4 flex items-center gap-3">
                <PlusCircle className="h-6 w-6 text-blue-950" />
                <h3 className="text-xl font-black text-slate-950">Neues Fach</h3>
              </div>
              <div className="grid gap-3">
                <label>
                  <span className={labelClass}>Titel</span>
                  <input className={inputClass} value={rewardForm.title} onChange={event => updateRewardForm('title', event.target.value)} />
                </label>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <label>
                    <span className={labelClass}>Symbol</span>
                    <input className={inputClass} value={rewardForm.icon} onChange={event => updateRewardForm('icon', event.target.value)} />
                  </label>
                  <label>
                    <span className={labelClass}>Kosten</span>
                    <input className={inputClass} type="number" min={0} value={rewardForm.cost} onChange={event => updateRewardForm('cost', event.target.value)} />
                  </label>
                </div>
                <label>
                  <span className={labelClass}>Typ</span>
                  <select className={inputClass} value={rewardForm.kind} onChange={event => updateRewardForm('kind', event.target.value as RewardKind)}>
                    <option value="real">Echte Belohnung</option>
                    <option value="game">Spiel-Belohnung</option>
                  </select>
                </label>
                <label>
                  <span className={labelClass}>Freischaltung</span>
                  <select className={inputClass} value={rewardForm.unlockType} onChange={event => updateRewardForm('unlockType', event.target.value as RewardUnlockType)}>
                    <option value="coins">Wortfunken</option>
                    <option value="quest">Levelabschluss</option>
                    <option value="final">Finallevel</option>
                  </select>
                </label>
                <label>
                  <span className={labelClass}>Sichtbarkeit</span>
                  <select className={inputClass} value={rewardForm.visibility} onChange={event => updateRewardForm('visibility', event.target.value as RewardVisibility)}>
                    <option value="visible">Immer sichtbar</option>
                    <option value="unlocked">Erst freigeschaltet</option>
                  </select>
                </label>
                {rewardForm.unlockType !== 'coins' && (
                  <label>
                    <span className={labelClass}>Verbundenes Level</span>
                    <select className={inputClass} value={rewardForm.questId} onChange={event => updateRewardForm('questId', event.target.value)}>
                      <option value="">Level wählen</option>
                      {(content?.quests ?? []).map(quest => <option key={quest.id} value={quest.id}>{quest.id}. {quest.title}</option>)}
                    </select>
                  </label>
                )}
                <label>
                  <span className={labelClass}>Beschreibung</span>
                  <textarea className={`${inputClass} min-h-24`} value={rewardForm.description} onChange={event => updateRewardForm('description', event.target.value)} />
                </label>
                <label>
                  <span className={labelClass}>Elternnotiz</span>
                  <textarea className={`${inputClass} min-h-20`} value={rewardForm.parentNote} onChange={event => updateRewardForm('parentNote', event.target.value)} />
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-blue-950/60">
                  <input type="checkbox" checked={rewardForm.requiresApproval} onChange={event => updateRewardForm('requiresApproval', event.target.checked)} />
                  Elternfreigabe nötig
                </label>
              </div>
              <button onClick={createReward} className="magic-button mt-3 w-full">
                <Gift className="h-4 w-4" />
                Fach befüllen
              </button>
              {rewardResult && <p className="mt-2 text-sm font-black text-blue-800">{rewardResult}</p>}
            </div>

            <div className="rounded-2xl border border-amber-900/10 bg-white/60 p-4">
              <div className="mb-4 flex items-center gap-3">
                <PackageCheck className="h-6 w-6 text-blue-950" />
                <h3 className="text-xl font-black text-slate-950">Anfragen</h3>
              </div>
              <div className="grid gap-2">
                {rewardClaims.length > 0 ? rewardClaims.map(claim => (
                  <div key={claim.id} className="rounded-xl bg-white/70 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-black text-slate-950">{claim.icon} {claim.rewardTitle}</div>
                        <div className="text-xs font-bold text-stone-500">{claim.userName} · {claimStatusLabels[claim.status]}</div>
                        {claim.parentNote && <div className="mt-1 text-xs font-bold text-blue-950/60">{claim.parentNote}</div>}
                      </div>
                      <select
                        className="rounded-lg border border-amber-900/15 bg-white px-2 py-1 text-xs font-bold"
                        value={claim.status}
                        onChange={event => updateClaimStatus(claim.id, event.target.value as RewardClaimStatus)}
                      >
                        <option value="requested">Offen</option>
                        <option value="approved">Liegt bereit</option>
                        <option value="claimed">Im Spiel erhalten</option>
                        <option value="fulfilled">Ausgegeben</option>
                        <option value="cancelled">Später</option>
                      </select>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-xl bg-white/70 p-3 text-sm font-bold text-stone-600">Noch keine Anfragen.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className={activeTab === 'levels' || activeTab === 'import' || activeTab === 'progress' ? 'grid gap-5' : 'hidden'}>
        <section className={`${activeTab === 'levels' ? '' : 'hidden'} parchment rounded-[28px] border border-amber-100/70 p-5`}>
          <div className="mb-4 flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-blue-950" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-950/60">Levelstruktur</div>
              <h2 className="text-2xl font-black text-slate-950">Kartenorte befüllen</h2>
            </div>
            <div className="hidden rounded-2xl bg-blue-950/5 px-4 py-2 text-right text-xs font-black text-blue-950/65 sm:block">
              <div>{readyQuestCount}/{totalQuestCount} Level befüllt</div>
              <div>{wordBankCount} Wörter in der Bank</div>
            </div>
          </div>

          <div className="grid gap-4">
            {(content?.quests ?? []).map(quest => {
              const draft = questDrafts[quest.id] ?? quest;
              const availableWords = (content?.words ?? []).filter(word => !quest.words.includes(word.id));
              return (
                <div key={quest.id} className="rounded-2xl border border-amber-900/10 bg-white/60 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-black uppercase tracking-[0.14em] text-blue-950/55">
                      {quest.wordItems.length} Inhalt{quest.wordItems.length === 1 ? '' : 'e'} · {gameTypes.find(([value]) => value === (draft.gameType ?? quest.gameType))?.[1] ?? 'Spieltyp'}
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${quest.wordItems.length > 0 ? 'bg-blue-100 text-blue-950' : 'bg-amber-100 text-amber-900'}`}>
                      {quest.wordItems.length > 0 ? 'Bereit' : 'Zu befüllen'}
                    </span>
                  </div>
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

        <aside className={activeTab === 'import' || activeTab === 'progress' ? 'grid content-start gap-5' : 'hidden'}>
          <section className={`${activeTab === 'import' ? '' : 'hidden'} parchment rounded-[28px] border border-amber-100/70 p-5`}>
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

          <section className={`${activeTab === 'import' ? '' : 'hidden'} parchment rounded-[28px] border border-amber-100/70 p-5`}>
            <div className="mb-4 flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-950" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-950/60">Mit Vorschau</div>
                <h2 className="text-xl font-black text-slate-950">CSV-Import</h2>
              </div>
              <a
                href="/templates/wordwick-content-template.csv"
                download
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-950 text-amber-50 transition hover:bg-blue-800"
                title="CSV-Vorlage herunterladen"
              >
                <Download className="h-4 w-4" />
              </a>
            </div>
            <p className="mb-2 text-xs font-bold text-stone-500">Spalten: deutsch, englisch, typ, kategorie, past, participle, level</p>
            <textarea
              value={csv}
              onChange={event => {
                setCsv(event.target.value);
                setImportPreview(null);
              }}
              rows={7}
              className="w-full rounded-xl border border-amber-900/15 bg-white/70 px-3 py-2 font-mono text-sm outline-none ring-blue-800/25 focus:ring-4"
              placeholder={`deutsch,englisch,typ,kategorie,past,participle,level
Hund,dog,vocab,animals,,,1
gehen,go,irregular,verbs,went,gone,3`}
            />
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button onClick={previewImport} className="magic-button w-full">
                <Search className="h-4 w-4" />
                Vorschau prüfen
              </button>
              <button
                onClick={importWords}
                disabled={!importPreview || importPreview.summary.errors > 0 || importPreview.summary.valid === 0}
                className="gold-button w-full disabled:cursor-not-allowed disabled:opacity-45"
              >
                <UploadCloud className="h-4 w-4" />
                Import übernehmen
              </button>
            </div>
            {result && <p className="mt-2 text-sm font-black text-blue-800">{result}</p>}

            {importPreview && (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-black sm:grid-cols-6">
                  <div className="rounded-xl bg-white/70 p-2">
                    <div className="text-lg text-slate-950">{importPreview.summary.total}</div>
                    <div className="uppercase tracking-[0.1em] text-stone-500">Zeilen</div>
                  </div>
                  <div className="rounded-xl bg-blue-100 p-2 text-blue-950">
                    <div className="text-lg">{importPreview.summary.creates}</div>
                    <div className="uppercase tracking-[0.1em]">Neu</div>
                  </div>
                  <div className="rounded-xl bg-amber-100 p-2 text-amber-900">
                    <div className="text-lg">{importPreview.summary.links}</div>
                    <div className="uppercase tracking-[0.1em]">Level</div>
                  </div>
                  <div className="rounded-xl bg-stone-200 p-2 text-stone-600">
                    <div className="text-lg">{importPreview.summary.skips}</div>
                    <div className="uppercase tracking-[0.1em]">Doppelt</div>
                  </div>
                  <div className="rounded-xl bg-red-100 p-2 text-red-800">
                    <div className="text-lg">{importPreview.summary.errors}</div>
                    <div className="uppercase tracking-[0.1em]">Fehler</div>
                  </div>
                  <div className="rounded-xl bg-white/70 p-2">
                    <div className="text-lg text-slate-950">{importPreview.summary.valid}</div>
                    <div className="uppercase tracking-[0.1em] text-stone-500">Gültig</div>
                  </div>
                </div>

                {importPreview.parseErrors.length > 0 && (
                  <div className="rounded-2xl bg-red-100 p-3 text-xs font-bold text-red-800">
                    {importPreview.parseErrors.map(error => <div key={error}>{error}</div>)}
                  </div>
                )}

                <div className="max-h-72 space-y-2 overflow-auto pr-1">
                  {importPreview.rows.map(row => (
                    <div key={`${row.rowNumber}-${row.german}-${row.english}`} className="rounded-2xl border border-amber-900/10 bg-white/65 p-3">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-black uppercase tracking-[0.14em] text-blue-950/50">Zeile {row.rowNumber}</div>
                          <div className="truncate text-sm font-black text-slate-950">
                            {row.german || '?'} / {row.english || '?'}
                          </div>
                        </div>
                        <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${importActionClasses[row.action]}`}>
                          {importActionLabels[row.action]}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-stone-600">
                        {row.type === 'irregular' ? `Verb: ${row.english} / ${row.past || '?'} / ${row.participle || '?'}` : `Vokabel · ${row.category || 'ohne Kategorie'}`}
                        {row.level && <span> · Level {row.level}{row.questTitle ? `: ${row.questTitle}` : ''}</span>}
                      </div>
                      {row.errors.length > 0 && (
                        <div className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-800">
                          {row.errors.join(' · ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className={`${activeTab === 'import' ? '' : 'hidden'} parchment rounded-[28px] border border-amber-100/70 p-5`}>
            <div className="mb-4 flex items-center gap-3">
              <Database className="h-6 w-6 text-blue-950" />
              <div>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-950/60">{wordBankCount} Einträge</div>
                <h2 className="text-xl font-black text-slate-950">Wortbank bearbeiten</h2>
              </div>
            </div>
            <div className="max-h-[30rem] space-y-3 overflow-auto pr-1">
              {(content?.words ?? []).map(word => {
                const draft = wordDrafts[word.id] ?? {
                  german: word.german,
                  english: word.english,
                  type: word.type,
                  category: word.category ?? '',
                  past: word.past ?? '',
                  participle: word.participle ?? '',
                };
                const usedInQuests = content?.quests
                  .filter(quest => quest.words.includes(word.id))
                  .map(quest => quest.id)
                  .join(', ');
                return (
                  <div key={word.id} className="rounded-2xl border border-amber-900/10 bg-white/60 p-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-blue-950">
                        {draft.type === 'irregular' ? 'Verb' : 'Vokabel'}
                      </span>
                      {usedInQuests && (
                        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-stone-500">
                          Level {usedInQuests}
                        </span>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                        <label>
                          <span className={labelClass}>Deutsch</span>
                          <input className={inputClass} value={draft.german} onChange={event => updateWordDraft(word.id, 'german', event.target.value)} />
                        </label>
                        <label>
                          <span className={labelClass}>Englisch</span>
                          <input className={inputClass} value={draft.english} onChange={event => updateWordDraft(word.id, 'english', event.target.value)} />
                        </label>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                        <label>
                          <span className={labelClass}>Typ</span>
                          <select className={inputClass} value={draft.type} onChange={event => updateWordDraft(word.id, 'type', event.target.value as WordForm['type'])}>
                            <option value="vocab">Vokabel</option>
                            <option value="irregular">Unregelmäßiges Verb</option>
                          </select>
                        </label>
                        <label>
                          <span className={labelClass}>Kategorie</span>
                          <input className={inputClass} value={draft.category} onChange={event => updateWordDraft(word.id, 'category', event.target.value)} />
                        </label>
                      </div>
                      {draft.type === 'irregular' && (
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                          <label>
                            <span className={labelClass}>Past Simple</span>
                            <input className={inputClass} value={draft.past} onChange={event => updateWordDraft(word.id, 'past', event.target.value)} />
                          </label>
                          <label>
                            <span className={labelClass}>Past Participle</span>
                            <input className={inputClass} value={draft.participle} onChange={event => updateWordDraft(word.id, 'participle', event.target.value)} />
                          </label>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button onClick={() => saveWord(word.id)} className="gold-button px-3 py-2">
                        <Save className="h-4 w-4" />
                        Speichern
                      </button>
                      <button
                        onClick={() => deleteWord(word.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-100 px-3 py-2 text-sm font-black text-red-800 transition hover:bg-red-200 active:scale-[0.98]"
                      >
                        <Trash2 className="h-4 w-4" />
                        Löschen
                      </button>
                    </div>
                  </div>
                );
              })}
              {(content?.words ?? []).length === 0 && (
                <div className="rounded-xl bg-white/60 px-3 py-2 text-sm font-bold text-stone-600">
                  Noch keine Wörter angelegt.
                </div>
              )}
            </div>
          </section>

          <section className={`${activeTab === 'progress' ? '' : 'hidden'} parchment rounded-[28px] border border-amber-100/70 p-5`}>
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
