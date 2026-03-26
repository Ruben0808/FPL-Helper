import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FPLProvider } from './context/FPLContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import MyTeam from './pages/MyTeam';
import PlayerScout from './pages/PlayerScout';
import FixtureTicker from './pages/FixtureTicker';
import Transfers from './pages/Transfers';
import CaptainPicker from './pages/CaptainPicker';
import PriceChanges from './pages/PriceChanges';
import WildcardBuilder from './pages/WildcardBuilder';
import { useFPL } from './context/FPLContext';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-fpl-purple flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-fpl-green/30 border-t-fpl-green rounded-full animate-spin mx-auto mb-6" />
        <h1 className="text-fpl-green text-2xl font-black mb-2">FPL Helper</h1>
        <p className="text-gray-400 text-sm">Loading live data from Fantasy Premier League…</p>
      </div>
    </div>
  );
}

function ErrorScreen({ message }) {
  return (
    <div className="min-h-screen bg-fpl-purple flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl mb-4">⚠️</p>
        <h1 className="text-fpl-green text-2xl font-black mb-3">Connection Error</h1>
        <p className="text-gray-300 text-sm mb-4">{message}</p>
        <div className="bg-white/10 rounded-lg p-4 text-left text-xs text-gray-400">
          <p className="font-medium text-gray-300 mb-2">Make sure the backend is running:</p>
          <code className="text-fpl-green">cd backend && npm install && npm run dev</code>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 btn-primary"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function AppContent() {
  const { loading, error } = useFPL();

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/my-team" element={<MyTeam />} />
        <Route path="/players" element={<PlayerScout />} />
        <Route path="/fixtures" element={<FixtureTicker />} />
        <Route path="/transfers" element={<Transfers />} />
        <Route path="/captain" element={<CaptainPicker />} />
        <Route path="/prices" element={<PriceChanges />} />
        <Route path="/wildcard" element={<WildcardBuilder />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <FPLProvider>
        <AppContent />
      </FPLProvider>
    </BrowserRouter>
  );
}
