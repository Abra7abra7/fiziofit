# FizioFit — Komplexný systém pre fyzioterapeutické centrum s tréningami

## Prehľad

FizioFit je **all-in-one systém** pre zdravotnícke zariadenie kombinujúce fyzioterapiu, lekársku starostlivosť a funkčný tréning. PWA aplikácia na mobile aj desktope, self-hosted na klientovom Hetzner VPS.

## Architektúra

```
Pacient (mobil)  Doktor (tablet)  Fyzio (tablet)  Tréner (mobil)
       │                │               │               │
       └────────────────┴───────────────┴───────────────┘
                            │
                    NEXT.JS PWA (App Router)
                            │
                    SUPABASE (self-host)
                    Auth | DB | RLS | Storage
                            │
                    HETZNER VPS (klient)
                    Docker | Caddy | PostgreSQL
                    Zálohy: Hetzner Storage Box
```

## Stack

| Vrstva | Technológia |
|--------|-------------|
| Frontend | Next.js 14 + Tailwind CSS + shadcn/ui |
| PWA | @serwist/next (offline, manifest, push) |
| DB | PostgreSQL 15 + Supabase schema |
| Auth | Supabase Auth (email + magic link) |
| RLS | Row Level Security |
| Hosting | Docker Compose na Hetzner VPS |
| Proxy | Caddy (auto TLS, Let's Encrypt) |
| Zálohy | pg_dump cron → Hetzner Storage Box |

## Role

| Rola | Skratka | Rozsah |
|------|---------|--------|
| Admin | `admin` | Plný prístup |
| Doktor | `doctor` | Diagnózy, lieky, anamnéza, obmedzenia |
| Fyzioterapeut | `physio` | Rehab plány, cvičenia, monitoring bolesti |
| Tréner | `trainer` | Tréningové plány, logbook, len obmedzenia |
| Pacient | `patient` | Svoje rezervácie, diagnostika, cvičenia, súhlasy |

## Dátová schéma

### Hlavné tabuľky

- `profiles` — meno, rola, tel., dátum narodenia
- `patients` — rodné číslo, poistovňa, lekár (FK)
- `medical_records` — anamnéza, alergie, lieky, operácie
- `diagnoses` — ICD-10 kód, popis, dátum, lekár (FK)
- `restrictions` — obmedzenia pre tréning, stanovené lekárom
- `appointments` — pacient, odborník, dátum, typ, status
- `physio_plans` — pacient, fyzio, cieľ, začiatok, koniec
- `physio_exercises` — plán, cvik, série, opakovania, bolesť (0-10)
- `training_plans` — pacient, tréner, cieľ, začiatok, koniec
- `training_logs` — plán, cvik, séria, opakovania, váha, RPE
- `exercise_library` — názov, popis, svalová skupina, typ
- `diagnostic_questions` — text, typ, step_order, category, is_health
- `diagnostic_results` — pacient, answers (JSONB), completed
- `consent_logs` — pacient, typ, verzia, timestamp, IP

## Cena pre klienta

| Položka | Suma |
|---------|------|
| Vývoj (8 týždňov) | €4500-8000 |
| Hetzner VPS + Storage Box | €11/mes (priamo klient) |
| Maintenance (voliteľný) | €200-400/mes |
| Apple Developer (neskôr) | €99/rok |