## RIP Addons

Track Wowhead articles and addon impact severity related to the Midnight API/addon changes. Built with Next.js (App Router), Tailwind, and Supabase. Hosts on Vercel.

### Features
- Curated list of Wowhead articles with AI-assisted relevance and severity (yellow→red)
- Overall addon impact aggregation
- Admin UI to add/delete custom article links with AI suggestions

### Tech
- Next.js 14 App Router, TypeScript, Tailwind CSS
- Supabase Postgres + RLS for data storage
- Optional OpenRouter for AI classify/summarize/suggest (set `OPENROUTER_API_KEY`)

---

## Local Development

### 1) Prereqs
- Node 18+ and pnpm or npm
- Supabase project (or local `supabase start`)

### 2) Create Supabase project and apply schema
Run the SQL migrations in order inside your Supabase SQL editor (or `psql`):

1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_submissions.sql`
3. `supabase/migrations/0003_safe_severity.sql`

### 3) Configure env
Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key   # required for admin writes (server-only)
ADMIN_PASSWORD=choose_a_strong_password           # for simple cookie-based admin login
OPENROUTER_API_KEY=your_key_optional              # enables AI classify/summarize/suggest
OPENROUTER_MODEL=gpt-5-mini                       # default; override if desired
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1  # default; override if desired
NEXT_PUBLIC_FEEDBACK_EMAIL=optional@domain.tld    # optional footer display
NEXT_PUBLIC_SITE_URL=http://localhost:3000        # used for robots/sitemap when deployed
SUBMISSION_IP_PEPPER=optional_pepper              # optional pepper for submission IP hashing
```

### 4) Install and run

```
pnpm install
pnpm dev
```

Visit `http://localhost:3000`.

---

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, import the project.
3. Set Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD`
   - `OPENROUTER_API_KEY` (optional)
   - `OPENROUTER_MODEL` (optional)
   - `OPENROUTER_BASE_URL` (optional)
4. Build & deploy. Add the SQL schema to your Supabase project.

### Notes
- For admin write operations from API routes, configure a Supabase Service Role key and perform writes server-side using it or via edge functions; current setup expects running trusted environment on server routes. For simple setups, you can grant writes temporarily or run admin tasks manually.
- External fetching/scraping must respect Wowhead terms; we only store links/metadata and do not copy content.

---

## How to use
- Home: quick navigation.
- Articles: view added Wowhead links with severity.
- Addons: overall impact view.
- Admin: add/delete links, request AI suggestions.


---

## API Overview

All admin actions require a cookie `mh_admin=1`. Log in via `POST /api/admin/login` with `ADMIN_PASSWORD`.

### Articles
- `GET /api/articles` → `{ articles: [...], count }`
- `POST /api/articles` (admin) body: `{ url }` → inserts article, best-effort AI classify/summarize and suggested impacts
- `DELETE /api/articles?id=<uuid>` (admin)

### Article impacts
- `POST /api/article-impacts` (admin) body: `{ article_id, addon_name, severity }` where severity 0–5
- `DELETE /api/article-impacts?article_id=<uuid>&addon_name=<name>` (admin)
- `GET /api/article-impacts/suggest?article_id=<uuid>` (admin) → `{ suggestions: [{ addon_name, category, severity }] }`

### Overall impacts
- `GET /api/overall-impacts` → `{ impacts: [{ addon_name, severity }] }` (avg over recorded impacts)

### Impacted addons feed (public)
- `GET /api/impacted` → versioned feed with CORS, cache, and ETag; supports `HEAD` for ETag

### Admin utilities
- `POST /api/admin/login` body: `{ password }` → sets `mh_admin` cookie
- `POST /api/admin/logout` → clears cookie
- `GET /api/admin/me` → `{ isAdmin }`
- `GET /api/admin/debug` → env sanity + DB check (admin)
- `POST /api/admin/seed` → inserts a test article (admin)
- `POST /api/admin/clear` → deletes all articles (admin)
- `POST /api/admin/revalidate-impacts` → revalidate cache tag (admin)
- `POST /api/ingest-wowhead-rss` (admin) body options: `{ limit, strictness: 'low'|'medium'|'high', dryRun, concurrency, selected }`

### Submissions (public suggestions)
- `POST /api/submissions` body: `{ url, title?, notes?, addons: [{ addon_name, severity }], website? }`
  - Rate limits per IP hash: 3/15min, 20/day (pepper via `SUBMISSION_IP_PEPPER`)
  - Admin auto-approval promotes to article and impacts
- `GET /api/submissions` (admin) → `{ submissions: [...] }`
- `PATCH /api/submissions` (admin) body: `{ id, action: 'approve'|'discard' }`

### Article infographic
- `GET /api/article-infographic/[id]` → SVG summary of impact counts (image/svg+xml)


---

## Public impacted addons feed

Endpoint: `GET /api/impacted`

Response schema:

```json
{
  "version": "YYYY-MM-DD",
  "items": [
    {
      "slug": "dbmcore",
      "severity": "high",
      "note": "Update required",
      "link": "https://ripaddons.com/article/..."
    }
  ]
}
```

Rules
- `slug`: normalized addon folder name: lowercase and remove non-alphanumerics. Examples: `DBM-Core` → `dbmcore`, `WeakAuras` → `weakauras`.
- `severity`: one of `critical | high | medium | low | unknown`. Mapping from numeric inputs: 0–1→low, 2→medium, 3–4→high, 5→critical.
- `note` and `link`: optional short reason and canonical article URL.
- `version`: today’s UTC date string unless data versioning is added later.
- Items aggregate per addon slug across articles; the highest severity wins. Note/link preference is deterministic.
- Items are sorted alphabetically by slug.

Caching
- CORS: `Access-Control-Allow-Origin: *`
- Cache: `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`
- ETag: stable SHA-256 of the JSON body; `If-None-Match` yields `304 Not Modified` when matched.

Windows PowerShell-safe cURL

```powershell
# User-run: fetch impacted feed
curl.exe -sS -X GET http://localhost:3000/api/impacted
```

macOS/Linux cURL

```bash
curl -sS -X GET http://localhost:3000/api/impacted
```


