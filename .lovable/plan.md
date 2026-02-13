

## MT5 Webhook Integration -- Auto-Sync Trades from MetaTrader 5

This plan creates a system where you install a small script (Expert Advisor) on your MT5 desktop terminal, and every time a trade closes, it automatically sends the trade data to your journal -- no manual logging needed.

### How It Works

1. **You generate a unique API key** on a new "MT5 Connection" settings page in the app
2. **You install the provided EA script** into your MT5 terminal (copy-paste a file)
3. **When a trade closes on MT5**, the EA sends the trade details to your journal's backend
4. **The trade appears in your journal automatically**, tagged as "MT5 Auto-Sync"

### What Gets Built

#### 1. Database: API Keys Table

A new `webhook_api_keys` table so each user can generate a personal webhook token:

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| user_id | uuid | Links to user |
| api_key | text | Unique token (generated) |
| label | text | User-friendly name |
| is_active | boolean | Enable/disable key |
| last_used_at | timestamp | Track activity |
| created_at | timestamp | When created |

RLS policies ensure users can only manage their own keys.

#### 2. Backend Function: `mt5-webhook`

A backend function that receives trade data from the MT5 EA:

- Accepts POST requests with an API key in the `X-API-Key` header
- Validates the API key against the database
- Maps MT5 trade fields to the journal's trade format (symbol, direction, prices, volume, profit, etc.)
- Auto-detects asset class (forex/crypto/commodities/stocks)
- Checks for duplicate trades using MT5's ticket number
- Inserts the trade into the `trades` table under the correct user
- Returns success/error response

#### 3. New Page: MT5 Connection Settings

A new page at `/settings/mt5` accessible from the sidebar:

- **Generate API Key** button -- creates a new key and shows it once
- **Copy Webhook URL** -- the endpoint URL to paste into the EA
- **Active Keys list** -- view, disable, or delete keys
- **Setup Instructions** -- step-by-step guide with the downloadable EA code
- **Connection Status** -- shows last sync time and recent auto-synced trades

#### 4. MT5 Expert Advisor Code

A ready-to-use MQL5 script provided on the settings page that the user copies into their MT5 terminal:

- Monitors for closed trades
- Sends trade data (symbol, type, volume, open/close price, SL, TP, profit, open/close time, ticket) as JSON via HTTP POST
- Configurable webhook URL and API key inputs
- Shows success/error notifications on the MT5 chart

### Technical Details

**New files:**
- `supabase/functions/mt5-webhook/index.ts` -- backend function
- `src/pages/MT5Settings.tsx` -- connection settings page
- `src/hooks/useWebhookKeys.tsx` -- hook to manage API keys

**Modified files:**
- `src/App.tsx` -- add `/settings/mt5` route
- `src/components/layout/AppLayout.tsx` -- add sidebar link
- `supabase/config.toml` -- register the new backend function with `verify_jwt = false`

**Database migration:**
- Create `webhook_api_keys` table with RLS policies
- Add `mt5_ticket` column to `trades` table for duplicate detection

**Security:**
- The webhook function uses API key auth (not JWT) since MT5 can't do browser auth
- API keys are hashed before storage; only shown once on creation
- RLS policies restrict key management to the owning user
- Rate limiting via simple timestamp checks

