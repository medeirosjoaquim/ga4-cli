import { createServer } from 'node:http';
import { URL } from 'node:url';
import open from 'open';
import { loadClientSecret, loadTokens, saveTokens, clearTokens } from './config.js';

const SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/analytics.manage.users.readonly',
  'https://www.googleapis.com/auth/analytics',
];

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

/**
 * Exchange an authorization code for tokens
 * @param {string} code
 * @param {string} redirectUri
 */
async function exchangeCode(code, redirectUri) {
  const creds = loadClientSecret();
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: creds.client_id,
      client_secret: creds.client_secret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Token exchange failed: ${err.error_description || err.error}`);
  }
  return res.json();
}

/**
 * Refresh an access token using a refresh token
 * @param {string} refreshToken
 */
async function refreshAccessToken(refreshToken) {
  const creds = loadClientSecret();
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: creds.client_id,
      client_secret: creds.client_secret,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Token refresh failed: ${err.error_description || err.error}`);
  }
  return res.json();
}

/**
 * Run the OAuth login flow — opens browser, captures redirect
 */
export async function login() {
  const creds = loadClientSecret();

  return new Promise((resolve, reject) => {
    const server = createServer(async (req, res) => {
      try {
        const url = new URL(req.url, 'http://localhost');
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        if (error) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<h1>Authentication failed</h1><p>You can close this window.</p>');
          server.close();
          reject(new Error(`OAuth error: ${error}`));
          return;
        }

        if (!code) {
          res.writeHead(400);
          res.end('Missing code');
          return;
        }

        const redirectUri = `http://localhost:${server.address().port}`;
        const tokens = await exchangeCode(code, redirectUri);

        saveTokens({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expiry_date: Date.now() + tokens.expires_in * 1000,
        });

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>Authenticated!</h1><p>You can close this window.</p>');
        server.close();
        resolve();
      } catch (err) {
        res.writeHead(500);
        res.end('Error during authentication');
        server.close();
        reject(err);
      }
    });

    server.listen(0, () => {
      const port = server.address().port;
      const redirectUri = `http://localhost:${port}`;
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', creds.client_id);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', SCOPES.join(' '));
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');

      console.log('Opening browser for Google login...');
      open(authUrl.toString());
    });
  });
}

export function logout() {
  clearTokens();
  console.log('Logged out. Stored tokens cleared.');
}

/**
 * Get a valid access token, refreshing if needed
 * @returns {Promise<string>}
 */
export async function getAccessToken() {
  const tokens = loadTokens();
  if (!tokens || !tokens.refresh_token) {
    throw new Error('Not authenticated. Run: analytics-cli login');
  }

  if (tokens.access_token && tokens.expiry_date > Date.now() + 60_000) {
    return tokens.access_token;
  }

  const refreshed = await refreshAccessToken(tokens.refresh_token);
  saveTokens({
    access_token: refreshed.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: Date.now() + refreshed.expires_in * 1000,
  });
  return refreshed.access_token;
}

/**
 * Get info about the currently authenticated user
 */
export async function whoami() {
  const token = await getAccessToken();
  const res = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch user info');
  return res.json();
}
