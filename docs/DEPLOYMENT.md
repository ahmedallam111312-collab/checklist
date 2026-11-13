# Critical Ease — Production Deployment Guide
## Complete Step-by-Step Vercel & Cloud Infrastructure Setup

This guide provides end-to-end instructions for deploying **Critical Ease** to Vercel with managed Supabase database and Mux Video streaming. Follow these steps in order.

---

## 1. Prerequisites & Required Accounts

Before beginning, ensure your department or organization owns dedicated institutional accounts for:

1. **GitHub Organization**: To host the private production git repository.
2. **Vercel Team Account**: Pro or Hobby team to host the Next.js production build and automated Crons.
3. **Supabase Organization**: PostgreSQL database, authentication, and image storage.
4. **Mux Account**: Video streaming infrastructure with Signed Playback support.
5. **DNS Registrar / Cloudflare**: To manage DNS records for your official custom domain.

---

## 2. Environment Variables Inventory (NAMES ONLY)

The following table lists every environment variable utilized by Critical Ease.

> [!IMPORTANT]
> **Build-Time Inlining**: Variables prefixed with `NEXT_PUBLIC_*` are statically inlined into client JavaScript bundles during `next build`. They **must** be set in Vercel **before** triggering the initial build. Changing any `NEXT_PUBLIC_*` variable requires a full redeployment (`Redeploy without cache`) to take effect.

| Variable Name | Scope | Required? | Purpose / Feature | Where to Set |
|---|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Public (Client + Server) | **Required** | Production canonical domain (e.g. `https://critical-ease.example.com`). Used for SEO metadataBase, Open Graph / Twitter image URLs, direct-upload CORS origins, sitemap generation, and canonical tags. Fails build if set to localhost in production. | Vercel (Production & Preview), `.env.local` |
| `NEXT_PUBLIC_SUPABASE_URL` | Public (Client + Server) | **Required** | Supabase REST API & Authentication endpoint (`https://<project-ref>.supabase.co`). | Vercel (Production & Preview), `.env.local` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public (Client + Server) | **Required** | Supabase publishable anonymous key for client-side RLS queries. (Alias: `NEXT_PUBLIC_SUPABASE_ANON_KEY`). | Vercel (Production & Preview), `.env.local` |
| `SUPABASE_SECRET_KEY` | **Server-Only** | **Required** | Supabase elevated service-role key for backend operations (admin auth verification, database migrations, initial seeding). Never exposed to browser. | Vercel (Production & Preview), `.env.local` |
| `CRON_SECRET` | **Server-Only** | **Required** | Shared secret token passed in `Authorization: Bearer <CRON_SECRET>` by Vercel Cron to trigger `/api/health` daily and prevent free-tier Supabase database pausing. | Vercel (Production only), `.env.local` |
| `HEALTH_CHECK_SECRET` | **Server-Only** | Optional | Alternative shared secret for `/api/health` pings from external monitors (e.g. GitHub Actions, UptimeRobot). | Vercel, `.env.local` |
| `MUX_TOKEN_ID` | **Server-Only** | Required for Video | Mux API Access Token ID used to create direct uploads and query asset statuses. | Vercel (Production & Preview), `.env.local` |
| `MUX_TOKEN_SECRET` | **Server-Only** | Required for Video | Mux API Access Token Secret. Never exposed to browser. | Vercel (Production & Preview), `.env.local` |
| `MUX_SIGNING_KEY_ID` | **Server-Only** | Required for Video | Mux Signing Key ID used to generate time-limited signed JWT playback tokens for private video streaming. | Vercel (Production & Preview), `.env.local` |
| `MUX_SIGNING_PRIVATE_KEY` | **Server-Only** | Required for Video | Mux RSA private key (Base64-encoded PEM or raw PEM) for signing video playback tokens. | Vercel (Production & Preview), `.env.local` |
| `MUX_WEBHOOK_SECRET` | **Server-Only** | Required for Video | Mux Webhook Signing Secret used to verify HMAC-SHA256 signatures on inbound webhook events (`/api/mux/webhook`). | Vercel (Production & Preview), `.env.local` |
| `NEXT_PUBLIC_USE_DEMO_DATA` | Public | Optional | Offline demo mode toggle. **Must be `false` or unset in production.** Vercel builds fail automatically if set to `true`. | Local `.env.local` only |
| `E2E_ADMIN_EMAIL` | **Server-Only** | Test / Seed | Default administrator email used for automated seed scripts (`scripts/seed-demo.ts`). | Local `.env.test`, `.env.local` |
| `E2E_ADMIN_PASSWORD` | **Server-Only** | Test / Seed | Default administrator password used for automated seed scripts. | Local `.env.test`, `.env.local` |

---

## 3. Step 1: GitHub Repository Creation & Push

