import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const CONFIG_DIR = join(homedir(), '.ga-cli');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
const TOKENS_FILE = join(CONFIG_DIR, 'tokens.json');

const CLIENT_SECRET_PATH = join(
  process.cwd(),
  'client_secret.json'
);

function ensureConfigDir() {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/** @returns {{ defaultProperty?: string, clientSecretPath?: string, outputFormat?: string }} */
export function loadConfig() {
  ensureConfigDir();
  if (!existsSync(CONFIG_FILE)) return {};
  return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
}

/** @param {Record<string, unknown>} updates */
export function saveConfig(updates) {
  ensureConfigDir();
  const config = { ...loadConfig(), ...updates };
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

/** @returns {{ access_token: string, refresh_token: string, expiry_date: number } | null} */
export function loadTokens() {
  if (!existsSync(TOKENS_FILE)) return null;
  return JSON.parse(readFileSync(TOKENS_FILE, 'utf-8'));
}

/** @param {{ access_token: string, refresh_token: string, expiry_date: number }} tokens */
export function saveTokens(tokens) {
  ensureConfigDir();
  writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
}

export function clearTokens() {
  ensureConfigDir();
  if (existsSync(TOKENS_FILE)) {
    writeFileSync(TOKENS_FILE, '');
  }
}

/** @returns {{ client_id: string, client_secret: string, redirect_uris: string[] }} */
export function loadClientSecret() {
  if (!existsSync(CLIENT_SECRET_PATH)) {
    throw new Error(`Client secret not found at: ${CLIENT_SECRET_PATH}\nPlace your OAuth client secret JSON in the project root.`);
  }
  const raw = JSON.parse(readFileSync(CLIENT_SECRET_PATH, 'utf-8'));
  return raw.installed || raw.web;
}

export { CONFIG_DIR, TOKENS_FILE };
