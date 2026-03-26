const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const FPL_BASE = 'https://fantasy.premierleague.com/api';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-GB,en;q=0.9',
  'Referer': 'https://fantasy.premierleague.com/',
};

const fplGet = async (url) => {
  const response = await axios.get(url, { headers: HEADERS, timeout: 15000 });
  return response.data;
};

// All players, teams, gameweeks, events
app.get('/api/bootstrap', async (req, res) => {
  try {
    const data = await fplGet(`${FPL_BASE}/bootstrap-static/`);
    res.json(data);
  } catch (err) {
    console.error('Bootstrap error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// All fixtures
app.get('/api/fixtures', async (req, res) => {
  try {
    const data = await fplGet(`${FPL_BASE}/fixtures/`);
    res.json(data);
  } catch (err) {
    console.error('Fixtures error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Individual player stats & fixture history
app.get('/api/player/:id', async (req, res) => {
  try {
    const data = await fplGet(`${FPL_BASE}/element-summary/${req.params.id}/`);
    res.json(data);
  } catch (err) {
    console.error('Player error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Team entry info (manager name, rank, etc.)
app.get('/api/entry/:teamId', async (req, res) => {
  try {
    const data = await fplGet(`${FPL_BASE}/entry/${req.params.teamId}/`);
    res.json(data);
  } catch (err) {
    console.error('Entry error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Team picks for a specific gameweek
app.get('/api/entry/:teamId/picks/:gw', async (req, res) => {
  try {
    const data = await fplGet(`${FPL_BASE}/entry/${req.params.teamId}/event/${req.params.gw}/picks/`);
    res.json(data);
  } catch (err) {
    console.error('Picks error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Team history (all past GW points)
app.get('/api/entry/:teamId/history', async (req, res) => {
  try {
    const data = await fplGet(`${FPL_BASE}/entry/${req.params.teamId}/history/`);
    res.json(data);
  } catch (err) {
    console.error('History error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Login with FPL credentials → returns team ID (credentials are never stored)
app.post('/api/login', async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // Step 1: authenticate with PL identity service
    const loginRes = await axios.post(
      'https://users.premierleague.com/accounts/login/',
      new URLSearchParams({
        login,
        password,
        app: 'plfpl-web',
        redirect_uri: 'https://fantasy.premierleague.com/a/login',
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': HEADERS['User-Agent'],
          'Referer': 'https://fantasy.premierleague.com/',
        },
        maxRedirects: 5,
        validateStatus: (s) => s < 500,
      }
    );

    // Collect session cookies from all redirect responses
    const rawCookies = [].concat(loginRes.headers['set-cookie'] || []);
    if (!rawCookies.length) {
      return res.status(401).json({ error: 'Login failed. Check your email and password.' });
    }
    const cookieString = rawCookies.map((c) => c.split(';')[0]).join('; ');

    // Step 2: fetch current user profile using the session
    const meRes = await axios.get('https://fantasy.premierleague.com/api/me/', {
      headers: { ...HEADERS, Cookie: cookieString },
      validateStatus: (s) => s < 500,
    });

    if (meRes.status !== 200 || !meRes.data?.player?.entry) {
      return res.status(401).json({ error: 'Login failed. Please check your credentials and try again.' });
    }

    const { entry, first_name, last_name } = meRes.data.player;
    res.json({ entry, first_name, last_name });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login request failed. Please try again.' });
  }
});

// Gameweek live data (points scored in current GW)
app.get('/api/event/:gw/live', async (req, res) => {
  try {
    const data = await fplGet(`${FPL_BASE}/event/${req.params.gw}/live/`);
    res.json(data);
  } catch (err) {
    console.error('Live event error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n FPL Helper API proxy running on http://localhost:${PORT}`);
  console.log(` Fetching data from ${FPL_BASE}\n`);
});
