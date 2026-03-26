import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFPL } from '../context/FPLContext';
import { loginWithFPL } from '../services/api';

const features = [
  { icon: '📊', title: 'Player Scout', desc: 'Filter all 700+ players by form, price, ownership, fixture difficulty, and value for money.', path: '/players' },
  { icon: '📅', title: 'Fixture Ticker', desc: 'Colour-coded fixture difficulty for every team over the next 8 GWs, with BGW/DGW detection.', path: '/fixtures' },
  { icon: '🔄', title: 'Transfer Planner', desc: 'Ranked transfer suggestions based on form, fixtures, and your available budget.', path: '/transfers' },
  { icon: '🏆', title: 'Captain Picker', desc: "Weekly captain recommendation using FPL's own expected points + form + fixture data.", path: '/captain' },
  { icon: '💸', title: 'Price Changes', desc: 'Track which players have risen or fallen in price — buy before they rise, sell before they fall.', path: '/prices' },
  { icon: '🃏', title: 'Wildcard Builder', desc: 'Generate an optimal 15-man squad within your budget. Lock players, adjust budget, build.', path: '/wildcard' },
];

const URL_EXAMPLE = (
  <div className="mt-1.5 bg-black/40 rounded-lg px-3 py-2 font-mono text-xs text-gray-300 break-all">
    fantasy.premierleague.com/entry/
    <span className="text-fpl-green font-black">1234567</span>
    /event/…
  </div>
);

const SHARE_LINK_EXAMPLE = (
  <div className="mt-1.5 bg-black/40 rounded-lg px-3 py-2 font-mono text-xs text-gray-300 break-all">
    https://fantasy.premierleague.com/entry/
    <span className="text-fpl-green font-black">1234567</span>
    /event/…
  </div>
);

const PLATFORMS = [
  { key: 'app',     label: '📱 Mobile App' },
  { key: 'browser', label: '🌐 Browser' },
];

const APP_STEPS = [
  {
    icon: '👕',
    title: 'Open the FPL app and go to your team',
    desc: 'Tap the "My Team" tab at the bottom of the app.',
  },
  {
    icon: '📤',
    title: 'Tap the Share icon',
    desc: 'Look for the share / export icon in the top-right corner of the app. Tap it.',
  },
  {
    icon: '🔗',
    title: 'Copy the link',
    desc: 'Choose "Copy link" or "Copy URL". The link will look like this:',
    extra: SHARE_LINK_EXAMPLE,
  },
  {
    icon: '🔢',
    title: 'Find the number in the link',
    desc: 'The number between /entry/ and /event/ is your Team ID. Note it down.',
  },
];

const BROWSER_STEPS = [
  {
    icon: '🌐',
    title: 'Open your browser (Safari / Chrome)',
    desc: 'Do not use the FPL app — open your phone or computer browser instead.',
    action: (href) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 mt-1.5 text-xs bg-fpl-green text-fpl-purple font-bold px-3 py-1.5 rounded-lg hover:brightness-90 transition-all"
      >
        Open FPL website ↗
      </a>
    ),
  },
  {
    icon: '🔑',
    title: 'Log in however you normally do',
    desc: 'Google, Apple, email — whatever you use.',
  },
  {
    icon: '👕',
    title: 'Go to "My Team"',
    desc: 'Click or tap "My Team" in the top navigation.',
  },
  {
    icon: '🔗',
    title: 'Look at the address bar',
    desc: 'The URL will contain your Team ID:',
    extra: URL_EXAMPLE,
  },
];

function GuideStep({ number, icon, title, desc, extra, action }) {
  return (
    <div className="flex gap-3 bg-white/5 rounded-xl p-3">
      <div className="w-6 h-6 rounded-full bg-fpl-green text-fpl-purple font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span>{icon}</span>
          <p className="text-white text-xs font-semibold">{title}</p>
        </div>
        <p className="text-gray-400 text-xs leading-relaxed">{desc}</p>
        {extra}
        {action && action('https://fantasy.premierleague.com')}
      </div>
    </div>
  );
}

function GuideContent({ onDone }) {
  const [platform, setPlatform] = useState('app');
  const steps = platform === 'app' ? APP_STEPS : BROWSER_STEPS;

  return (
    <div>
      {/* Platform picker */}
      <div className="flex gap-1 bg-white/10 rounded-lg p-1 mb-3">
        {PLATFORMS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPlatform(p.key)}
            className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
              platform === p.key ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {platform === 'app' && (
        <p className="text-yellow-300/80 text-xs mb-2 flex items-center gap-1">
          <span>💡</span> Works even if you use Google or Apple to log in
        </p>
      )}
      {platform === 'browser' && (
        <p className="text-yellow-300/80 text-xs mb-2 flex items-center gap-1">
          <span>💡</span> Mobile browsers show the URL bar — the app does not
        </p>
      )}

      <div className="space-y-2 mb-3">
        {steps.map((step, i) => (
          <GuideStep key={i} number={i + 1} {...step} />
        ))}
      </div>

      <button
        onClick={onDone}
        className="w-full text-center text-xs bg-fpl-green text-fpl-purple font-bold py-2.5 rounded-xl hover:brightness-90 transition-all"
      >
        ← I have my Team ID, take me back
      </button>
    </div>
  );
}

