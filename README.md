# FizioFit

All-in-one systém pre fyzioterapeutické centrum s lekárskou starostlivosťou a funkčným tréningom.

## Stack

- **Frontend:** Next.js 14 PWA (mobile-first)
- **DB:** PostgreSQL 15 + Supabase (self-host)
- **Auth:** Supabase Auth
- **Hosting:** Docker Compose na Hetzner VPS
- **Proxy:** Caddy (auto TLS)

## Rýchly štart

```bash
# 1. Klonovať
git clone <repo> fiziofit
cd fiziofit

# 2. Nastaviť premenné
cp .env.example .env
nano .env

# 3. Spustiť
docker compose up -d

# 4. Vytvoriť admin účet cez Supabase Studio
#    → http://SERVER_IP:3002 (prihlásenie cez .env SERVICE_KEY)
```

## Adresáre

```
├── apps/web/          Next.js PWA
├── supabase/          Schema SQL
├── scripts/           Backup, cron, util
├── docker-compose.yml Celý stack
├── Caddyfile          Reverzný proxy
└── .env.example       Vzor premenných
```

## API Endpoints (interné)

| Port | Služba |
|------|--------|
| 3000 | Next.js app |
| 3001 | PostgREST API |
| 3002 | Supabase Studio |
| 4000 | Realtime websocket |
| 5432 | PostgreSQL |
| 9999 | GoTrue Auth |

## Compliance

- GDPR Čl. 9 — zdravotné údaje
- Z. 576/2004 — archivácia 20 rokov
- Z. 18/2018 — ochrana osobných údajov SR
- Všetky súhlasy auditované (timestamp + IP)

## Licencia

Proprietary — ASCENTIA s.r.o.