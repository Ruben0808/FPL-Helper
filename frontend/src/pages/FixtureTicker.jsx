import { useMemo, useState } from 'react';
import { useFPL } from '../context/FPLContext';
import DifficultyBadge from '../components/DifficultyBadge';

const diffConfig = {
  1: { bg: 'bg-green-500', text: 'text-white', border: 'border-green-600' },
  2: { bg: 'bg-green-400', text: 'text-white', border: 'border-green-500' },
  3: { bg: 'bg-yellow-300', text: 'text-gray-800', border: 'border-yellow-400' },
  4: { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-600' },
  5: { bg: 'bg-red-600', text: 'text-white', border: 'border-red-700' },
};

export default function FixtureTicker() {
  const { bootstrap, fixtures, currentGW, loading, getTeam, specialGWs } = useFPL();
  const [gwCount, setGwCount] = useState(8);
  const [sortBy, setSortBy] = useState('avgDifficulty');

  const gwRange = useMemo(() => {
    if (!currentGW) return [];
    return Array.from({ length: gwCount }, (_, i) => currentGW + i);
  }, [currentGW, gwCount]);

  const teamData = useMemo(() => {
    if (!bootstrap || !fixtures.length || !currentGW) return [];

    return bootstrap.teams.map((team) => {
      const gwFixtures = gwRange.map((gw) => {
        const teamFixtures = fixtures.filter(
          (f) =>
            f.event === gw &&
            (f.team_h === team.id || f.team_a === team.id)
        );
        return teamFixtures.map((f) => {
          const isHome = f.team_h === team.id;
          const opponent = isHome ? f.team_a : f.team_h;
          const difficulty = isHome ? f.team_h_difficulty : f.team_a_difficulty;
          return { opponent, isHome, difficulty, event: gw };
        });
      });

      const allDifficulties = gwFixtures.flat().map((f) => f.difficulty);
      const avgDifficulty =
        allDifficulties.length > 0
          ? allDifficulties.reduce((a, b) => a + b, 0) / allDifficulties.length
          : 3;

      return { team, gwFixtures, avgDifficulty };
    });
  }, [bootstrap, fixtures, gwRange, currentGW]);

  const sortedTeams = useMemo(() => {
    return [...teamData].sort((a, b) => {
      if (sortBy === 'avgDifficulty') return a.avgDifficulty - b.avgDifficulty;
      return a.team.name.localeCompare(b.team.name);
    });
  }, [teamData, sortBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-12 h-12 border-4 border-fpl-purple border-t-fpl-green rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-fpl-purple mb-1">Fixture Ticker</h1>
        <p className="text-gray-500 text-sm">
          Colour-coded fixture difficulty for the next {gwCount} gameweeks.
          Sorted by easiest upcoming run.
        </p>
      </div>

      {/* Controls */}
      <div className="card mb-6 flex flex-wrap gap-4 items-center">
        <div>
          <label className="stat-label block mb-1">Gameweeks to show</label>
          <div className="flex gap-1">
            {[5, 6, 8, 10].map((n) => (
              <button
                key={n}
                onClick={() => setGwCount(n)}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                  gwCount === n
                    ? 'bg-fpl-purple text-fpl-green'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="stat-label block mb-1">Sort by</label>
          <div className="flex gap-1">
            {[
              { label: 'Easiest run', value: 'avgDifficulty' },
              { label: 'Team name', value: 'name' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value)}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                  sortBy === opt.value
                    ? 'bg-fpl-purple text-fpl-green'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 ml-auto flex-wrap">
          <span className="text-xs text-gray-500 font-medium">FDR:</span>
          {[1, 2, 3, 4, 5].map((d) => {
            const labels = { 1: 'Very Easy', 2: 'Easy', 3: 'Medium', 4: 'Hard', 5: 'Very Hard' };
            return (
              <div key={d} className="flex items-center gap-1.5">
                <DifficultyBadge difficulty={d} size="sm" />
                <span className="text-xs text-gray-500 hidden sm:inline">{labels[d]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* BGW / DGW alert banners */}
      {gwRange.some((gw) => specialGWs.blanks[gw]?.length > 0 || specialGWs.doubles[gw]?.length > 0) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {gwRange.map((gw) => {
            const hasBlanks = (specialGWs.blanks[gw] || []).length > 0;
            const hasDoubles = (specialGWs.doubles[gw] || []).length > 0;
            if (!hasBlanks && !hasDoubles) return null;
            return (
              <div key={gw} className="flex gap-2">
                {hasBlanks && (
                  <div className="flex items-center gap-1.5 bg-gray-800 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    <span className="text-gray-300">GW{gw}</span>
                    <span className="text-yellow-400">BGW</span>
                    <span className="text-gray-400 font-normal">{specialGWs.blanks[gw].length} teams blank</span>
                  </div>
                )}
                {hasDoubles && (
                  <div className="flex items-center gap-1.5 bg-fpl-purple text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    <span className="text-gray-300">GW{gw}</span>
                    <span className="text-fpl-green">DGW</span>
                    <span className="text-gray-400 font-normal">{specialGWs.doubles[gw].length} teams play twice</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide sticky left-0 bg-gray-50 min-w-[100px] sm:min-w-[140px]">
                Team
              </th>
              <th className="text-center px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-16">
                Avg FDR
              </th>
              {gwRange.map((gw) => {
                const isBGW = (specialGWs.blanks[gw] || []).length > 0;
                const isDGW = (specialGWs.doubles[gw] || []).length > 0;
                return (
                  <th key={gw} className={`text-center px-2 py-3 text-xs font-semibold uppercase tracking-wide min-w-[60px] sm:min-w-[80px] ${
                    isDGW ? 'text-fpl-green bg-fpl-purple/80' : isBGW ? 'text-yellow-300 bg-gray-700' : 'text-gray-500'
                  }`}>
                    GW{gw}
                    {isDGW && <span className="block text-[9px] font-black">DGW</span>}
                    {isBGW && !isDGW && <span className="block text-[9px] font-black">BGW</span>}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sortedTeams.map(({ team, gwFixtures, avgDifficulty }) => (
              <tr key={team.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-3 sticky left-0 bg-white group-hover:bg-gray-50 min-w-[100px] sm:min-w-[140px]">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{team.name}</span>
                    <span className="text-xs text-gray-400">({team.short_name})</span>
                  </div>
                </td>
                <td className="px-2 py-3 text-center">
                  <span
                    className={`inline-flex items-center justify-center w-9 h-7 rounded font-bold text-sm ${
                      diffConfig[Math.round(avgDifficulty)]?.bg
                    } ${diffConfig[Math.round(avgDifficulty)]?.text}`}
                  >
                    {avgDifficulty.toFixed(1)}
                  </span>
                </td>
                {gwFixtures.map((fixtures, gwIdx) => (
                  <td key={gwIdx} className="px-1 py-2 text-center">
                    {fixtures.length === 0 ? (
                      <span className="text-gray-300 text-xs">—</span>
                    ) : (
                      <div className="flex flex-col gap-1 items-center">
                        {fixtures.map((f, fi) => {
                          const opp = getTeam(f.opponent);
                          return (
                            <DifficultyBadge
                              key={fi}
                              difficulty={f.difficulty}
                              opponent={opp?.short_name}
                              isHome={f.isHome}
                              size="sm"
                            />
                          );
                        })}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-center text-gray-400">
        (A) = Away fixture. Blank cells = no fixture that gameweek (BGW).
        Double gameweek cells show two fixtures.
      </p>
    </div>
  );
}
