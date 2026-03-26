import { useState, useMemo } from 'react';
import { useFPL } from '../context/FPLContext';
import StatusBadge from '../components/StatusBadge';

const positionColors = {
  1: 'bg-yellow-400 text-yellow-900',
  2: 'bg-green-500 text-white',
  3: 'bg-blue-500 text-white',
  4: 'bg-red-500 text-white',
};
const positionNames = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };

function PriceChangeCell({ value }) {
  if (value === 0) return <span className="text-gray-400 text-sm font-semibold">–</span>;
  const positive = value > 0;
  return (
    <span className={`text-sm font-black ${positive ? 'text-green-600' : 'text-red-500'}`}>
      {positive ? '▲' : '▼'} £{Math.abs(value / 10).toFixed(1)}m
    </span>
  );
}

const TABS = [
  { key: 'risers', label: '📈 Risers', desc: 'Players who have risen in price this season' },
  { key: 'fallers', label: '📉 Fallers', desc: 'Players who have fallen in price this season' },
  { key: 'gw', label: '⚡ This GW', desc: 'Price changes since the last gameweek deadline' },
  { key: 'your_team', label: '👕 Your Team', desc: 'Price changes for players in your squad' },
];

export default function PriceChanges() {
  const { bootstrap, userTeam, loading, getTeam, formatPrice } = useFPL();
  const [tab, setTab] = useState('risers');
  const [posFilter, setPosFilter] = useState(0);

  const players = useMemo(() => {
    if (!bootstrap) return [];

    let list = [...bootstrap.elements];

    if (posFilter) list = list.filter((p) => p.element_type === posFilter);

    if (tab === 'risers') {
      return list
        .filter((p) => p.cost_change_start > 0)
        .sort((a, b) => b.cost_change_start - a.cost_change_start);
    }
    if (tab === 'fallers') {
      return list
        .filter((p) => p.cost_change_start < 0)
        .sort((a, b) => a.cost_change_start - b.cost_change_start);
    }
    if (tab === 'gw') {
      return list
        .filter((p) => p.cost_change_event !== 0)
        .sort((a, b) => Math.abs(b.cost_change_event) - Math.abs(a.cost_change_event));
    }
    if (tab === 'your_team') {
      if (!userTeam) return [];
      const squadIds = new Set(userTeam.picks.map((p) => p.element));
      return list
        .filter((p) => squadIds.has(p.id))
        .sort((a, b) => b.cost_change_start - a.cost_change_start);
    }
    return list;
  }, [bootstrap, tab, posFilter, userTeam]);

  const currentTab = TABS.find((t) => t.key === tab);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-12 h-12 border-4 border-fpl-purple border-t-fpl-green rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-fpl-purple mb-1">Price Changes</h1>
        <p className="text-gray-500 text-sm">
          Track player price movements since the season started and since last deadline.
          Buy before they rise, sell before they fall.
        </p>
      </div>

      {/* Summary cards */}
      {bootstrap && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            {
              label: 'Risen this season',
              value: bootstrap.elements.filter((p) => p.cost_change_start > 0).length,
              color: 'text-green-600',
              icon: '📈',
            },
            {
              label: 'Fallen this season',
              value: bootstrap.elements.filter((p) => p.cost_change_start < 0).length,
              color: 'text-red-500',
              icon: '📉',
            },
            {
              label: 'Changed this GW',
              value: bootstrap.elements.filter((p) => p.cost_change_event !== 0).length,
              color: 'text-fpl-purple',
              icon: '⚡',
            },
            {
              label: 'Unchanged',
              value: bootstrap.elements.filter((p) => p.cost_change_start === 0).length,
              color: 'text-gray-500',
              icon: '➡️',
            },
          ].map((s) => (
            <div key={s.label} className="card text-center">
              <p className="text-2xl mb-1">{s.icon}</p>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="stat-label mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            disabled={t.key === 'your_team' && !userTeam}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === t.key
                ? 'bg-fpl-purple text-fpl-green shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-fpl-purple disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            {t.label}
            {t.key === 'your_team' && !userTeam && (
              <span className="ml-1 text-[10px]">(no team)</span>
            )}
          </button>
        ))}
      </div>

      {/* Position filter */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-gray-500 font-medium">Position:</span>
        {[{ label: 'All', value: 0 }, { label: 'GKP', value: 1 }, { label: 'DEF', value: 2 }, { label: 'MID', value: 3 }, { label: 'FWD', value: 4 }].map((p) => (
          <button
            key={p.value}
            onClick={() => setPosFilter(p.value)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
              posFilter === p.value ? 'bg-fpl-purple text-fpl-green' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400 mb-3 italic">{currentTab?.desc}</p>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-fpl-purple text-white text-xs uppercase tracking-wide">
              <th className="text-left px-4 py-3">Player</th>
              <th className="text-left px-4 py-3 hidden sm:table-cell">Team</th>
              <th className="text-center px-3 py-3">Pos</th>
              <th className="text-center px-3 py-3 hidden sm:table-cell">Status</th>
              <th className="text-right px-3 py-3">Current Price</th>
              <th className="text-right px-3 py-3 hidden sm:table-cell">Start Price</th>
              <th className="text-right px-3 py-3">Season Change</th>
              <th className="text-right px-4 py-3">GW Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {players.slice(0, 100).map((player) => {
              const team = getTeam(player.team);
              const startPrice = player.now_cost - player.cost_change_start;
              const inSquad = userTeam?.picks.some((p) => p.element === player.id);

              return (
                <tr
                  key={player.id}
                  className={`transition-colors hover:bg-gray-50 ${inSquad ? 'bg-fpl-purple/5' : ''}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {inSquad && (
                        <span className="text-[10px] font-black bg-fpl-purple text-fpl-green px-1 py-0.5 rounded shrink-0">
                          YOURS
                        </span>
                      )}
                      <span className="font-semibold text-gray-900">{player.web_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{team?.name}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${positionColors[player.element_type]}`}>
                      {positionNames[player.element_type]}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center hidden sm:table-cell">
                    <StatusBadge status={player.status} chanceOfPlaying={player.chance_of_playing_next_round} showLabel={false} />
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-fpl-purple">
                    {formatPrice(player.now_cost)}
                  </td>
                  <td className="px-3 py-3 text-right text-gray-500 hidden sm:table-cell">
                    {formatPrice(startPrice)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <PriceChangeCell value={player.cost_change_start} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <PriceChangeCell value={player.cost_change_event} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {players.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">💸</p>
            <p>No price changes found for this filter.</p>
          </div>
        )}
      </div>

      <p className="text-xs text-center text-gray-400 mt-4">
        Price changes happen at each gameweek deadline based on net transfers in/out.
        Players rise or fall by £0.1m per threshold of transfers.
      </p>
    </div>
  );
}
