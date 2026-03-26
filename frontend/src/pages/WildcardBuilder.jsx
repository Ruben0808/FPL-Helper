import { useState, useMemo, useCallback } from 'react';
import { useFPL } from '../context/FPLContext';
import DifficultyBadge from '../components/DifficultyBadge';
import StatusBadge from '../components/StatusBadge';

const positionNames = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };
const positionColors = {
  1: 'bg-yellow-400 text-yellow-900',
  2: 'bg-green-500 text-white',
  3: 'bg-blue-500 text-white',
  4: 'bg-red-500 text-white',
};
const POSITION_LIMITS = { 1: 2, 2: 5, 3: 5, 4: 3 };
const MAX_PER_TEAM = 3;

function playerScore(player, nextFixtures) {
  const form = parseFloat(player.form) || 0;
  const ppg = parseFloat(player.points_per_game) || 0;
  const epNext = parseFloat(player.ep_next) || 0;
  const isAvailable = player.status === 'a';
  const avgDiff =
    nextFixtures.length > 0
      ? nextFixtures.reduce((a, f) => a + f.difficulty, 0) / nextFixtures.length
      : 3;
  return epNext * 3 + form * 2 + ppg * 1 + (6 - avgDiff) * 1.5 + (isAvailable ? 2 : -4);
}

function buildSquad(players, scoredMap, budget, lockedIds) {
  const locked = players.filter((p) => lockedIds.has(p.id));
  const available = players
    .filter((p) => !lockedIds.has(p.id) && p.status !== 'u')
    .sort((a, b) => (scoredMap.get(b.id) || 0) - (scoredMap.get(a.id) || 0));

  const squad = [...locked];
  const teamCounts = {};
  const posCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
  let remaining = budget;

  // Init from locked
  locked.forEach((p) => {
    teamCounts[p.team] = (teamCounts[p.team] || 0) + 1;
    posCounts[p.element_type]++;
    remaining -= p.now_cost;
  });

  for (const player of available) {
    if (squad.length >= 15) break;
    if ((teamCounts[player.team] || 0) >= MAX_PER_TEAM) continue;
    if (posCounts[player.element_type] >= POSITION_LIMITS[player.element_type]) continue;
    if (player.now_cost > remaining) continue;

    squad.push(player);
    teamCounts[player.team] = (teamCounts[player.team] || 0) + 1;
    posCounts[player.element_type]++;
    remaining -= player.now_cost;
  }

  return { squad, remaining };
}

