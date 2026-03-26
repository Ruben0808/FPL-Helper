import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFPL } from '../context/FPLContext';
import DifficultyBadge from '../components/DifficultyBadge';
import StatusBadge from '../components/StatusBadge';

const positionColors = {
  1: 'bg-yellow-400 text-yellow-900',
  2: 'bg-green-500 text-white',
  3: 'bg-blue-500 text-white',
  4: 'bg-red-500 text-white',
};
const positionNames = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };

function captainScore(player, nextFixture) {
  const form = parseFloat(player.form) || 0;
  const ppg = parseFloat(player.points_per_game) || 0;
  const epNext = parseFloat(player.ep_next) || 0;
  const diff = nextFixture?.difficulty ?? 3;
  const isHome = nextFixture?.isHome ?? false;
  const isAvailable = player.status === 'a';

  return (
    epNext * 3.5 +
    form * 2.0 +
    ppg * 1.0 +
    (isHome ? 2 : 0) +
    (6 - diff) * 1.5 +
    (isAvailable ? 2 : -4)
  );
}

const medals = ['🥇', '🥈', '🥉'];
const rankColors = [
  'from-amber-50 to-yellow-50 border-amber-200',
  'from-gray-50 to-slate-50 border-slate-200',
  'from-orange-50 to-amber-50 border-orange-200',
];

