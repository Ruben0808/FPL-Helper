import { useState, useMemo } from 'react';
import { useFPL } from '../context/FPLContext';
import DifficultyBadge from '../components/DifficultyBadge';
import StatusBadge from '../components/StatusBadge';

const POSITIONS = [
  { label: 'All', value: 0 },
  { label: 'GKP', value: 1 },
  { label: 'DEF', value: 2 },
  { label: 'MID', value: 3 },
  { label: 'FWD', value: 4 },
];

const SORT_OPTIONS = [
  { label: 'Total Points', value: 'total_points' },
  { label: 'Form', value: 'form' },
  { label: 'Pts / Game', value: 'points_per_game' },
  { label: 'Value', value: 'value_score' },
  { label: 'Exp Pts', value: 'ep_next' },
  { label: 'Price', value: 'now_cost' },
  { label: 'Ownership %', value: 'selected_by_percent' },
  { label: 'Goals', value: 'goals_scored' },
  { label: 'Assists', value: 'assists' },
  { label: 'Clean Sheets', value: 'clean_sheets' },
];

const positionColors = {
  1: 'bg-yellow-400 text-yellow-900',
  2: 'bg-green-500 text-white',
  3: 'bg-blue-500 text-white',
  4: 'bg-red-500 text-white',
};
const positionNames = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };

