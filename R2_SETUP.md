Cloudflare R2 setup

Environment variables (set in your deployment or `.env`):

- `R2_ACCOUNT_ID` — your Cloudflare account id (used to build default endpoint)
- `R2_ACCESS_KEY_ID` — R2 access key id
- `R2_SECRET_ACCESS_KEY` — R2 secret access key
- `R2_BUCKET` — the R2 bucket name to use
- `R2_ENDPOINT` — optional custom endpoint (e.g. https://cdn.example.com). If not set the code will default to `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`.
- `R2_PUBLIC_HOSTNAME` — optional public hostname or URL to construct public object URLs and to add to Next.js `remotePatterns` (if using a custom domain). This can be a domain (e.g. `cdn.example.com`), a full URL (`https://cdn.example.com`), or include a `{bucket}` placeholder (e.g. `https://{bucket}.cdn.example.com`). It is also useful to point to developer preview URLs (for example `https://your-username--project.vercel.app`) when testing uploads in preview deployments.

Notes:

- The API route at `/api/r2/presign` returns a presigned PUT URL and a constructed public URL. The uploader component `components/r2-image-uploader.tsx` demonstrates the client flow.
- Make sure to configure CORS for your R2 bucket (or Cloudflare Worker) to allow `PUT` from your web origin.
- Install SDK packages before running: `pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`.

Quick start — paste your keys

1. Copy the example env into a local file (do not commit this file):

On macOS / Linux:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

2. Open `.env.local` and replace the placeholder values with your R2 credentials and bucket name.

3. Restart the Next.js dev server so the new env vars are picked up.

Sample `.env.example` (already created at the project root):

```
# Cloudflare R2 example env — DO NOT commit real secrets.
R2_ACCOUNT_ID=your_account_id_here
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_BUCKET=your_bucket_name_here
R2_ENDPOINT=
R2_PUBLIC_HOSTNAME=
R2_REGION=auto
```

Note: `.env.local` is ignored by git per `.gitignore`.
