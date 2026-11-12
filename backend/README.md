# Meridian API

ASP.NET Core 10 Web API for the Meridian CRM. Supabase is the database
(Postgres) and the identity provider (Supabase Auth).

| Part      | Technology                                   |
|-----------|----------------------------------------------|
| Back end  | ASP.NET Core 10 · REST controllers           |
| Database  | Supabase (Postgres) via the Supabase Data API, protected by Row Level Security |
| Auth      | Supabase Auth (email + password), JWTs verified by the API against the project's JWKS |
| Front end | React (Vite) — `../src`                      |

## How it fits together

```
React app ──/api──▶ Meridian.Api ──(user's JWT)──▶ Supabase Data API ──▶ Postgres (RLS)
                         │
                         └────────────────────────▶ Supabase Auth (sign-up / sign-in / refresh)
```

The API holds only the public **anon key**. Each data request is made with the
signed-in user's own token, so Postgres Row Level Security is the real security
boundary: signed-in users share one CRM workspace; anonymous callers get nothing.

## First-time setup

1. **Create the tables** — Supabase dashboard → SQL Editor → New query → paste
   [`../supabase/schema.sql`](../supabase/schema.sql) → Run.
2. **Roles** — put your sign-in email on the `>>>` line of
   [`../supabase/roles.sql`](../supabase/roles.sql), then run it (you become Admin).
3. **Profile photos** — run [`../supabase/profiles-update.sql`](../supabase/profiles-update.sql)
   (adds the photo column and a secure `avatars` storage bucket; also limits the team list
   to Admin / CEO / Manager).
4. **Check the roles** *(optional)* — run [`../supabase/test-roles.sql`](../supabase/test-roles.sql).
   It creates throw-away users for each role, tries every action under Row Level Security,
   lists PASS / FAIL, and rolls everything back.
5. **Sign-in codes (two-step sign-in)** — Supabase → Authentication → Emails → **Magic Link**
   template: the email must show the code. Replace the body with, for example:
   ```html
   <h2>Your Meridian sign-in code</h2>
   <p>Enter this code to finish signing in:</p>
   <p style="font-size:28px;font-weight:bold;letter-spacing:6px">{{ .Token }}</p>
   <p>It expires in 10 minutes. If you didn't try to sign in, you can ignore this email.</p>
   ```
   **Important:** Supabase's built-in email service only sends a few emails per hour, which is
   not enough for a code at every sign-in. Set up your own SMTP server (Authentication → Emails →
   SMTP Settings — e.g. Brevo, Resend, SendGrid, Gmail) before going live. To switch the code
   step off, set `Auth:RequireEmailOtp` to `false`.
6. *(Optional, demos only)* **Load dummy data + demo login** —
   [`../supabase/seed.sql`](../supabase/seed.sql). To take the dummy rows out again, run
   [`../supabase/remove-dummy-data.sql`](../supabase/remove-dummy-data.sql) (your own records are kept).
7. **Run the API and the web app together** (from the repo root):
   ```bash
   npm run dev:all
   ```
   Or in two terminals: `npm run dev:api` (API on http://localhost:5080) and `npm run dev` (web app).
   The web app calls the API through Vite's `/api` proxy, so **the API must be running** — otherwise
   every request fails with "The Meridian API is not running".
8. **Check it**: open http://localhost:5080/health. `Healthy` means the API is up *and* Supabase is
   reachable; `Unhealthy` prints the reason (for example a paused/deleted project or a wrong `Supabase:Url`).

Email confirmation is ON in this Supabase project, so new sign-ups must click the
emailed link before they can sign in. To skip that in development: Supabase →
Authentication → Sign In / Providers → Email → turn off "Confirm email".

## WhatsApp (QR linking)

`whatsapp-service/` is a small Node service that lets each user link **their own** WhatsApp by
scanning a QR code in **Settings → WhatsApp** (WhatsApp → Linked devices → Link a device), like
WhatsApp Web. The green WhatsApp button on leads, deals, contacts and accounts then sends the
record's details as a message from that number. Users who haven't linked get "Open WhatsApp"
with the message ready instead.

- `npm run dev` starts it with the API and website (or `npm run dev:whatsapp` on its own).
- It listens on `127.0.0.1:5090` only and accepts requests only from the API (shared secret in
  `whatsapp-service/.service-secret`, created on first start). Browsers never reach it directly.
- Linked sessions are stored in `whatsapp-service/sessions/`: treat that folder like passwords
  (both are git-ignored). Users reconnect automatically after a restart.
- Sending is limited to 15 messages per minute per user, one recipient at a time.
- **Important:** this uses WhatsApp Web linking (the Baileys library), not Meta's official
  WhatsApp Business API. It is against WhatsApp's terms, so a number that sends a lot or gets
  reported can be restricted or banned. Message people who expect it, keep volumes low, and
  consider the official API for high volumes.

## Email (each user's own mailbox)

Run [`../supabase/email-update.sql`](../supabase/email-update.sql) once. Then each user opens
**Settings → Email**, picks their provider (Gmail, Outlook, Microsoft 365, Yahoo, Zoho or a custom
SMTP server) and enters their email plus an **app password**. The API signs in to the mail server
once to check the details, then stores the password encrypted (ASP.NET Data Protection) in
`public.email_accounts`, where Row Level Security lets each user see only their own row.

The envelope button on leads, deals, contacts and accounts writes an email from that address
(`POST /api/email/send`, 20 per minute per user). Users without a connected email get
"Open in email app" instead. Custom SMTP servers must be public (no localhost or private
addresses) and use port 465, 587, 25 or 2525. If the API's encryption keys change (for example
after moving servers), users simply connect their email again.

