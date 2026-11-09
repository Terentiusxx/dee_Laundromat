# Dee's Laundromat | Railway deployment

The existing frontend pages are retained from your uploaded project. Backend now supports PostgreSQL. Locally, `docker compose` uses PostgreSQL automatically.

## Your tasks

1. Create a **private GitHub repo**, and push the contents of this `dees-laundromat` directory (not its parent). Never commit `.env` or database files.
2. In Railway, create a project and add **PostgreSQL** (name the service `Postgres`). Leave it private.
3. Add an **API** service from the same GitHub repo. Set Dockerfile Path to `backend/Dockerfile`. Name the service **api**; don't give it a public domain. The container listens on port `8000`.
4. Add a **WEB** service from the same repo. Set Dockerfile Path to `Dockerfile` (repo root). Name it **web**. Generate a Railway public domain for WEB. Container listens on `3000`; the Dockerfile honors Railway's `PORT` if provided.
5. Set the Railway variables below. Redeploy WEB and API. The API creates the PostgreSQL schema through numbered SQL migration files in `backend/migrations/` and seeds service categories when it starts.
6. Create a real admin by running the bootstrap command in the API service shell (below). Use a unique password. Sign in at `/login`.

## Variables to set in Railway

### API service

```dotenv
DATABASE_URL=${{Postgres.DATABASE_URL}}
DEMO_MODE=false
COOKIE_SECURE=true
PUBLIC_ORIGIN=https://YOUR-WEB-DOMAIN.up.railway.app
ALLOWED_ORIGINS=https://YOUR-WEB-DOMAIN.up.railway.app
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
```

Set the `PUBLIC_ORIGIN` and `ALLOWED_ORIGINS` to the exact Railway URL for the **web** service, with **no trailing slash**. Leave SMTP blank until you configure an email provider. `DATABASE_URL` must be a **reference variable**, not a database password pasted into a file. If your database service has a different name, update `Postgres` in the reference.

### WEB service

```dotenv
API_INTERNAL_ORIGIN=http://api.railway.internal:8000
```

`api` must match the Railway service name. Because this address is read on the server at runtime, it never appears in the browser.

## Administrator creation

In the **api** service command shell, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` securely, then run:

```bash
python -m backend.bootstrap_admin
```

The script requires a password of at least 14 characters. If Railway's UI doesn't offer a usable shell, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` temporarily as API service variables, then use Railway CLI to run the command inside the service environment, and remove the password variable afterwards. Never put credentials in Git.

## Local PostgreSQL setup

```bash
docker compose up -d --build
```

Visit `http://localhost:3000`. The demo accounts are enabled **only** in the local Compose file. The PostgreSQL data persists in Docker volume `postgres_data`.

If the older SQLite app has data you need, the new DB won't import it automatically. See the optional importer below.

## Copy existing SQLite records (optional)

If migrating existing records, first make a backup of your SQLite file. With an empty initialized PostgreSQL database and both URLs accessible, run:

```bash
SQLITE_SOURCE=/path/to/dees.sqlite3 DATABASE_URL='postgres://...' python scripts/import_sqlite.py
```

The importer preserves IDs and adjusts sequences; it refuses an already populated destination. This is a one-off operation, not a recurring synchronization. If you don't need existing local accounts and orders, skip it.

## Notes

- Do not expose the PostgreSQL service publicly.
- API remains on Railway private networking; only WEB gets a public domain.
- Keep `DEMO_MODE=false` on Railway, and use new administrator credentials.
- Schema change process: add the next numbered SQL file to `backend/migrations` and deploy. Each migration runs once and is recorded in `schema_migrations`.
- The API uses `/api/health` for a health check.
- When using Railway, log in through the **web** URL, not the internal API hostname.
