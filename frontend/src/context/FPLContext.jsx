import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { fetchBootstrap, fetchFixtures, fetchEntry, fetchPicks, fetchAuthUser, saveTeamToAccount } from '../services/api';

const FPLContext = createContext(null);

export function FPLProvider({ children }) {
  const [bootstrap, setBootstrap]   = useState(null);
  const [fixtures, setFixtures]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [userTeam, setUserTeam]     = useState(null);
  const [currentGW, setCurrentGW]   = useState(null);
  const [googleUser, setGoogleUser] = useState(null); // { name, email, picture, fplTeamId }

  // Load FPL bootstrap data + check Google session on mount
  useEffect(() => {
    const load = async () => {
      try {
        const [bsData, fixturesData, authData] = await Promise.all([
          fetchBootstrap(),
          fetchFixtures(),
          fetchAuthUser(),
        ]);
        setBootstrap(bsData);
        setFixtures(fixturesData);
        const current = bsData.events.find((e) => e.is_current);
        const next    = bsData.events.find((e) => e.is_next);
        setCurrentGW((current || next || bsData.events[0])?.id || 1);
        if (authData.user) setGoogleUser(authData.user);
      } catch (err) {
        setError('Failed to load FPL data. Make sure the backend server is running.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const loadTeam = useCallback(
    async (teamId, saveToAccount = false) => {
      if (!bootstrap || !currentGW) return;
      try {
        const [entry, picks] = await Promise.all([
          fetchEntry(teamId),
          fetchPicks(teamId, currentGW),
        ]);
        const enrichedPicks = picks.picks.map((pick) => {
          const player = bootstrap.elements.find((p) => p.id === pick.element);
          return { ...pick, player };
        });
        setUserTeam({
          entry,
          picks: enrichedPicks,
          chips: picks.active_chip,
          availableChips: entry.chips || [],
          itbRaw: picks.entry_history?.bank ?? 0,
          transfersAvailable: picks.entry_history?.event_transfers_cost === 0 ? 1 : 0,
        });
        // If signed in with Google and asked to save, persist the team ID
        if (saveToAccount && googleUser) {
          saveTeamToAccount(teamId).catch(() => {});
          setGoogleUser((u) => ({ ...u, fplTeamId: String(teamId) }));
        }
        return true;
      } catch (err) {
        console.error('Load team error:', err);
        throw new Error('Team not found. Check your Team ID and try again.');
      }
    },
    [bootstrap, currentGW, googleUser]
  );

  const clearTeam = useCallback(() => setUserTeam(null), []);

  const getPlayer = useCallback(
    (id) => bootstrap?.elements?.find((p) => p.id === id),
    [bootstrap]
  );

  const getTeam = useCallback(
    (id) => bootstrap?.teams?.find((t) => t.id === id),
    [bootstrap]
  );

  const getPositionName = useCallback((elementType) => {
    return { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' }[elementType] ?? '???';
  }, []);

  const getNextFixtures = useCallback(
    (teamId, count = 6) => {
      if (!fixtures.length || !currentGW) return [];
      return fixtures
        .filter(
          (f) =>
            !f.finished &&
            f.event >= currentGW &&
            (f.team_h === teamId || f.team_a === teamId)
        )
        .slice(0, count)
        .map((f) => {
          const isHome = f.team_h === teamId;
          return {
            ...f,
            isHome,
            opponent: isHome ? f.team_a : f.team_h,
            difficulty: isHome ? f.team_h_difficulty : f.team_a_difficulty,
          };
        });
    },
    [fixtures, currentGW]
  );

  const getGWType = useCallback(
    (teamId, gw) => {
      const count = fixtures.filter(
        (f) => f.event === gw && (f.team_h === teamId || f.team_a === teamId)
      ).length;
      if (count === 0) return 'blank';
      if (count >= 2) return 'double';
      return 'normal';
    },
    [fixtures]
  );

  const specialGWs = useMemo(() => {
    if (!bootstrap || !fixtures.length || !currentGW) return { blanks: {}, doubles: {} };
    const gwRange = Array.from({ length: 8 }, (_, i) => currentGW + i);
    const blanks  = {};
    const doubles = {};
    gwRange.forEach((gw) => {
      bootstrap.teams.forEach((team) => {
        const count = fixtures.filter(
          (f) => f.event === gw && (f.team_h === team.id || f.team_a === team.id)
        ).length;
        if (count === 0) { blanks[gw]  = blanks[gw]  || []; blanks[gw].push(team.id); }
        if (count >= 2)  { doubles[gw] = doubles[gw] || []; doubles[gw].push(team.id); }
      });
    });
    return { blanks, doubles };
  }, [bootstrap, fixtures, currentGW]);

  const formatPrice = (rawPrice) => `£${(rawPrice / 10).toFixed(1)}m`;

  return (
    <FPLContext.Provider
      value={{
        bootstrap,
        fixtures,
        loading,
        error,
        userTeam,
        currentGW,
        googleUser,
        loadTeam,
        clearTeam,
        getPlayer,
        getTeam,
        getPositionName,
        getNextFixtures,
        getGWType,
        specialGWs,
        formatPrice,
      }}
    >
      {children}
    </FPLContext.Provider>
  );
}

export const useFPL = () => {
  const ctx = useContext(FPLContext);
  if (!ctx) throw new Error('useFPL must be used within FPLProvider');
  return ctx;
};