## Configuration (`appsettings.json`)

| Key                          | Purpose |
|------------------------------|---------|
| `Supabase:Url`               | Project URL |
| `Supabase:AnonKey`           | Public anon key (safe to ship; never put the service-role key here) |
| `Supabase:EmailRedirectUrl`  | Where confirmation / reset emails send the user |
| `Supabase:ServiceRoleKey`    | *Optional, secret.* Lets Admins/CEOs create users who can sign in at once (no confirmation email). Set with `dotnet user-secrets set "Supabase:ServiceRoleKey" "…" --project backend/Meridian.Api` or the `Supabase__ServiceRoleKey` env var — never in this file |
| `Auth:AllowPublicSignUp`     | `false` (default): only Admins/CEOs create accounts on the Users page |
| `Auth:RequireEmailOtp`       | `true` (default): after the password, a code is emailed and must be entered |
| `Auth:EmailOtpLength`        | Digits in that code — must match Supabase → Authentication → Email OTP length (default 6) |
| `WhatsApp:ServiceUrl`        | The WhatsApp link service (default `http://127.0.0.1:5090`) |
| `WhatsApp:ServiceSecret`     | Shared secret with that service; by default read from `whatsapp-service/.service-secret` |
| `Cors:AllowedOrigins`        | Browser origins allowed to call the API directly |

Any value can be overridden with environment variables, e.g. `Supabase__Url`.

## Endpoints

Auth (`/api/auth`): `POST login` (password → emails a code and returns a signed `challenge`) ·
`POST verify-otp` (`challenge` + code → session) · `POST resend-otp` · `POST refresh` · `POST logout` ·
`GET me` · `POST forgot-password` · `POST resend-confirmation` · `POST register` (off by default).
Sign-in endpoints are rate-limited (10 requests / minute / IP). Sessions carry the CRM role
(`accessRole`: Admin, CEO, Manager, Employee); inactive accounts cannot sign in.

Users (`/api/users`): `GET` list (Admin, CEO, Manager) · `POST` create (Admin, CEO) ·
`PATCH /{id}` role / active / name (Admin, CEO; not your own role) ·
`GET|PATCH /me` own name and job title · `PUT /me/avatar` (multipart `file`, JPEG/PNG/WebP ≤ 2 MB) ·
`DELETE /me/avatar`.

Roles are enforced three times: Row Level Security in Postgres (`supabase/roles.sql`),
`[RequireRole]` filters in the API, and hidden actions in the web app. Error responses never
contain database wording: known Postgres/PostgREST codes become plain sentences.

CRM resources — `/api/accounts`, `/api/contacts`, `/api/leads`, `/api/deals` —
all require `Authorization: Bearer <access token>`:

| Method | Path            | Notes |
|--------|-----------------|-------|
| GET    | `/`             | `search`, `sort`, `order`, `limit` (≤1000), `offset`, plus filters (e.g. `status`, `stage`, `source`). Total in `X-Total-Count`. |
| GET    | `/{id}`         | 404 when missing |
| POST   | `/`             | Create; id is generated when omitted |
| PUT    | `/{id}`         | Replace |
| DELETE | `/{id}`         | 204 / 404 |
| POST   | `/batch`        | `{ "upsert": [...], "delete": ["id", ...] }` — used by imports and bulk edits |

Errors are RFC 7807 problem responses (`title`, `status`, and `errors` for validation).
In Development the OpenAPI document is served at `/openapi/v1.json`.

## Tests

```bash
dotnet test backend
```
