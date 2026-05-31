import { useState, useEffect, createContext, useContext } from 'react';
import { Link, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, LogOut, Sparkles, UserRound } from 'lucide-react';
import WordwickLogo from './components/WordwickLogo';
import Login from './pages/Login';
import WorldMap from './pages/WorldMap';
import Quest from './pages/Quest';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import StoryScene from './pages/StoryScene';

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

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const isMapView = location.pathname === '/';

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
      <div className="min-h-screen academy-shell text-stone-950">
        {user && (
          <header className="sticky top-0 z-50 border-b border-blue-100/20 bg-blue-950/95 px-4 py-3 text-amber-50 shadow-lg shadow-slate-950/20 backdrop-blur-md">
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
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user && (user.role === 'parent' || user.role === 'admin') ? <Admin /> : <Navigate to="/" />} />
        </Routes>
      </div>
    </AuthContext.Provider>
  );
}

export default App;
