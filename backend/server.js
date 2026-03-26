require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const mongoose = require('mongoose');

const app = express();

const IS_PROD = process.env.NODE_ENV === 'production';
const FRONTEND_URL = IS_PROD
  ? 'https://fpl-helper-1.onrender.com'
  : 'http://localhost:3000';
const BACKEND_URL = IS_PROD
  ? 'https://fpl-helper-1.onrender.com'
  : 'http://localhost:3001';

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://fpl-helper-1.onrender.com',
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

// ── MongoDB ───────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log(' MongoDB connected'))
  .catch((err) => console.error(' MongoDB error:', err.message));

// ── User model ────────────────────────────────────────────────────────────────
const User = mongoose.model('User', new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email:    String,
  name:     String,
  picture:  String,
  fplTeamId: String,
}));

// ── Session ───────────────────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'fpl-helper-dev-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: {
    secure: IS_PROD,
    sameSite: IS_PROD ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
}));

// ── Passport / Google OAuth ───────────────────────────────────────────────────
passport.use(new GoogleStrategy(
  {
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  `${BACKEND_URL}/auth/google/callback`,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        user = await User.create({
          googleId: profile.id,
          email:    profile.emails?.[0]?.value,
          name:     profile.displayName,
          picture:  profile.photos?.[0]?.value,
        });
      }
      done(null, user);
    } catch (err) {
      done(err);
    }
  }
));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

app.use(passport.initialize());
app.use(passport.session());

// ── Auth routes ───────────────────────────────────────────────────────────────
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/?auth=failed` }),
  (req, res) => {
    if (req.user.fplTeamId) {
      res.redirect(`${FRONTEND_URL}/?teamId=${req.user.fplTeamId}`);
    } else {
      res.redirect(`${FRONTEND_URL}/?auth=success`);
    }
  }
);

app.get('/auth/me', (req, res) => {
  res.json({ user: req.user || null });
});

app.post('/auth/save-team', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    await User.findByIdAndUpdate(req.user.id, { fplTeamId: String(req.body.teamId) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/auth/logout', (req, res) => {
  req.logout(() => res.redirect(FRONTEND_URL));
});

// ── FPL API proxy ─────────────────────────────────────────────────────────────
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

app.get('/api/bootstrap', async (req, res) => {
  try { res.json(await fplGet(`${FPL_BASE}/bootstrap-static/`)); }
  catch (err) { console.error('Bootstrap error:', err.message); res.status(500).json({ error: err.message }); }
});

app.get('/api/fixtures', async (req, res) => {
  try { res.json(await fplGet(`${FPL_BASE}/fixtures/`)); }
  catch (err) { console.error('Fixtures error:', err.message); res.status(500).json({ error: err.message }); }
});

app.get('/api/player/:id', async (req, res) => {
  try { res.json(await fplGet(`${FPL_BASE}/element-summary/${req.params.id}/`)); }
  catch (err) { console.error('Player error:', err.message); res.status(500).json({ error: err.message }); }
});

app.get('/api/entry/:teamId', async (req, res) => {
  try { res.json(await fplGet(`${FPL_BASE}/entry/${req.params.teamId}/`)); }
  catch (err) { console.error('Entry error:', err.message); res.status(500).json({ error: err.message }); }
});

app.get('/api/entry/:teamId/picks/:gw', async (req, res) => {
  try { res.json(await fplGet(`${FPL_BASE}/entry/${req.params.teamId}/event/${req.params.gw}/picks/`)); }
  catch (err) { console.error('Picks error:', err.message); res.status(500).json({ error: err.message }); }
});

app.get('/api/entry/:teamId/history', async (req, res) => {
  try { res.json(await fplGet(`${FPL_BASE}/entry/${req.params.teamId}/history/`)); }
  catch (err) { console.error('History error:', err.message); res.status(500).json({ error: err.message }); }
});

app.post('/api/login', async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) return res.status(400).json({ error: 'Email and password are required.' });
  try {
    const loginRes = await axios.post(
      'https://users.premierleague.com/accounts/login/',
      new URLSearchParams({ login, password, app: 'plfpl-web', redirect_uri: 'https://fantasy.premierleague.com/a/login' }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': HEADERS['User-Agent'], 'Referer': 'https://fantasy.premierleague.com/' }, maxRedirects: 5, validateStatus: (s) => s < 500 }
    );
    const rawCookies = [].concat(loginRes.headers['set-cookie'] || []);
    if (!rawCookies.length) return res.status(401).json({ error: 'Login failed. Check your email and password.' });
    const cookieString = rawCookies.map((c) => c.split(';')[0]).join('; ');
    const meRes = await axios.get('https://fantasy.premierleague.com/api/me/', {
      headers: { ...HEADERS, Cookie: cookieString }, validateStatus: (s) => s < 500,
    });
    if (meRes.status !== 200 || !meRes.data?.player?.entry) return res.status(401).json({ error: 'Login failed. Please check your credentials and try again.' });
    const { entry, first_name, last_name } = meRes.data.player;
    res.json({ entry, first_name, last_name });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login request failed. Please try again.' });
  }
});

app.get('/api/event/:gw/live', async (req, res) => {
  try { res.json(await fplGet(`${FPL_BASE}/event/${req.params.gw}/live/`)); }
  catch (err) { console.error('Live event error:', err.message); res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n FPL Helper API running on http://localhost:${PORT}`);
  console.log(` Auth: Google OAuth ${IS_PROD ? '(production)' : '(development)'}\n`);
});
