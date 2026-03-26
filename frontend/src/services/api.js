// In development, Vite proxies /api → localhost:3001
// In production, VITE_API_URL points to the deployed backend
const BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api';
const AUTH_BASE = import.meta.env.VITE_API_URL || '';

const get = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
};

export const fetchBootstrap = () => get(`${BASE_URL}/bootstrap`);
export const fetchFixtures  = () => get(`${BASE_URL}/fixtures`);
export const fetchPlayer    = (id) => get(`${BASE_URL}/player/${id}`);
export const fetchEntry     = (teamId) => get(`${BASE_URL}/entry/${teamId}`);
export const fetchPicks     = (teamId, gw) => get(`${BASE_URL}/entry/${teamId}/picks/${gw}`);
export const fetchHistory   = (teamId) => get(`${BASE_URL}/entry/${teamId}/history`);
export const fetchLive      = (gw) => get(`${BASE_URL}/event/${gw}/live`);

export const loginWithFPL = async (login, password) => {
  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
};

// ── Google auth ───────────────────────────────────────────────────────────────
export const fetchAuthUser = () =>
  fetch(`${AUTH_BASE}/auth/me`, { credentials: 'include' }).then((r) => r.json());

export const saveTeamToAccount = (teamId) =>
  fetch(`${AUTH_BASE}/auth/save-team`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamId }),
  }).then((r) => r.json());

export const getGoogleSignInUrl = () => `${AUTH_BASE}/auth/google`;
export const getLogoutUrl       = () => `${AUTH_BASE}/auth/logout`;
