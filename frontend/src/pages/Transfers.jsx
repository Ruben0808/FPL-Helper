import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFPL } from '../context/FPLContext';
import DifficultyBadge from '../components/DifficultyBadge';
import StatusBadge from '../components/StatusBadge';

const positionNames = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };
const positionBg = {
  1: 'bg-yellow-400 text-yellow-900',
  2: 'bg-green-500 text-white',
  3: 'bg-blue-500 text-white',
  4: 'bg-red-500 text-white',
};

const CHIPS = [
  {
    id: 'wildcard',
    name: 'Wildcard',
    icon: '🃏',
    color: 'from-purple-500 to-purple-700',
    desc: 'Unlimited free transfers for one gameweek. Your squad is kept permanently.',
    when: 'Best when 4+ players have poor fixtures ahead or you have multiple injuries piling up.',
  },
  {
    id: 'freehit',
    name: 'Free Hit',
    icon: '🎯',
    color: 'from-blue-500 to-blue-700',
    desc: 'Pick any 15 players for one week — your squad resets next gameweek.',
    when: 'Save for a blank gameweek when many of your players have no fixture.',
  },
  {
    id: 'bboost',
    name: 'Bench Boost',
    icon: '📈',
    color: 'from-emerald-500 to-emerald-700',
    desc: 'All 15 players in your squad score points this gameweek.',
    when: 'Best in a double gameweek when your bench players also have two games.',
  },
  {
    id: '3xc',
    name: 'Triple Captain',
    icon: '⭐',
    color: 'from-amber-500 to-orange-600',
    desc: 'Your captain earns 3× points instead of the usual 2×.',
    when: 'Use in a double gameweek on your highest-ceiling premium (Salah, Haaland etc.).',
  },
];

function playerScore(player, nextFixtures) {
  const form = parseFloat(player.form) || 0;
  const ppg = parseFloat(player.points_per_game) || 0;
  const isAvailable = player.status === 'a';
  const chanceOk =
    player.chance_of_playing_next_round == null ||
    player.chance_of_playing_next_round >= 75;
  const avgDiff =
    nextFixtures.length > 0
      ? nextFixtures.reduce((a, f) => a + f.difficulty, 0) / nextFixtures.length
      : 3;

  return (
    form * 2.5 +
    ppg * 1.0 +
    (6 - avgDiff) * 1.5 +
    (isAvailable && chanceOk ? 3 : isAvailable ? 1 : -3)
  );
}

// ── Stat pill used inside transfer cards ──────────────────────────────────────
function Stat({ label, value, highlight }) {
  return (
    <div className={`flex flex-col items-center px-3 py-1.5 rounded-lg ${highlight ? 'bg-fpl-green/20' : 'bg-gray-100'}`}>
      <span className={`text-sm font-bold ${highlight ? 'text-fpl-purple' : 'text-gray-800'}`}>{value}</span>
      <span className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</span>
    </div>
  );
}

