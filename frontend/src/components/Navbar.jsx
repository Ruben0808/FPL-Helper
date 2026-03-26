import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useFPL } from '../context/FPLContext';
import { getLogoutUrl } from '../services/api';

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
  const { userTeam, googleUser } = useFPL();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-fpl-purple shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <span className="text-2xl">⚽</span>
            <span className="text-fpl-green font-black text-xl tracking-tight group-hover:brightness-90 transition-all">
              FPL <span className="text-white font-light">Helper</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === link.path
                    ? 'bg-fpl-green text-fpl-purple font-bold'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Team badge + Google user — desktop only */}
          <div className="hidden lg:flex items-center gap-3">
            {userTeam && (
              <div className="flex items-center gap-2 bg-fpl-green/20 border border-fpl-green/40 rounded-lg px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-fpl-green animate-pulse" />
                <span className="text-fpl-green text-sm font-medium truncate max-w-[140px]">
                  {userTeam.entry.name}
                </span>
              </div>
            )}
            {googleUser ? (
              <div className="flex items-center gap-2">
                {googleUser.picture ? (
                  <img src={googleUser.picture} alt="" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-fpl-green flex items-center justify-center">
                    <span className="text-fpl-purple font-black text-xs">{googleUser.name?.[0]}</span>
                  </div>
                )}
                <a href={getLogoutUrl()} className="text-xs text-gray-400 hover:text-white transition-colors">
                  Sign out
                </a>
              </div>
            ) : (
              !userTeam && (
                <Link to="/" className="text-sm text-gray-400 hover:text-fpl-green transition-colors">
                  Load your team →
                </Link>
              )
            )}
          </div>

          {/* Mobile: team indicator + hamburger */}
          <div className="lg:hidden flex items-center gap-3">
            {userTeam && (
              <span className="w-2 h-2 rounded-full bg-fpl-green animate-pulse" />
            )}
            <button
              className="text-white p-2 rounded-lg hover:bg-white/10 active:bg-white/20"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu — scrollable if needed */}
      {menuOpen && (
        <div className="lg:hidden bg-fpl-dark-bg border-t border-white/10 max-h-[80vh] overflow-y-auto">
          {userTeam && (
            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-fpl-green" />
              <span className="text-fpl-green text-sm font-medium truncate">{userTeam.entry.name}</span>
            </div>
          )}
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center px-4 py-4 text-base font-medium border-b border-white/5 active:bg-white/10 ${
                location.pathname === link.path
                  ? 'text-fpl-green bg-fpl-green/10'
                  : 'text-gray-300'
              }`}
            >
              {link.label}
              {location.pathname === link.path && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-fpl-green" />
              )}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