1. Create a new private repository under your department's GitHub organization (e.g., `github.com/nursing-dept/critical-ease`).
2. On your deployment workstation, add the official remote and push:
   ```bash
   git remote add origin https://github.com/nursing-dept/critical-ease.git
   git branch -M main
   git push -u origin main
   ```
3. Ensure branch protection rules are enabled on `main` (require pull request reviews and status checks).

---

## 4. Step 2: Supabase Database Setup

1. **Create Project**:
   - Log in to [Supabase](https://supabase.com) and create a new project under your organization (select your nearest AWS region).
   - Set a strong database password and store it in your department password manager.
2. **Apply Migrations in Exact Sequential Order**:
   - Navigate to **SQL Editor** in the Supabase dashboard.
   - Run the migration scripts from `supabase/migrations/` sequentially:
     1. `001_schema.sql` (Creates base tables, RLS policies, `public.admins`, and initial schema)
     2. `002_storage_limits.sql` (Creates `site-images` bucket with 5 MB file size limit)
     3. `003_storage_admin_select.sql` (Restricts storage object operations to verified admins)
     4. `004_video.sql` (Adds Mux video columns, video statuses, and procedure video tracking)
     5. `005_login_rate_limit.sql` (Creates `public.login_attempts` table for brute-force rate limiting)
     6. `006_optimizations.sql` (Adds image `blur_data_url` column and `public.idempotency_keys` table)
3. **Configure Authentication**:
   - Go to **Authentication** > **Providers** > **Email**:
     - Ensure Email provider is enabled.
     - **Disable "Allow new users to sign up"**: Administrative accounts must be created explicitly via Supabase dashboard or SQL to prevent public registration.
4. **Retrieve Credentials**:
   - Go to **Project Settings** > **API**:
     - Copy **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`).
     - Copy **anon / public** key (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
     - Copy **service_role** secret (`SUPABASE_SECRET_KEY`). Store securely.

---

## 5. Step 3: Mux Video Infrastructure Setup

1. **Generate API Access Tokens**:
   - In [Mux Dashboard](https://dashboard.mux.com), go to **Settings** > **Access Tokens**.
   - Create a new token with **Mux Video (Full Access)** permissions.
   - Save the **Token ID** (`MUX_TOKEN_ID`) and **Token Secret** (`MUX_TOKEN_SECRET`).
2. **Generate Signing Key for Private Playback**:
   - Go to **Settings** > **Signing Keys**.
   - Click **Generate new key**.
   - Note the **Key ID** (`MUX_SIGNING_KEY_ID`).
   - Download the private key PEM file. Base64 encode it or copy the raw PEM string to `MUX_SIGNING_PRIVATE_KEY`:
     ```bash
     # Example Linux/macOS Base64 conversion
     base64 -w 0 private_key.pem
     # Example Windows PowerShell Base64 conversion
     [Convert]::ToBase64String([IO.File]::ReadAllBytes("private_key.pem"))
     ```
3. **Configure Webhook**:
   - Go to **Settings** > **Webhooks**.
   - Click **Create new webhook**.
   - Set **URL to receive webhooks**: `https://<YOUR_PRODUCTION_DOMAIN>/api/mux/webhook`.
   - Leave environment as **Production**.
   - Copy the generated **Signing Secret** (`MUX_WEBHOOK_SECRET`).

---

## 6. Step 4: Vercel Project Import

1. In [Vercel Dashboard](https://vercel.com), click **Add New** > **Project**.
2. Select your department GitHub organization and import `critical-ease`.
3. Configure the Project Settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `./`
   - **Build Command**: `next build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

---

## 7. Step 5: Configure Environment Variables in Vercel

In the Vercel project import screen (or under **Settings** > **Environment Variables**):

1. Add every variable from the inventory table above:
   - `NEXT_PUBLIC_SITE_URL` (e.g. `https://critical-ease.example.com` — do NOT use localhost)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`
   - `CRON_SECRET` (generate a 32-character random string: `openssl rand -hex 16`)
   - `HEALTH_CHECK_SECRET` (optional: another random 32-character string)
   - `MUX_TOKEN_ID`
   - `MUX_TOKEN_SECRET`
   - `MUX_SIGNING_KEY_ID`
   - `MUX_SIGNING_PRIVATE_KEY`
   - `MUX_WEBHOOK_SECRET`
2. **Ensure `NEXT_PUBLIC_USE_DEMO_DATA` is NOT set to `true`.**
3. Click **Deploy**.

---

## 8. Step 6: First Deployment Verification (Smoke Test)

Once the Vercel deployment completes successfully:

1. Run the production smoke test suite against your live Vercel URL from your terminal:
   ```bash
   CRON_SECRET="<your-production-cron-secret>" npx tsx scripts/smoke-test.ts https://your-site.vercel.app
   ```
2. Verify that all 18 smoke tests pass:
   - Public pages return HTTP 200 (`/`, `/procedures`, `/about`, `/admin/login`).
   - Unpublished slugs return HTTP 404 (`/procedures/this-does-not-exist`).
   - Protected `/admin` routes redirect to `/admin/login` (HTTP 307).
   - `/api/health` returns HTTP 401 without token, and HTTP 200 `{ ok: true, db: true }` with Bearer token.
   - Strict security headers (`CSP`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Permissions-Policy`, `X-Robots-Tag: noindex` on admin/API) are present.
   - `robots.txt` and `sitemap.xml` are reachable and valid.
   - Zero server variable names or secrets appear anywhere in served HTML or JavaScript chunks.

---

## 9. Step 7: Custom Domain & DNS Setup

1. In Vercel, go to **Settings** > **Domains**.
2. Add your custom domain (e.g. `clinical.university.edu` or `critical-ease.com`).
3. Add the required DNS records at your registrar:
   - For an Apex domain: `A` record pointing to `76.76.21.21`.
   - For a Subdomain: `CNAME` record pointing to `cname.vercel-dns.com`.
4. Wait for SSL certificate generation (automatic via Let's Encrypt in Vercel).
5. Once your custom domain is active:
   - Update `NEXT_PUBLIC_SITE_URL` in Vercel Environment Variables to your custom domain.
   - Trigger a **Redeploy** in Vercel (with `Use existing Build Cache` unchecked) so client bundles inline the new canonical URL.
   - Update the Mux webhook endpoint URL to `https://<CUSTOM_DOMAIN>/api/mux/webhook`.

---

## 10. Step 8: Cron Keep-Alive Verification

To prevent Supabase free-tier database instances from pausing after 7 days of inactivity:

1. `vercel.json` configures a daily cron job scheduled at 06:00 UTC:
   ```json
   {
     "crons": [
       {
         "path": "/api/health",
         "schedule": "0 6 * * *"
       }
     ]
   }
   ```
2. In Vercel Dashboard, go to **Settings** > **Cron Jobs**.
3. Verify that `/api/health` is listed with schedule `0 6 * * *`.
4. Click **Run** manually to test invocation. The response status must be `200` with execution time under 500ms.

---

## 11. Instant Rollback Procedure

If an unintended regression or issue is detected in production:

1. Go to **Deployments** in the Vercel Dashboard.
2. Locate the previous known-good deployment.
3. Click the three dots menu (`...`) next to that deployment and select **Instant Rollback**.
4. Vercel redirects production traffic immediately (within 1 second) without rebuilding.

---

## 12. Secret Rotation Runbook

In the event of key expiration or suspected credential compromise:

| Secret to Rotate | Step-by-Step Procedure | Impact if Done Incorrectly |
|---|---|---|
| **`SUPABASE_SECRET_KEY`** | 1. Go to Supabase > **Project Settings** > **API**.<br>2. Click **Rotate service_role secret**.<br>3. Copy new secret into Vercel env `SUPABASE_SECRET_KEY`.<br>4. Redeploy project. | Admin operations and server-side actions will fail with 401 until Vercel is updated. |
| **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`** | 1. In Supabase > **API**, rotate **anon / public key**.<br>2. Update in Vercel.<br>3. **Trigger full redeploy without cache** (client bundles must inline new key). | Public readers will fail to fetch procedures until client bundles are re-compiled. |
| **`MUX_TOKEN_ID` / `MUX_TOKEN_SECRET`** | 1. Generate new API Access Token in Mux.<br>2. Update `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET` in Vercel.<br>3. Redeploy.<br>4. Revoke old token in Mux. | New video uploads and status polling fail. Existing ready videos continue streaming unaffected. |
| **`MUX_SIGNING_KEY_ID` / `MUX_SIGNING_PRIVATE_KEY`** | 1. Generate new Signing Key in Mux.<br>2. Update both variables in Vercel.<br>3. Redeploy.<br>4. Delete old signing key in Mux. | If deleted from Mux before updating Vercel, video playback tokens will be rejected (HTTP 403 on player). |
| **`MUX_WEBHOOK_SECRET`** | 1. In Mux Dashboard > Webhooks, edit webhook or create new secret.<br>2. Update `MUX_WEBHOOK_SECRET` in Vercel.<br>3. Redeploy. | Webhooks will fail signature verification (HTTP 401). Video status updates will stall in "processing". |
| **`CRON_SECRET`** | 1. Generate new random token (`openssl rand -hex 16`).<br>2. Update `CRON_SECRET` in Vercel.<br>3. Redeploy. | Scheduled keep-alive crons will return HTTP 401 until Vercel Cron settings synchronize. |