export default function CaptainPicker() {
  const { bootstrap, userTeam, loading, getTeam, getPositionName, getNextFixtures, formatPrice } = useFPL();
  const [showAll, setShowAll] = useState(false);
  const [viewMode, setViewMode] = useState('squad'); // 'squad' | 'all'

  const scoredPlayers = useMemo(() => {
    if (!bootstrap) return [];

    const source =
      viewMode === 'squad' && userTeam
        ? userTeam.picks.filter((p) => p.position <= 11).map((p) => p.player).filter(Boolean)
        : bootstrap.elements.filter((p) => p.status !== 'u' && parseFloat(p.selected_by_percent) > 1);

    return source
      .map((player) => {
        const fixtures = getNextFixtures(player.team, 1);
        const nextFixture = fixtures[0] ?? null;
        const score = captainScore(player, nextFixture);
        return { player, nextFixture, score };
      })
      .sort((a, b) => b.score - a.score);
  }, [bootstrap, userTeam, viewMode, getNextFixtures]);

  const displayed = showAll ? scoredPlayers : scoredPlayers.slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-12 h-12 border-4 border-fpl-purple border-t-fpl-green rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-fpl-purple mb-1">Captain Picker</h1>
        <p className="text-gray-500 text-sm">
          Ranked by FPL expected points, recent form, fixture difficulty, and home advantage.
        </p>
      </div>

      {/* Top 3 podium */}
      {scoredPlayers.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          {scoredPlayers.slice(0, 3).map(({ player, nextFixture, score }, idx) => {
            const team = getTeam(player.team);
            const opp = nextFixture ? getTeam(nextFixture.opponent) : null;
            return (
              <div
                key={player.id}
                className={`rounded-2xl border-2 bg-gradient-to-b p-4 text-center ${rankColors[idx]} ${idx === 0 ? 'scale-105 shadow-lg' : ''}`}
              >
                <div className="text-4xl mb-2">{medals[idx]}</div>
                <span className={`text-xs font-black px-2 py-0.5 rounded-full mb-2 inline-block ${positionColors[player.element_type]}`}>
                  {positionNames[player.element_type]}
                </span>
                <h3 className="font-black text-gray-900 text-lg leading-tight mb-0.5">{player.web_name}</h3>
                <p className="text-xs text-gray-500 mb-3">{team?.name}</p>

                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  <div className="bg-white/70 rounded-lg py-1.5">
                    <p className="text-sm font-black text-fpl-purple">{parseFloat(player.ep_next).toFixed(1)}</p>
                    <p className="text-[10px] text-gray-500">Exp Pts</p>
                  </div>
                  <div className="bg-white/70 rounded-lg py-1.5">
                    <p className="text-sm font-black text-gray-800">{parseFloat(player.form).toFixed(1)}</p>
                    <p className="text-[10px] text-gray-500">Form</p>
                  </div>
                </div>

                {nextFixture && opp && (
                  <DifficultyBadge
                    difficulty={nextFixture.difficulty}
                    opponent={opp.short_name}
                    isHome={nextFixture.isHome}
                    size="sm"
                  />
                )}

                <div className="mt-3 bg-fpl-purple/10 rounded-lg py-1.5">
                  <p className="text-xs font-black text-fpl-purple">
                    Score: {score.toFixed(1)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View toggle */}
      <div className="flex items-center gap-2 mb-5">
        <div className="bg-gray-100 rounded-xl p-1 flex gap-1">
          {[
            { key: 'squad', label: '👕 My Squad', disabled: !userTeam },
            { key: 'all', label: '🌍 All Players' },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => !opt.disabled && setViewMode(opt.key)}
              disabled={opt.disabled}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                viewMode === opt.key
                  ? 'bg-fpl-purple text-fpl-green shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {!userTeam && (
          <Link to="/" className="text-xs text-fpl-light-purple hover:underline">
            Load team to see squad view →
          </Link>
        )}
      </div>

      {/* Full ranked list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-fpl-purple text-white text-xs uppercase tracking-wide">
              <th className="text-center px-3 py-3 w-10">#</th>
              <th className="text-left px-4 py-3">Player</th>
              <th className="text-center px-3 py-3 hidden sm:table-cell">Status</th>
              <th className="text-center px-3 py-3">Exp Pts</th>
              <th className="text-center px-3 py-3">Form</th>
              <th className="text-center px-3 py-3 hidden md:table-cell">Pts/G</th>
              <th className="text-center px-3 py-3 hidden md:table-cell">Price</th>
              <th className="text-center px-3 py-3">Next Fix</th>
              <th className="text-right px-4 py-3">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {displayed.map(({ player, nextFixture, score }, idx) => {
              const team = getTeam(player.team);
              const opp = nextFixture ? getTeam(nextFixture.opponent) : null;
              const isCaptain = idx === 0;
              const isVice = idx === 1;

              return (
                <tr
                  key={player.id}
                  className={`transition-colors ${idx < 3 ? 'bg-amber-50/30' : 'hover:bg-gray-50'}`}
                >
                  <td className="px-3 py-3 text-center">
                    {idx < 3 ? (
                      <span className="text-xl">{medals[idx]}</span>
                    ) : (
                      <span className="text-sm text-gray-400 font-bold">{idx + 1}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${positionColors[player.element_type]}`}>
                        {positionNames[player.element_type]}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-900">{player.web_name}</span>
                          {isCaptain && (
                            <span className="text-[10px] font-black bg-fpl-purple text-fpl-green px-1.5 py-0.5 rounded-full">C</span>
                          )}
                          {isVice && (
                            <span className="text-[10px] font-black bg-gray-400 text-white px-1.5 py-0.5 rounded-full">V</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{team?.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center hidden sm:table-cell">
                    <StatusBadge status={player.status} chanceOfPlaying={player.chance_of_playing_next_round} showLabel={false} />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="font-black text-fpl-purple text-base">
                      {parseFloat(player.ep_next).toFixed(1)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center font-semibold text-gray-700">
                    {parseFloat(player.form).toFixed(1)}
                  </td>
                  <td className="px-3 py-3 text-center text-gray-600 hidden md:table-cell">
                    {parseFloat(player.points_per_game).toFixed(1)}
                  </td>
                  <td className="px-3 py-3 text-center text-fpl-purple font-bold hidden md:table-cell">
                    {formatPrice(player.now_cost)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {nextFixture && opp ? (
                      <DifficultyBadge
                        difficulty={nextFixture.difficulty}
                        opponent={opp.short_name}
                        isHome={nextFixture.isHome}
                        size="sm"
                      />
                    ) : (
                      <span className="text-gray-300 text-xs">BGW</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-black text-gray-800">{score.toFixed(1)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {scoredPlayers.length > 10 && (
          <div className="border-t border-gray-100 p-3 text-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-fpl-light-purple font-semibold hover:underline"
            >
              {showAll ? '↑ Show fewer' : `↓ Show all ${scoredPlayers.length} players`}
            </button>
          </div>
        )}
      </div>

      {/* Explanation */}
      <div className="mt-6 rounded-2xl border border-fpl-purple/20 bg-fpl-purple/5 p-4">
        <h3 className="font-bold text-fpl-purple text-sm mb-2">🧮 Captain score formula</h3>
        <p className="text-xs text-gray-600 leading-relaxed">
          <strong>Expected Points × 3.5</strong> + <strong>Form × 2.0</strong> + <strong>Pts/Game × 1.0</strong> +{' '}
          <strong>Home bonus (+2)</strong> + <strong>(6 − FDR) × 1.5</strong> + <strong>Availability (±2/−4)</strong>.{' '}
          Expected Points are FPL's own model prediction for the next gameweek.
        </p>
      </div>
    </div>
  );
}
