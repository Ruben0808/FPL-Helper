import { useFPL } from '../context/FPLContext';
import DifficultyBadge from './DifficultyBadge';
import StatusBadge from './StatusBadge';

const positionColors = {
  GKP: 'bg-yellow-400 text-yellow-900',
  DEF: 'bg-green-500 text-white',
  MID: 'bg-blue-500 text-white',
  FWD: 'bg-red-500 text-white',
};

export default function PlayerCard({ player, showNextFixtures = true, compact = false }) {
  const { getTeam, getPositionName, getNextFixtures, formatPrice } = useFPL();

  if (!player) return null;

  const team = getTeam(player.team);
  const position = getPositionName(player.element_type);
  const nextFixtures = showNextFixtures ? getNextFixtures(player.team, 5) : [];
  const form = parseFloat(player.form) || 0;
  const ppg = parseFloat(player.points_per_game) || 0;

  const formColor =
    form >= 8 ? 'text-green-600 font-bold' :
    form >= 5 ? 'text-yellow-600 font-semibold' :
    form >= 3 ? 'text-orange-500' :
    'text-red-500';

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-fpl-light-purple transition-colors">
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${positionColors[position]}`}>
          {position}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{player.web_name}</p>
          <p className="text-xs text-gray-500">{team?.name}</p>
        </div>
        <StatusBadge status={player.status} chanceOfPlaying={player.chance_of_playing_next_round} showLabel={false} />
        <span className={`text-sm ${formColor}`}>{form.toFixed(1)}</span>
        <span className="text-sm font-bold text-fpl-purple">{formatPrice(player.now_cost)}</span>
      </div>
    );
  }

  return (
    <div className="card hover:shadow-md transition-shadow group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${positionColors[position]}`}>
              {position}
            </span>
            <StatusBadge
              status={player.status}
              chanceOfPlaying={player.chance_of_playing_next_round}
            />
          </div>
          <h3 className="font-bold text-gray-900 truncate">{player.web_name}</h3>
          <p className="text-sm text-gray-500">{team?.name}</p>
        </div>
        <div className="text-right ml-2">
          <p className="text-lg font-black text-fpl-purple">{formatPrice(player.now_cost)}</p>
          <p className="text-xs text-gray-400">Price</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 mb-3 bg-gray-50 rounded-lg p-2">
        <div className="text-center">
          <p className={`text-lg font-bold ${formColor}`}>{form.toFixed(1)}</p>
          <p className="stat-label">Form</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-800">{ppg.toFixed(1)}</p>
          <p className="stat-label">Pts/Game</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-800">{player.total_points}</p>
          <p className="stat-label">Total Pts</p>
        </div>
      </div>

      {/* Ownership */}
      <div className="flex items-center justify-between mb-3 text-sm">
        <span className="text-gray-500">Selected by</span>
        <span className="font-semibold">{parseFloat(player.selected_by_percent).toFixed(1)}%</span>
      </div>

      {/* Next fixtures */}
      {showNextFixtures && nextFixtures.length > 0 && (
        <div>
          <p className="stat-label mb-1.5">Next {nextFixtures.length} Fixtures</p>
          <div className="flex gap-1 flex-wrap">
            {nextFixtures.map((fixture, i) => {
              const oppTeam = getTeam(fixture.opponent);
              return (
                <DifficultyBadge
                  key={i}
                  difficulty={fixture.difficulty}
                  opponent={oppTeam?.short_name}
                  isHome={fixture.isHome}
                  size="sm"
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
