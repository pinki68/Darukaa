# PostgreSQL setup — `DarukaDB`

**All application data** (users, projects, site polygons, daily metrics) is stored in PostgreSQL database **`DarukaDB`**.

Tables:

| Table          | Contents                                                                     |
| -------------- | ---------------------------------------------------------------------------- |
| `users`        | Administrators (JWT auth)                                                    |
| `projects`     | Project name, description, owner                                             |
| `sites`        | Site metadata + **polygon boundary** (PostGIS `geometry` or dev SQLite JSON) |
| `site_metrics` | 90-day (and growing) analytics time series                                   |

## Configure connection

Edit **`backend/.env`** (preferred):

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_real_password
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
POSTGRES_DB=DarukaDB
```

Or set a full URL:

```env
DATABASE_URL=postgresql://postgres:your_real_password@127.0.0.1:5432/DarukaDB
```

## One-time database setup

Run `backend/scripts/init_darukadb.sql` in pgAdmin or psql, or:

```sql
CREATE DATABASE "DarukaDB";
\c DarukaDB
CREATE EXTENSION IF NOT EXISTS postgis;
```

## Start API (creates tables + seed in DarukaDB)

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Verify:

```bash
curl http://127.0.0.1:8000/api/health
```

Expected:

```json
{
  "status": "ok",
  "database": {
    "engine": "postgresql",
    "database": "DarukaDB",
    "postgis": true,
    "configured_name": "DarukaDB"
  }
}
```

If `database_error` appears, fix password or create the database.

Create tables manually (same as API startup):

```bash
cd backend
python -m app.db_init
python scripts/check_db.py
```

### Why `DarukaDB` is empty but the app still works

Tables and seed data are created **only when the API starts and connects successfully** to `DarukaDB`. If pgAdmin shows no tables, the backend is usually **not** talking to that database yet.

Common causes:

1. **Wrong password in `backend/.env`** — connection fails; a **new** API start will exit with an error. An **old** process on port `8000` may still answer requests using connections opened earlier (different password or even SQLite).
2. **Stale API on port 8000** — stop it, fix `.env`, then restart from `backend`:
   ```powershell
   Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess -Force
   cd backend
   python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
3. **Wrong database in pgAdmin** — confirm you are connected to **`DarukaDB`** on the same host/port as `POSTGRES_HOST` / `POSTGRES_PORT`.

After a successful start, you should see `users`, `projects`, `sites`, and `site_metrics` under `DarukaDB` → Schemas → public → Tables.

## Optional SQLite (not DarukaDB)

Only for quick tests without PostgreSQL:

```env
DATABASE_URL=sqlite:///./darukae_dev.db
```

Production and your setup should use **`DarukaDB`**.
