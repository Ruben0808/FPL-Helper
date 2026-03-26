import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useFPL } from '../context/FPLContext';

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/my-team', label: 'My Team' },
  { path: '/players', label: 'Players' },
  { path: '/fixtures', label: 'Fixtures' },
  { path: '/transfers', label: 'Transfers' },
  { path: '/captain', label: 'Captain' },
  { path: '/prices', label: 'Prices' },
  { path: '/wildcard', label: 'Wildcard' },
];

export default function Navbar() {
  const location = useLocation();
  const { userTeam } = useFPL();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-fpl-purple shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-2xl">⚽</span>
            <span className="text-fpl-green font-black text-xl tracking-tight group-hover:brightness-90 transition-all">
              FPL <span className="text-white font-light">Helper</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === link.path
                    ? 'bg-fpl-green text-fpl-purple font-bold'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Team badge */}
          <div className="hidden md:flex items-center gap-3">
            {userTeam ? (
              <div className="flex items-center gap-2 bg-fpl-green/20 border border-fpl-green/40 rounded-lg px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-fpl-green animate-pulse" />
                <span className="text-fpl-green text-sm font-medium truncate max-w-[140px]">
                  {userTeam.entry.name}
                </span>
              </div>
            ) : (
              <Link
                to="/"
                className="text-sm text-gray-400 hover:text-fpl-green transition-colors"
              >
                Load your team →
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-white p-2 rounded-lg hover:bg-white/10"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <div className="w-5 h-0.5 bg-current mb-1" />
            <div className="w-5 h-0.5 bg-current mb-1" />
            <div className="w-5 h-0.5 bg-current" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-fpl-dark-bg border-t border-white/10">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMenuOpen(false)}
              className={`block px-4 py-3 text-sm font-medium border-b border-white/5 ${
                location.pathname === link.path
                  ? 'text-fpl-green bg-fpl-green/10'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
