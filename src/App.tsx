import { useState, useEffect, createContext, useContext } from 'react';
import { Link, NavLink, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { BookMarked, Gift, GraduationCap, House, LogOut, Map as MapIcon, Sparkles, UserRound } from 'lucide-react';
import WordwickLogo from './components/WordwickLogo';
import Login from './pages/Login';
import WorldMap from './pages/WorldMap';
import Quest from './pages/Quest';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import StoryScene from './pages/StoryScene';
import PipHome from './pages/PipHome';
import SparkBook from './pages/SparkBook';
import RewardsCabinet from './pages/RewardsCabinet';

interface User {
  id: number;
  name: string;
  role: 'child' | 'parent' | 'admin';
  coins: number;
  streak: number;
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  login: (name: string, pin: string) => Promise<void>;
  register: (name: string, pin: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);
export const useAuth = () => useContext(AuthContext)!;

const kidNavItems = [
  { to: '/', label: 'Karte', Icon: MapIcon },
  { to: '/pip-home', label: 'Zuhause', Icon: House },
  { to: '/sparkbook', label: 'Funkenbuch', Icon: BookMarked },
  { to: '/rewards', label: 'Schrank', Icon: Gift },
];

function KidQuickNav() {
  return (
    <nav className="fixed inset-x-0 bottom-3 z-50 mx-auto w-[min(94vw,42rem)] rounded-2xl border border-amber-100/25 bg-blue-950/94 p-2 text-amber-50 shadow-2xl shadow-slate-950/35 backdrop-blur-md">
      <div className="grid grid-cols-4 gap-1">
        {kidNavItems.map(item => {
          const Icon = item.Icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-black transition active:scale-[0.98] ${
                isActive ? 'bg-amber-200 text-slate-950' : 'text-amber-100/85 hover:bg-white/10'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="leading-none">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const isMapView = location.pathname === '/';
  const showKidQuickNav = Boolean(user && ['/', '/pip-home', '/sparkbook', '/rewards', '/profile'].includes(location.pathname));

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(u => setUser(u))
      .finally(() => setLoading(false));
  }, []);

  const login = async (name: string, pin: string) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, pin }),
    });
    if (!res.ok) throw new Error('Login fehlgeschlagen');
    const u = await res.json();
    setUser(u);
    navigate('/');
  };

  const register = async (name: string, pin: string) => {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, pin }),
    });
    if (!res.ok) throw new Error('Registrierung fehlgeschlagen');
    const u = await res.json();
    setUser(u);
    navigate('/');
  };

  const logout = () => {
    fetch('/api/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    navigate('/login');
  };

  if (loading) return <div className="min-h-screen academy-shell flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-amber-200 border-t-transparent rounded-full" /></div>;

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      <div className={`min-h-screen academy-shell text-stone-950 ${showKidQuickNav ? 'pb-24' : ''}`}>
        {user && (
          <header className="sticky top-0 z-50 border-b border-blue-100/20 bg-blue-950/95 px-3 py-2 text-amber-50 shadow-lg shadow-slate-950/20 backdrop-blur-md sm:px-4">
            <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3">
              <Link to="/" aria-label="Zur Karte">
                {isMapView ? (
                  <WordwickLogo compact markOnly />
                ) : (
                  <>
                    <WordwickLogo compact className="hidden sm:flex" />
                    <WordwickLogo compact markOnly className="sm:hidden" />
                  </>
                )}
              </Link>
              <div className="flex items-center gap-2">
                <div className="hidden items-center gap-1 rounded-full border border-amber-200/20 bg-white/10 px-3 py-1 text-xs font-bold text-amber-100 sm:flex">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{user.coins}</span>
                </div>
                <div className="hidden rounded-full border border-amber-200/20 bg-white/10 px-3 py-1 text-xs font-bold text-amber-100 sm:block">
                  {user.streak} Tage
                </div>
                <Link to="/profile" className="icon-button tooltip-button" aria-label="Profil" data-tooltip="Profil">
                  <UserRound className="h-4 w-4" />
                </Link>
                {(user.role === 'parent' || user.role === 'admin') && (
                  <Link to="/admin" className="icon-button tooltip-button" aria-label="Akademieleitung" data-tooltip="Akademieleitung">
                    <GraduationCap className="h-4 w-4" />
                  </Link>
                )}
                <button onClick={logout} className="icon-button tooltip-button" aria-label="Abmelden" data-tooltip="Abmelden">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </header>
        )}
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/" element={user ? <WorldMap /> : <Navigate to="/login" />} />
          <Route path="/quest/:id" element={user ? <Quest /> : <Navigate to="/login" />} />
          <Route path="/story/:id" element={user ? <StoryScene /> : <Navigate to="/login" />} />
          <Route path="/pip-home" element={user ? <PipHome /> : <Navigate to="/login" />} />
          <Route path="/sparkbook" element={user ? <SparkBook /> : <Navigate to="/login" />} />
          <Route path="/rewards" element={user ? <RewardsCabinet /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user && (user.role === 'parent' || user.role === 'admin') ? <Admin /> : <Navigate to="/" />} />
        </Routes>
        {showKidQuickNav && <KidQuickNav />}
      </div>
    </AuthContext.Provider>
  );
}

export default App;