function SquadPlayer({ player, isLocked, onToggleLock, getTeam, getNextFixtures, formatPrice }) {
  const team = getTeam(player.team);
  const fixtures = getNextFixtures(player.team, 3);

  return (
    <div className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
      isLocked ? 'border-fpl-green bg-fpl-green/10' : 'border-gray-100 bg-white hover:border-gray-200'
    }`}>
      <span className={`text-xs font-black px-1.5 py-0.5 rounded shrink-0 ${positionColors[player.element_type]}`}>
        {positionNames[player.element_type]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-gray-900 truncate">{player.web_name}</p>
        <p className="text-[10px] text-gray-400">{team?.short_name}</p>
      </div>
      <StatusBadge status={player.status} chanceOfPlaying={player.chance_of_playing_next_round} showLabel={false} />
      <div className="hidden sm:flex gap-1">
        {fixtures.slice(0, 3).map((f, i) => {
          const opp = getTeam(f.opponent);
          return <DifficultyBadge key={i} difficulty={f.difficulty} opponent={opp?.short_name} isHome={f.isHome} size="sm" />;
        })}
      </div>
      <span className="font-bold text-fpl-purple text-sm shrink-0">{formatPrice(player.now_cost)}</span>
      <button
        onClick={() => onToggleLock(player.id)}
        className={`shrink-0 w-7 h-7 rounded-lg text-xs font-black transition-all ${
          isLocked
            ? 'bg-fpl-green text-fpl-purple'
            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
        }`}
        title={isLocked ? 'Unlock player' : 'Lock player in squad'}
      >
        {isLocked ? '🔒' : '🔓'}
      </button>
    </div>
  );
}

export default function WildcardBuilder() {
  const { bootstrap, userTeam, loading, getTeam, getNextFixtures, formatPrice } = useFPL();
  const [budget, setBudget] = useState(1000); // £100.0m in raw
  const [lockedIds, setLockedIds] = useState(new Set());
  const [built, setBuilt] = useState(false);
  const [result, setResult] = useState(null);

  const scoredMap = useMemo(() => {
    if (!bootstrap) return new Map();
    const map = new Map();
    bootstrap.elements.forEach((p) => {
      const fixtures = getNextFixtures(p.team, 4);
      map.set(p.id, playerScore(p, fixtures));
    });
    return map;
  }, [bootstrap, getNextFixtures]);

  const handleBuild = useCallback(() => {
    if (!bootstrap) return;
    const { squad, remaining } = buildSquad(bootstrap.elements, scoredMap, budget, lockedIds);
    setResult({ squad, remaining });
    setBuilt(true);
  }, [bootstrap, scoredMap, budget, lockedIds]);

  const toggleLock = useCallback((id) => {
    setLockedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleLoadSquadAsLocked = useCallback(() => {
    if (!userTeam) return;
    setLockedIds(new Set(userTeam.picks.map((p) => p.element)));
  }, [userTeam]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-12 h-12 border-4 border-fpl-purple border-t-fpl-green rounded-full animate-spin" />
      </div>
    );
  }

  const squadByPosition = result
    ? [1, 2, 3, 4].map((pos) => ({
        pos,
        players: result.squad
          .filter((p) => p.element_type === pos)
          .sort((a, b) => (scoredMap.get(b.id) || 0) - (scoredMap.get(a.id) || 0)),
      }))
    : [];

  const totalCost = result?.squad.reduce((s, p) => s + p.now_cost, 0) ?? 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-fpl-purple mb-1">Wildcard Builder</h1>
        <p className="text-gray-500 text-sm">
          Generates the optimal 15-player squad within your budget using our scoring algorithm.
          Lock in players you want to keep, then hit Build.
        </p>
      </div>

      {/* Settings panel */}
      <div className="bg-fpl-purple rounded-2xl p-5 mb-6 text-white">
        <h2 className="font-bold mb-4 text-fpl-green text-sm uppercase tracking-wide">Build Settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Budget */}
          <div>
            <label className="text-gray-300 text-xs block mb-2">
              Total Budget:{' '}
              <span className="text-fpl-green font-black text-base">{formatPrice(budget)}</span>
            </label>
            <input
              type="range"
              min={800}
              max={1050}
              step={5}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full accent-fpl-green"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>£80m</span><span>Standard £100m</span><span>£105m</span>
            </div>
          </div>

          {/* Locked players */}
          <div>
            <p className="text-gray-300 text-xs mb-2">
              Locked players: <span className="text-fpl-green font-black">{lockedIds.size}</span>
            </p>
            <div className="flex gap-2 flex-wrap">
              {userTeam && (
                <button
                  onClick={handleLoadSquadAsLocked}
                  className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  🔒 Lock current squad
                </button>
              )}
              {lockedIds.size > 0 && (
                <button
                  onClick={() => setLockedIds(new Set())}
                  className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1.5 rounded-lg transition-colors"
                >
                  🔓 Clear all locks
                </button>
              )}
            </div>
          </div>

          {/* Build button */}
          <div className="flex items-end">
            <button
              onClick={handleBuild}
              className="w-full py-3 bg-fpl-green text-fpl-purple font-black rounded-xl hover:brightness-90 transition-all text-base shadow-lg"
            >
              ⚡ Build Optimal Squad
            </button>
          </div>
        </div>
      </div>

      {/* How to use */}
      {!built && (
        <div className="card mb-6 bg-blue-50 border-blue-100">
          <h3 className="font-bold text-blue-800 mb-2 text-sm">How to use</h3>
          <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
            <li>Set your available budget using the slider (default £100m)</li>
            <li>Optionally lock players you definitely want to keep (click 🔓 on their card)</li>
            <li>If you have a team loaded, click "Lock current squad" to keep all your players and just optimise around them</li>
            <li>Hit <strong>Build Optimal Squad</strong> — the algorithm picks the best 15 within constraints</li>
          </ol>
        </div>
      )}

      {/* Result */}
      {result && (
        <div>
          {/* Summary bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Players', value: `${result.squad.length}/15` },
              { label: 'Total Cost', value: formatPrice(totalCost) },
              { label: 'Remaining ITB', value: formatPrice(result.remaining) },
              { label: 'Locked In', value: `${lockedIds.size} player${lockedIds.size !== 1 ? 's' : ''}` },
            ].map((s) => (
              <div key={s.label} className="card text-center">
                <p className="stat-value">{s.value}</p>
                <p className="stat-label">{s.label}</p>
              </div>
            ))}
          </div>

          {result.squad.length < 15 && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700">
              ⚠️ Only {result.squad.length}/15 players found within budget. Try increasing your budget or clearing some locked players.
            </div>
          )}

          {/* Squad by position */}
          <div className="space-y-5">
            {squadByPosition.map(({ pos, players }) => (
              <div key={pos}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-black px-2 py-1 rounded-lg ${positionColors[pos]}`}>
                    {positionNames[pos]}
                  </span>
                  <span className="text-sm font-bold text-gray-600">
                    {players.length} / {POSITION_LIMITS[pos]}
                  </span>
                </div>
                <div className="space-y-2">
                  {players.map((player) => (
                    <SquadPlayer
                      key={player.id}
                      player={player}
                      isLocked={lockedIds.has(player.id)}
                      onToggleLock={toggleLock}
                      getTeam={getTeam}
                      getNextFixtures={getNextFixtures}
                      formatPrice={formatPrice}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Rebuild nudge */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleBuild}
              className="btn-primary text-sm"
            >
              ↺ Rebuild
            </button>
            <button
              onClick={() => { setBuilt(false); setResult(null); }}
              className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              Start over
            </button>
          </div>
        </div>
      )}

      {/* Algorithm note */}
      <div className="mt-8 rounded-2xl border border-fpl-purple/20 bg-fpl-purple/5 p-4">
        <h3 className="font-bold text-fpl-purple text-sm mb-2">🧮 How the algorithm works</h3>
        <p className="text-xs text-gray-600 leading-relaxed">
          Scores every player using <strong>Expected Points × 3</strong> + <strong>Form × 2</strong> +{' '}
          <strong>Pts/Game × 1</strong> + <strong>(6 − avg FDR) × 1.5</strong> + <strong>Availability bonus</strong>.
          Then greedily picks the highest-scoring available players respecting FPL constraints:
          2 GKP, 5 DEF, 5 MID, 3 FWD, max 3 from same club, within budget.
          Locked players are always included first.
        </p>
      </div>
    </div>
  );
}
