import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFPL } from '../context/FPLContext';
import StatusBadge from '../components/StatusBadge';
import DifficultyBadge from '../components/DifficultyBadge';

function playerScore(player, nextFixtures) {
  const form = parseFloat(player.form) || 0;
  const ppg = parseFloat(player.points_per_game) || 0;
  const isAvailable = player.status === 'a';
  const avgDiff =
    nextFixtures.length > 0
      ? nextFixtures.reduce((a, f) => a + f.difficulty, 0) / nextFixtures.length
      : 3;
  return form * 2.5 + ppg * 1.0 + (6 - avgDiff) * 1.5 + (isAvailable ? 3 : -3);
}

function HealthScore({ picks, getNextFixtures }) {
  const starting = picks.filter((p) => p.position <= 11 && p.player);

  const scores = starting.map((p) => {
    const fixtures = getNextFixtures(p.player.team, 3);
    return playerScore(p.player, fixtures);
  });

  const avg = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
  // Rough scale: score of 18+ = 100, score of 6 = 0
  const health = Math.max(0, Math.min(100, Math.round(((avg - 6) / 14) * 100)));

  const color =
    health >= 70 ? 'text-green-600' : health >= 45 ? 'text-yellow-600' : 'text-red-500';
  const barColor =
    health >= 70 ? 'bg-green-500' : health >= 45 ? 'bg-yellow-400' : 'bg-red-500';
  const label =
    health >= 70 ? 'Strong' : health >= 45 ? 'Average' : 'Weak';

  const injured = starting.filter((p) => p.player.status !== 'a').length;
  const poorFixtures = starting.filter((p) => {
    const f = getNextFixtures(p.player.team, 1)[0];
    return f && f.difficulty >= 4;
  }).length;

  return (
    <div className="card mb-6 border-l-4 border-l-fpl-light-purple">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-gray-800">Squad Health</h3>
          <p className="text-xs text-gray-500">Based on form, fixtures, and availability</p>
        </div>
        <div className="text-right">
          <span className={`text-4xl font-black ${color}`}>{health}</span>
          <span className="text-gray-400 text-lg">/100</span>
          <p className={`text-sm font-bold ${color}`}>{label}</p>
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3 mb-4 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${health}%` }}
        />
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-gray-50 rounded-lg p-2">
          <p className={`font-black text-lg ${injured > 0 ? 'text-red-500' : 'text-green-600'}`}>{injured}</p>
          <p className="text-gray-500">Injured/Doubt</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className={`font-black text-lg ${poorFixtures > 3 ? 'text-red-500' : poorFixtures > 1 ? 'text-yellow-600' : 'text-green-600'}`}>{poorFixtures}</p>
          <p className="text-gray-500">Tough next GW</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="font-black text-lg text-fpl-purple">{(avg).toFixed(1)}</p>
          <p className="text-gray-500">Avg Score</p>
        </div>
      </div>
    </div>
  );
}

const positionOrder = { 1: 0, 2: 1, 3: 2, 4: 3 };
const positionLabel = { 1: 'Goalkeeper', 2: 'Defenders', 3: 'Midfielders', 4: 'Forwards' };
const positionColors = {
  GKP: 'bg-yellow-400 text-yellow-900',
  DEF: 'bg-green-500 text-white',
  MID: 'bg-blue-500 text-white',
  FWD: 'bg-red-500 text-white',
};

function PlayerRow({ pick, isBench }) {
  const { getTeam, getPositionName, getNextFixtures, formatPrice } = useFPL();
  const { player } = pick;
  if (!player) return null;

  const team = getTeam(player.team);
  const position = getPositionName(player.element_type);
  const nextFixtures = getNextFixtures(player.team, 5);
  const form = parseFloat(player.form) || 0;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
        isBench
          ? 'bg-gray-50 border-gray-200 opacity-80'
          : 'bg-white border-gray-100 hover:border-fpl-light-purple hover:shadow-sm'
      }`}
    >
      {/* Captain/Vice badge */}
      {(pick.is_captain || pick.is_vice_captain) && (
        <span
          className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${
            pick.is_captain ? 'bg-fpl-purple text-fpl-green' : 'bg-gray-200 text-gray-600'
          }`}
        >
          {pick.is_captain ? 'C' : 'V'}
        </span>
      )}

      {/* Position */}
      <span className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${positionColors[position]}`}>
        {position}
      </span>

      {/* Name & team */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{player.web_name}</p>
        <p className="text-xs text-gray-500">{team?.name}</p>
      </div>

      {/* Status */}
      <StatusBadge status={player.status} chanceOfPlaying={player.chance_of_playing_next_round} showLabel={false} />

      {/* Form */}
      <div className="text-center hidden sm:block w-10">
        <p className={`text-sm font-bold ${form >= 6 ? 'text-green-600' : form >= 3 ? 'text-yellow-600' : 'text-red-500'}`}>
          {form.toFixed(1)}
        </p>
        <p className="text-[10px] text-gray-400">Form</p>
      </div>

      {/* Price */}
      <div className="text-right hidden sm:block w-12">
        <p className="text-sm font-bold text-fpl-purple">{formatPrice(player.now_cost)}</p>
        <p className="text-[10px] text-gray-400">Price</p>
      </div>

      {/* Next fixtures */}
      <div className="hidden lg:flex gap-1">
        {nextFixtures.slice(0, 4).map((f, i) => {
          const oppTeam = getTeam(f.opponent);
          return (
            <DifficultyBadge
              key={i}
              difficulty={f.difficulty}
              opponent={oppTeam?.short_name}
              isHome={f.isHome}
              size="sm"
            />
          );
        })}
      </div>

      {/* Multiplier */}
      {pick.multiplier > 1 && (
        <span className="text-xs bg-fpl-purple text-fpl-green rounded px-1.5 py-0.5 font-bold shrink-0">
          x{pick.multiplier}
        </span>
      )}
    </div>
  );
}

export default function MyTeam() {
  const { userTeam, currentGW, formatPrice, clearTeam, getNextFixtures } = useFPL();
  const navigate = useNavigate();
  const [teamId, setTeamId] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const { loadTeam } = useFPL();

  if (!userTeam) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <p className="text-6xl mb-4">👕</p>
        <h2 className="text-2xl font-bold mb-2">No team loaded</h2>
        <p className="text-gray-500 mb-6">Enter your FPL Team ID to see your squad.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setErr('');
            setLoading(true);
            try {
              await loadTeam(teamId.trim());
            } catch (error) {
              setErr(error.message);
            } finally {
              setLoading(false);
            }
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <input
            type="number"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            placeholder="Team ID"
            className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-fpl-light-purple"
          />
          <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
            {loading ? '…' : 'Load'}
          </button>
        </form>
        {err && <p className="mt-3 text-red-500 text-sm">{err}</p>}
      </div>
    );
  }

  const { entry, picks } = userTeam;

  // Split into starting XI and bench (bench = picks 12-15 in FPL, multiplier 0)
  const starting = picks.filter((p) => p.position <= 11);
  const bench = picks.filter((p) => p.position > 11);

  // Group starting XI by position
  const byPosition = {};
  starting.forEach((p) => {
    const et = p.player?.element_type;
    if (!byPosition[et]) byPosition[et] = [];
    byPosition[et].push(p);
  });

  const totalValue = picks.reduce((sum, p) => sum + (p.player?.now_cost || 0), 0);
  const itb = userTeam.itbRaw;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-fpl-purple">{entry.name}</h1>
          <p className="text-gray-500 text-sm">
            Managed by {entry.player_first_name} {entry.player_last_name} •{' '}
            <span className="font-medium">GW{currentGW}</span>
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link to="/transfers" className="btn-primary text-sm">
            Transfer Suggestions →
          </Link>
          <button
            onClick={() => { clearTeam(); navigate('/'); }}
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            Change team
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Overall Rank', value: entry.summary_overall_rank?.toLocaleString() ?? '—' },
          { label: 'GW Points', value: entry.summary_event_points ?? '—' },
          { label: 'Total Points', value: entry.summary_overall_points ?? '—' },
          { label: 'Squad Value', value: formatPrice(totalValue) },
        ].map((stat) => (
          <div key={stat.label} className="card text-center">
            <p className="stat-value">{stat.value}</p>
            <p className="stat-label">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Health score */}
      <HealthScore picks={picks} getNextFixtures={getNextFixtures} />

      {/* Active chip */}
      {userTeam.chips && (
        <div className="mb-4 inline-flex items-center gap-2 bg-fpl-purple/10 border border-fpl-purple/20 rounded-lg px-3 py-1.5">
          <span className="text-fpl-purple font-bold text-sm">
            Active Chip: {userTeam.chips.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      )}

      {/* Starting XI */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 text-gray-700">Starting XI</h2>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((et) =>
            byPosition[et]?.length > 0 ? (
              <div key={et}>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                  {positionLabel[et]}
                </p>
                <div className="space-y-2">
                  {byPosition[et].map((pick) => (
                    <PlayerRow key={pick.element} pick={pick} isBench={false} />
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      </div>

      {/* Bench */}
      <div>
        <h2 className="text-lg font-bold mb-3 text-gray-500">Bench</h2>
        <div className="space-y-2">
          {bench.map((pick) => (
            <PlayerRow key={pick.element} pick={pick} isBench={true} />
          ))}
        </div>
      </div>

      {/* Hint */}
      <p className="mt-6 text-center text-xs text-gray-400">
        Fixture difficulty shown for next 4 gameweeks. Green = easy, Red = hard.
      </p>
    </div>
  );
}
