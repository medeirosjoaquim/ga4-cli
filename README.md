# analytics-cli

Node.js CLI for read-only access to Google Analytics 4 data. Queries the GA4 Data API and Admin API via OAuth 2.0.

## Google Cloud Console Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top and select **New Project**
3. Name it (e.g. `analytics-cli`) and click **Create**

### 2. Enable the Required APIs

In your project, go to **APIs & Services > Library** and enable both:

- **Google Analytics Data API** — for running reports, realtime, cohort, funnel queries
- **Google Analytics Admin API** — for listing accounts, properties, streams, users, settings

### 3. Configure the OAuth Consent Screen

Go to **APIs & Services > OAuth consent screen**:

1. Choose **External** user type (or **Internal** if using Google Workspace and only need org access)
2. Fill in the app name and your email as support contact
3. On the **Scopes** step, add these three scopes:

| Scope | Purpose |
|---|---|
| `https://www.googleapis.com/auth/analytics.readonly` | Read GA4 report data |
| `https://www.googleapis.com/auth/analytics.manage.users.readonly` | Read user permissions on accounts/properties |
| `https://www.googleapis.com/auth/analytics` | Read property configuration (custom dimensions, audiences, etc.) |

4. On the **Test users** step, add the Google account(s) that will use the CLI
5. Click **Save**

> **Note:** While the app is in "Testing" status, only the listed test users can authenticate. You don't need to publish the app for personal/team use.

### 4. Create OAuth Credentials

Go to **APIs & Services > Credentials**:

1. Click **Create Credentials > OAuth client ID**
2. Application type: **Desktop app**
3. Name it anything (e.g. `analytics-cli`)
4. Click **Create**
5. Click **Download JSON** on the confirmation dialog
6. Rename the downloaded file to `client_secret.json` and place it in the project root

The file is gitignored and should never be committed.

## Installation

```
pnpm install
```

### Option A: Run from source

```
node src/index.js <command>
```

### Option B: Build the binary

```
pnpm build
./bin/analytics-cli <command>
```

To make it available globally, symlink or add `bin/` to your PATH.

## Authentication

```
analytics-cli login
```

This opens your browser to Google's OAuth consent screen. After granting access, tokens are saved to `~/.ga-cli/tokens.json`.

```
analytics-cli whoami    # check current user
analytics-cli logout    # clear stored tokens
```

Tokens auto-refresh. You only need to re-login if the refresh token is revoked.

## Usage

See [llms.txt](./llms.txt) for the full command reference including all report types, filters, batch queries, admin commands, and common GA4 dimensions/metrics.

### Quick Start

```bash
# List your accounts
analytics-cli accounts list

# List properties for an account
analytics-cli properties list <accountId>

# Run a report
analytics-cli report run <propertyId> \
  --dimensions pagePath \
  --metrics sessions,activeUsers \
  --start 2025-01-01 --end 2025-01-31 \
  --json

# Discover available dimensions and metrics
analytics-cli metadata dimensions <propertyId>
analytics-cli metadata metrics <propertyId>
```

### Global Flags

- `--json` — output raw JSON
- `--csv` — output as CSV
- `--output <filepath>` — write to file instead of stdout
- `--property <id>` — set and save a default property
- `--verbose` — show full error stack traces