export default function PlayerScout() {
  const { bootstrap, loading, getTeam, getNextFixtures, formatPrice } = useFPL();
  const [posFilter, setPosFilter] = useState(0);
  const [teamFilter, setTeamFilter] = useState(0);
  const [maxPrice, setMaxPrice] = useState(150);
  const [sortBy, setSortBy] = useState('total_points');
  const [sortDir, setSortDir] = useState('desc');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [differentialsOnly, setDifferentialsOnly] = useState(false);
  const [page, setPage] = useState(0);

  const PAGE_SIZE = 30;

  const players = useMemo(() => {
    if (!bootstrap) return [];

    // Pre-compute value score for each player (pts per £1m)
    const withValue = bootstrap.elements.map((p) => ({
      ...p,
      value_score: p.now_cost > 0 ? (p.total_points / (p.now_cost / 10)) : 0,
    }));

    let filtered = withValue.filter((p) => {
      if (posFilter && p.element_type !== posFilter) return false;
      if (teamFilter && p.team !== teamFilter) return false;
      if (p.now_cost > maxPrice * 10) return false;
      if (search && !p.web_name.toLowerCase().includes(search.toLowerCase()) &&
          !p.first_name.toLowerCase().includes(search.toLowerCase()) &&
          !p.second_name.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter === 'available' && p.status !== 'a') return false;
      if (statusFilter === 'injured' && !['i', 'd'].includes(p.status)) return false;
      if (differentialsOnly && parseFloat(p.selected_by_percent) >= 10) return false;
      return true;
    });

    filtered.sort((a, b) => {
      const aVal = parseFloat(a[sortBy]) || 0;
      const bVal = parseFloat(b[sortBy]) || 0;
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });

    return filtered;
  }, [bootstrap, posFilter, teamFilter, maxPrice, sortBy, sortDir, search, statusFilter]);

  const paginated = players.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(players.length / PAGE_SIZE);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
    setPage(0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-fpl-purple border-t-fpl-green rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading player data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-fpl-purple mb-1">Player Scout</h1>
        <p className="text-gray-500 text-sm">
          {players.length} players • sorted by{' '}
          {SORT_OPTIONS.find((s) => s.value === sortBy)?.label}
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="stat-label block mb-1">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Player name…"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-fpl-light-purple"
            />
          </div>

          {/* Position */}
          <div>
            <label className="stat-label block mb-1">Position</label>
            <div className="flex gap-1">
              {POSITIONS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => { setPosFilter(p.value); setPage(0); }}
                  className={`px-2 py-1.5 rounded text-xs font-bold flex-1 transition-colors ${
                    posFilter === p.value
                      ? 'bg-fpl-purple text-fpl-green'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Max price */}
          <div>
            <label className="stat-label block mb-1">
              Max Price: £{maxPrice === 150 ? '15.0m+' : `${(maxPrice / 10).toFixed(1)}m`}
            </label>
            <input
              type="range"
              min={40}
              max={150}
              step={5}
              value={maxPrice}
              onChange={(e) => { setMaxPrice(Number(e.target.value)); setPage(0); }}
              className="w-full accent-fpl-purple"
            />
          </div>

          {/* Status */}
          <div>
            <label className="stat-label block mb-1">Availability</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-fpl-light-purple"
            >
              <option value="all">All players</option>
              <option value="available">Available only</option>
              <option value="injured">Injured / Doubtful</option>
            </select>
          </div>
        </div>

        {/* Differentials toggle */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3">
          <button
            onClick={() => { setDifferentialsOnly(!differentialsOnly); setPage(0); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              differentialsOnly
                ? 'bg-fpl-purple text-fpl-green shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🎯 Differentials only
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${differentialsOnly ? 'bg-fpl-green/30' : 'bg-gray-200'}`}>
              &lt;10% owned
            </span>
          </button>
          {differentialsOnly && (
            <p className="text-xs text-gray-400">Showing only players owned by fewer than 10% of managers</p>
          )}
        </div>

        {/* Team filter */}
        {bootstrap && (
          <div className="mt-3">
            <label className="stat-label block mb-1">Team</label>
            <select
              value={teamFilter}
              onChange={(e) => { setTeamFilter(Number(e.target.value)); setPage(0); }}
              className="w-full sm:w-64 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-fpl-light-purple"
            >
              <option value={0}>All Teams</option>
              {bootstrap.teams
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
            </select>
          </div>
        )}
      </div>

      {/* Sort bar */}
      <div className="flex gap-2 flex-wrap mb-4">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSort(opt.value)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              sortBy === opt.value
                ? 'bg-fpl-purple text-fpl-green'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-fpl-purple'
            }`}
          >
            {opt.label}{' '}
            {sortBy === opt.value && (sortDir === 'desc' ? '↓' : '↑')}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <th className="text-left px-4 py-3 font-semibold">Player</th>
              <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Team</th>
              <th className="text-center px-3 py-3 font-semibold">Pos</th>
              <th className="text-center px-3 py-3 font-semibold">Status</th>
              <th className="text-right px-3 py-3 font-semibold cursor-pointer hover:text-fpl-purple" onClick={() => handleSort('now_cost')}>Price</th>
              <th className="text-right px-3 py-3 font-semibold cursor-pointer hover:text-fpl-purple" onClick={() => handleSort('form')}>Form</th>
              <th className="text-right px-3 py-3 font-semibold cursor-pointer hover:text-fpl-purple" onClick={() => handleSort('points_per_game')}>Pts/G</th>
              <th className="text-right px-3 py-3 font-semibold cursor-pointer hover:text-fpl-purple" onClick={() => handleSort('total_points')}>Pts</th>
              <th className="text-right px-3 py-3 font-semibold hidden md:table-cell cursor-pointer hover:text-fpl-purple" onClick={() => handleSort('ep_next')}>Exp Pts</th>
              <th className="text-right px-3 py-3 font-semibold hidden md:table-cell cursor-pointer hover:text-fpl-purple" onClick={() => handleSort('value_score')}>Value</th>
              <th className="text-right px-3 py-3 font-semibold hidden md:table-cell cursor-pointer hover:text-fpl-purple" onClick={() => handleSort('selected_by_percent')}>Sel%</th>
              <th className="text-right px-3 py-3 font-semibold hidden md:table-cell cursor-pointer hover:text-fpl-purple" onClick={() => handleSort('goals_scored')}>G</th>
              <th className="text-right px-3 py-3 font-semibold hidden md:table-cell cursor-pointer hover:text-fpl-purple" onClick={() => handleSort('assists')}>A</th>
              <th className="text-left px-3 py-3 font-semibold hidden lg:table-cell">Next 5 Fixtures</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginated.map((player) => {
              const team = getTeam(player.team);
              const nextFixtures = getNextFixtures(player.team, 5);
              const form = parseFloat(player.form) || 0;
              const formColor =
                form >= 8 ? 'text-green-600 font-bold' :
                form >= 5 ? 'text-yellow-600' :
                form >= 2 ? 'text-orange-500' : 'text-red-500';

              return (
                <tr key={player.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold text-gray-900">{player.web_name}</p>
                      <p className="text-xs text-gray-400 hidden sm:hidden">{team?.short_name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{team?.name}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${positionColors[player.element_type]}`}>
                      {positionNames[player.element_type]}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <StatusBadge
                      status={player.status}
                      chanceOfPlaying={player.chance_of_playing_next_round}
                      showLabel={false}
                    />
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-fpl-purple">
                    {formatPrice(player.now_cost)}
                  </td>
                  <td className={`px-3 py-3 text-right font-semibold ${formColor}`}>
                    {form.toFixed(1)}
                  </td>
                  <td className="px-3 py-3 text-right text-gray-700">
                    {parseFloat(player.points_per_game).toFixed(1)}
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-gray-900">
                    {player.total_points}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-fpl-light-purple hidden md:table-cell">
                    {parseFloat(player.ep_next).toFixed(1)}
                  </td>
                  <td className="px-3 py-3 text-right hidden md:table-cell">
                    <span className={`text-sm font-bold ${player.value_score >= 8 ? 'text-green-600' : player.value_score >= 5 ? 'text-yellow-600' : 'text-gray-500'}`}>
                      {player.value_score.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right text-gray-600 hidden md:table-cell">
                    {parseFloat(player.selected_by_percent).toFixed(1)}%
                  </td>
                  <td className="px-3 py-3 text-right text-gray-600 hidden md:table-cell">
                    {player.goals_scored}
                  </td>
                  <td className="px-3 py-3 text-right text-gray-600 hidden md:table-cell">
                    {player.assists}
                  </td>
                  <td className="px-3 py-3 hidden lg:table-cell">
                    <div className="flex gap-1">
                      {nextFixtures.map((f, i) => {
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {paginated.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">🔍</p>
            <p>No players match your filters.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded border border-gray-200 text-sm disabled:opacity-40 hover:border-fpl-purple transition-colors"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-500">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page === totalPages - 1}
            className="px-3 py-1.5 rounded border border-gray-200 text-sm disabled:opacity-40 hover:border-fpl-purple transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