export default function Home() {
  const [tab, setTab] = useState('id'); // 'id' | 'login'
  const [teamId, setTeamId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const { loadTeam, loading: dataLoading } = useFPL();
  const navigate = useNavigate();

  const handleLoadById = async (e) => {
    e.preventDefault();
    if (!teamId.trim()) return;
    setErr('');
    setLoading(true);
    try {
      await loadTeam(teamId.trim());
      navigate('/my-team');
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFPLLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setErr('');
    setLoading(true);
    try {
      const { entry, first_name, last_name } = await loginWithFPL(email.trim(), password);
      await loadTeam(entry);
      navigate('/my-team');
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Hero */}
      <div className="bg-fpl-purple text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-fpl-green/20 border border-fpl-green/40 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-fpl-green animate-pulse" />
            <span className="text-fpl-green text-sm font-medium">2025/26 Season • Live Data</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-4 leading-tight">
            <span className="text-fpl-green">FPL</span> Helper
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 font-light mb-2">
            Your data-driven Fantasy Premier League assistant
          </p>
          <p className="text-gray-400 max-w-xl mx-auto mb-10">
            Analyse player form, check upcoming fixtures, get smart transfer suggestions,
            captain picks, price change alerts, and wildcard planning — all in one place.
          </p>

          {/* Team import card */}
          <div className="max-w-md mx-auto bg-white/10 border border-white/20 rounded-2xl p-5 backdrop-blur-sm">

            {/* Tab switcher — 3 options */}
            <div className="flex gap-1 bg-white/10 rounded-xl p-1 mb-4">
              {[
                { key: 'id',    label: '🔢 Team ID' },
                { key: 'login', label: '🔑 FPL Login' },
                { key: 'guide', label: '🔍 Find My ID' },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); setErr(''); }}
                  className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    tab === t.key ? 'bg-fpl-green text-fpl-purple' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── Team ID tab ── */}
            {tab === 'id' && (
              <div>
                <form onSubmit={handleLoadById} className="flex gap-2">
                  <input
                    type="number"
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    placeholder="Enter your FPL Team ID"
                    className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-fpl-green transition-all"
                    min="1"
                  />
                  <button
                    type="submit"
                    disabled={loading || dataLoading || !teamId}
                    className="btn-primary whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '…' : 'Load'}
                  </button>
                </form>
                <p className="mt-3 text-gray-400 text-xs text-left">
                  Not sure of your ID?{' '}
                  <button
                    onClick={() => setTab('guide')}
                    className="text-fpl-green underline hover:no-underline"
                  >
                    Follow the step-by-step guide →
                  </button>
                </p>
              </div>
            )}

            {/* ── FPL Login tab ── */}
            {tab === 'login' && (
              <div>
                {/* Google login notice */}
                <div className="mb-3 flex items-start gap-2 bg-blue-500/10 border border-blue-400/30 rounded-xl p-3">
                  <span className="text-lg shrink-0">G</span>
                  <div>
                    <p className="text-blue-200 text-xs font-semibold mb-0.5">Sign in with Google?</p>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      Google login users don't have a separate FPL password.{' '}
                      <button
                        onClick={() => setTab('guide')}
                        className="text-fpl-green underline hover:no-underline"
                      >
                        Use the Find My ID guide instead
                      </button>
                      {' '}— it only takes 30 seconds.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleFPLLogin} className="space-y-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="FPL email address"
                    autoComplete="email"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-fpl-green transition-all"
                  />
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="FPL password"
                      autoComplete="current-password"
                      className="w-full px-4 py-3 pr-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-fpl-green transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || dataLoading || !email || !password}
                    className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Signing in…' : 'Sign in & Load Team'}
                  </button>
                </form>
                <div className="mt-3 flex items-start gap-2 bg-white/5 border border-white/10 rounded-lg p-2.5">
                  <span className="text-yellow-400 text-sm shrink-0">🔒</span>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Credentials go directly to FPL's servers and are{' '}
                    <strong className="text-gray-300">never stored</strong> by this app.
                    We only retrieve your Team ID.
                  </p>
                </div>
              </div>
            )}

            {/* ── Find My ID guide tab ── */}
            {tab === 'guide' && (
              <div>
                <p className="text-gray-300 text-xs mb-3 text-left">
                  Choose how you're viewing FPL:
                </p>

                {/* Platform toggle */}
                <GuideContent onDone={() => setTab('id')} />
              </div>
            )}

            {err && (
              <p className="mt-3 text-red-400 text-sm bg-red-900/30 rounded-lg px-3 py-2">
                {err}
              </p>
            )}
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap gap-3 justify-center mt-8">
            <a href="/players" className="btn-secondary text-sm">Browse All Players →</a>
            <a href="/fixtures" className="btn-secondary text-sm">Fixture Ticker →</a>
            <a href="/captain" className="btn-secondary text-sm">Captain Picker →</a>
          </div>
        </div>
      </div>

      {/* Features grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-black text-center text-fpl-purple mb-3">
          Everything you need to win your mini-league
        </h2>
        <p className="text-center text-gray-500 mb-10">All data pulled live from the official FPL API</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <a
              key={f.title}
              href={f.path}
              className="card hover:shadow-lg hover:border-fpl-light-purple transition-all duration-200 group block"
            >
              <span className="text-4xl mb-4 block">{f.icon}</span>
              <h3 className="font-bold text-lg mb-2 text-fpl-purple group-hover:text-fpl-light-purple transition-colors">
                {f.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
            </a>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-fpl-purple/5 border-y border-fpl-purple/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
          <h2 className="text-2xl font-black text-fpl-purple mb-8">How to get started</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Load your team', desc: 'Enter your Team ID or search by your name. Find your ID in the FPL website URL.' },
              { step: '2', title: 'Check your squad', desc: 'See your players with live form, price, availability, and upcoming fixtures.' },
              { step: '3', title: 'Optimise every week', desc: 'Use Captain Picker, Transfer Planner, and Price Changes to gain an edge each GW.' },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-fpl-purple text-fpl-green font-black text-xl flex items-center justify-center mb-3">
                  {item.step}
                </div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
