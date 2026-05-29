import { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import WorldMap from './pages/WorldMap';
import Quest from './pages/Quest';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

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
  const navigate = useNavigate();

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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>;

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      <div className="min-h-screen bg-gradient-to-b from-sky-100 to-emerald-50">
        {user && (
          <header className="flex items-center justify-between px-4 py-2 bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-800 rounded-lg flex items-center justify-center text-amber-100 font-bold text-sm">WA</div>
              <span className="font-bold text-slate-700">{user.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-amber-500">
                <span className="text-lg">🪙</span>
                <span className="font-bold">{user.coins}</span>
              </div>
              <div className="flex items-center gap-1 text-orange-500">
                <span className="text-lg">🔥</span>
                <span className="font-bold">{user.streak}</span>
              </div>
              <button onClick={logout} className="text-xs text-slate-400 hover:text-slate-600">Logout</button>
            </div>
          </header>
        )}
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/" element={user ? <WorldMap /> : <Navigate to="/login" />} />
          <Route path="/quest/:id" element={user ? <Quest /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user ? <Admin /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </AuthContext.Provider>
  );
}

export default App;
