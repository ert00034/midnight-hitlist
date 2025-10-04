## Midnight Hitlist

Track Wowhead articles and addon impact severity related to the Midnight API/addon changes. Built with Next.js (App Router), Tailwind, and Supabase. Hosts on Vercel.

### Features
- Curated list of Wowhead articles with AI-assisted relevance and severity (yellow→red)
- Overall addon impact aggregation
- Admin UI to add/delete custom article links with AI suggestions

### Tech
- Next.js 14 App Router, TypeScript, Tailwind CSS
- Supabase Postgres + RLS for data storage
- Optional OpenAI for classification (set `OPENAI_API_KEY`)

---

## Local Development

### 1) Prereqs
- Node 18+ and pnpm or npm
- Supabase project (or local `supabase start`)

### 2) Create Supabase project and apply schema
Run the SQL in `supabase/migrations/0001_init.sql` inside your Supabase SQL editor (or `psql`).

### 3) Configure env
Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_key_optional
OPENAI_MODEL=gpt-4o-mini
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key   # required for admin writes
ADMIN_PASSWORD=choose_a_strong_password           # for simple cookie-based admin login
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
   - `OPENAI_API_KEY` (optional)
   - `OPENAI_MODEL` (optional)
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