// ── Single transfer suggestion row ────────────────────────────────────────────
function SuggestionRow({ sugg, rank, outPlayer }) {
  const { getTeam, getNextFixtures, formatPrice } = useFPL();
  const inPlayer = sugg.player;
  const inTeam = getTeam(inPlayer.team);
  const inFixtures = getNextFixtures(inPlayer.team, 4);
  const priceDelta = inPlayer.now_cost - outPlayer.now_cost;
  const improvement = sugg.score - sugg.outScore;
  const isBest = rank === 0;

  return (
    <div
      className={`rounded-xl border p-3 transition-all ${
        isBest
          ? 'border-fpl-green bg-gradient-to-r from-fpl-green/10 to-emerald-50 shadow-sm'
          : 'border-gray-100 bg-gray-50 hover:border-gray-200'
      }`}
    >
      <div className="flex items-center gap-3 flex-wrap">
        {/* Rank badge */}
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
            isBest ? 'bg-fpl-purple text-fpl-green' : 'bg-gray-200 text-gray-500'
          }`}
        >
          {rank + 1}
        </div>

        {/* Player info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-gray-900">{inPlayer.web_name}</span>
            {isBest && (
              <span className="text-[10px] font-black bg-fpl-purple text-fpl-green px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                Best Pick
              </span>
            )}
            <StatusBadge
              status={inPlayer.status}
              chanceOfPlaying={inPlayer.chance_of_playing_next_round}
              showLabel={false}
            />
          </div>
          <p className="text-xs text-gray-500">{inTeam?.name}</p>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Stat label="Form" value={parseFloat(inPlayer.form).toFixed(1)} highlight={isBest} />
          <Stat label="Pts/G" value={parseFloat(inPlayer.points_per_game).toFixed(1)} />
          <Stat label="Sel%" value={`${parseFloat(inPlayer.selected_by_percent).toFixed(1)}%`} />
        </div>

        {/* Price */}
        <div className="text-right shrink-0">
          <p className="font-bold text-fpl-purple">{formatPrice(inPlayer.now_cost)}</p>
          <p className={`text-xs font-semibold ${priceDelta > 0 ? 'text-red-500' : priceDelta < 0 ? 'text-green-600' : 'text-gray-400'}`}>
            {priceDelta > 0 ? `+${formatPrice(priceDelta)}` : priceDelta < 0 ? `-${formatPrice(Math.abs(priceDelta))}` : 'Same price'}
          </p>
        </div>

        {/* Score improvement */}
        <div className={`shrink-0 text-center px-3 py-1.5 rounded-lg ${improvement >= 3 ? 'bg-green-100' : 'bg-orange-50'}`}>
          <p className={`text-sm font-black ${improvement >= 3 ? 'text-green-700' : 'text-orange-600'}`}>
            +{improvement.toFixed(1)}
          </p>
          <p className="text-[10px] text-gray-500 uppercase">Score</p>
        </div>
      </div>

      {/* Next fixtures */}
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200/60">
        <span className="text-[10px] text-gray-400 uppercase tracking-wide shrink-0">Next 4:</span>
        <div className="flex gap-1 flex-wrap">
          {inFixtures.map((f, i) => {
            const opp = getTeam(f.opponent);
            return (
              <DifficultyBadge
                key={i}
                difficulty={f.difficulty}
                opponent={opp?.short_name}
                isHome={f.isHome}
                size="sm"
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Full transfer card (one OUT player + ranked IN options) ───────────────────
function TransferCard({ outPick, suggestions, rank }) {
  const { getTeam, getNextFixtures, formatPrice } = useFPL();
  const { player: outPlayer } = outPick;
  const [showAll, setShowAll] = useState(false);
  const PREVIEW = 3;

  if (!outPlayer) return null;

  const outTeam = getTeam(outPlayer.team);
  const outFixtures = getNextFixtures(outPlayer.team, 4);
  const outForm = parseFloat(outPlayer.form) || 0;
  const formColor =
    outForm >= 6 ? 'text-green-600' : outForm >= 3 ? 'text-yellow-600' : 'text-red-500';

  const visible = showAll ? suggestions : suggestions.slice(0, PREVIEW);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-5">
      {/* ── OUT player header ── */}
      <div className="bg-gradient-to-r from-red-500/10 to-rose-50 border-b border-red-100 px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Priority badge */}
          <div className="bg-red-500 text-white text-xs font-black w-7 h-7 rounded-full flex items-center justify-center shrink-0">
            #{rank + 1}
          </div>

          {/* Position */}
          <span className={`text-xs font-black px-2 py-1 rounded-lg shrink-0 ${positionBg[outPlayer.element_type]}`}>
            {positionNames[outPlayer.element_type]}
          </span>

          {/* Transfer out label */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 bg-red-100 border border-red-200 rounded-lg px-2 py-1 shrink-0">
              <span className="text-red-600 font-black text-xs">TRANSFER OUT</span>
            </div>
            <div className="min-w-0">
              <span className="font-black text-gray-900 text-lg">{outPlayer.web_name}</span>
              <span className="text-gray-500 text-sm ml-2">{outTeam?.name}</span>
            </div>
            <StatusBadge
              status={outPlayer.status}
              chanceOfPlaying={outPlayer.chance_of_playing_next_round}
              showLabel={false}
            />
          </div>

          {/* Out player stats */}
          <div className="flex items-center gap-2 flex-wrap ml-auto">
            <Stat label="Form" value={<span className={formColor}>{outForm.toFixed(1)}</span>} />
            <Stat label="Pts/G" value={parseFloat(outPlayer.points_per_game).toFixed(1)} />
            <Stat label="Price" value={formatPrice(outPlayer.now_cost)} />
          </div>
        </div>

        {/* Out player fixtures */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] text-red-400 uppercase tracking-wide shrink-0">Next 4:</span>
          <div className="flex gap-1 flex-wrap">
            {outFixtures.map((f, i) => {
              const opp = getTeam(f.opponent);
              return (
                <DifficultyBadge
                  key={i}
                  difficulty={f.difficulty}
                  opponent={opp?.short_name}
                  isHome={f.isHome}
                  size="sm"
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* ── IN options ── */}
      <div className="px-4 py-3">
        {suggestions.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <p className="text-2xl mb-1">🔍</p>
            <p className="text-sm">No better options found within budget for this position.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5 bg-green-100 border border-green-200 rounded-lg px-2 py-1">
                <span className="text-green-700 font-black text-xs">TRANSFER IN</span>
              </div>
              <span className="text-xs text-gray-400">{suggestions.length} option{suggestions.length !== 1 ? 's' : ''} found within budget</span>
            </div>

            <div className="space-y-2">
              {visible.map((sugg, idx) => (
                <SuggestionRow
                  key={sugg.player.id}
                  sugg={sugg}
                  rank={idx}
                  outPlayer={outPlayer}
                />
              ))}
            </div>

            {suggestions.length > PREVIEW && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="mt-3 w-full text-center text-xs text-fpl-light-purple font-semibold py-2 rounded-lg hover:bg-fpl-purple/5 transition-colors"
              >
                {showAll ? '↑ Show fewer options' : `↓ Show ${suggestions.length - PREVIEW} more options`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Transfers() {
  const { bootstrap, userTeam, currentGW, loading, getNextFixtures, formatPrice } = useFPL();
  const [transfersAvailable, setTransfersAvailable] = useState(1);
  const [extraBudget, setExtraBudget] = useState(0);

  const squadValue = useMemo(() => {
    if (!userTeam) return 0;
    return userTeam.picks.reduce((sum, p) => sum + (p.player?.now_cost || 0), 0);
  }, [userTeam]);

  // IDs of all players already in the squad — never recommend these
  const squadPlayerIds = useMemo(() => {
    if (!userTeam) return new Set();
    return new Set(userTeam.picks.map((p) => p.element));
  }, [userTeam]);

  const itb = (userTeam?.itbRaw || 0) + extraBudget * 10;

  const suggestions = useMemo(() => {
    if (!userTeam || !bootstrap) return [];

    return userTeam.picks
      .filter((p) => p.position <= 11)
      .map((pick) => {
        const { player } = pick;
        if (!player) return null;

        const outFixtures = getNextFixtures(player.team, 4);
        const outScore = playerScore(player, outFixtures);
        const budget = player.now_cost + itb;

        const candidates = bootstrap.elements
          .filter(
            (p) =>
              p.element_type === player.element_type &&
              !squadPlayerIds.has(p.id) &&        // ← exclude squad members
              p.now_cost <= budget &&
              p.status !== 'u'
          )
          .map((p) => {
            const inFixtures = getNextFixtures(p.team, 4);
            const score = playerScore(p, inFixtures);
            return { player: p, score, outScore };
          })
          .filter((c) => c.score > outScore)
          .sort((a, b) => b.score - a.score)
          .slice(0, 8);

        return { pick, outScore, suggestions: candidates };
      })
      .filter(Boolean)
      .sort((a, b) => a.outScore - b.outScore);
  }, [userTeam, bootstrap, itb, getNextFixtures, squadPlayerIds]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-12 h-12 border-4 border-fpl-purple border-t-fpl-green rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-fpl-purple mb-1">Transfer Planner</h1>
        <p className="text-gray-500 text-sm">
          Smart suggestions based on form, upcoming fixtures, and player availability.
          Players already in your squad are never recommended.
        </p>
      </div>

      {/* ── Chip Guide ── */}
      <div className="mb-10">
        <h2 className="text-lg font-bold mb-4 text-gray-700 flex items-center gap-2">
          <span>🃏</span> Chip Guide
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CHIPS.map((chip) => (
            <div
              key={chip.id}
              className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`bg-gradient-to-br ${chip.color} p-4 flex items-center gap-3`}>
                <span className="text-3xl">{chip.icon}</span>
                <h3 className="font-black text-white text-lg">{chip.name}</h3>
              </div>
              <div className="p-3 bg-white">
                <p className="text-xs text-gray-500 mb-2 leading-relaxed">{chip.desc}</p>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-xs font-medium text-gray-700 leading-relaxed">{chip.when}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── No team state ── */}
      {!userTeam ? (
        <div className="card text-center py-16">
          <p className="text-5xl mb-3">👕</p>
          <h3 className="text-xl font-bold mb-2">No team loaded</h3>
          <p className="text-gray-500 mb-6 text-sm max-w-xs mx-auto">
            Load your FPL team to get personalised transfer suggestions tailored to your squad.
          </p>
          <Link to="/" className="btn-primary inline-block">
            Load My Team
          </Link>
        </div>
      ) : (
        <>
          {/* ── Settings bar ── */}
          <div className="bg-fpl-purple rounded-2xl p-5 mb-8 text-white">
            <h2 className="font-bold mb-4 text-fpl-green text-sm uppercase tracking-wide">Transfer Settings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Transfers available */}
              <div>
                <label className="text-gray-300 text-xs block mb-2">Free Transfers Available</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setTransfersAvailable(n)}
                      className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
                        transfersAvailable === n
                          ? 'bg-fpl-green text-fpl-purple scale-105'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget slider */}
              <div>
                <label className="text-gray-300 text-xs block mb-2">
                  Extra Budget: <span className="text-fpl-green font-bold">£{(extraBudget / 10).toFixed(1)}m</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={1}
                  value={extraBudget}
                  onChange={(e) => setExtraBudget(Number(e.target.value))}
                  className="w-full accent-fpl-green"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>£0m</span><span>£5m</span>
                </div>
              </div>

              {/* Squad info */}
              <div className="space-y-2">
                {[
                  { label: 'Squad value', value: formatPrice(squadValue) },
                  { label: 'In the bank', value: formatPrice(itb), accent: true },
                  { label: `GW${currentGW} points`, value: userTeam.entry.summary_event_points ?? '—' },
                  { label: 'Overall rank', value: userTeam.entry.summary_overall_rank?.toLocaleString() ?? '—' },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">{row.label}</span>
                    <span className={`font-bold ${row.accent ? 'text-fpl-green' : 'text-white'}`}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Transfer suggestions ── */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-black text-gray-800">
                  Transfer Suggestions
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Showing your {transfersAvailable} weakest starting player{transfersAvailable !== 1 ? 's' : ''} with the best replacements within budget
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-red-100 border border-red-200 inline-block" />
                  Transfer Out
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-green-100 border border-green-200 inline-block" />
                  Transfer In
                </span>
              </div>
            </div>

            {suggestions.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-4xl mb-3">✅</p>
                <p className="font-bold text-gray-700">Your squad looks great!</p>
                <p className="text-sm text-gray-400 mt-1">No obvious improvements found within your current budget.</p>
              </div>
            ) : (
              suggestions
                .slice(0, transfersAvailable)
                .map((sugg, idx) => (
                  <TransferCard
                    key={sugg.pick.element}
                    outPick={sugg.pick}
                    suggestions={sugg.suggestions}
                    rank={idx}
                  />
                ))
            )}
          </div>

          {/* How scoring works */}
          <div className="mt-8 rounded-2xl border border-fpl-purple/20 bg-fpl-purple/5 p-4">
            <h3 className="font-bold text-fpl-purple text-sm mb-2 flex items-center gap-2">
              <span>🧮</span> How our scoring works
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Each player gets a score:{' '}
              <strong>Form × 2.5</strong> + <strong>Points/Game × 1.0</strong> +{' '}
              <strong>(6 − avg next 4 FDR) × 1.5</strong> + <strong>Availability bonus (±3)</strong>.
              Players with better fixtures, higher form, and full fitness score higher.
              The "Score" column shows the improvement vs your current player.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
