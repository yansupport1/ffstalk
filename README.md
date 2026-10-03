# Free Fire Profile Lookup API + Web UI

Unofficial API + modern frontend untuk lookup profil publik Free Fire by **Player ID / Account ID (UID)**.

> ⚠️ Endpoint upstream unofficial bisa putus atau berubah format kapan saja.  
> Data private (password, email, HP, saldo diamond/gold) **tidak pernah** diambil → selalu `null`.

## Fitur

- `GET /api/ff?id=<uid>` — profil detail
- `GET /api/ff/batch?ids=id1,id2` — batch max 5
- `GET /api/health`
- CORS allow-all (testing)
- Frontend modern: glass card, smooth animation, dark theme
- Fallback multi-sumber (primary FFxAPI)

## Quick start

```bash
cd backend
pip install -r ../requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8080
```

Buka: http://localhost:8080

## Contoh curl

```bash
# Single
curl -s "http://localhost:8080/api/ff?id=1704140050" | jq

# Batch
curl -s "http://localhost:8080/api/ff/batch?ids=1704140050,305000592" | jq

# Health
curl -s "http://localhost:8080/api/health"
```

## Contoh response (sukses)

```json
{
  "ok": true,
  "data": {
    "player_id": "1704140050",
    "nickname": "^_^Masud^_^",
    "level": 58,
    "exp": 730297,
    "region": "BD",
    "account_created_at": "2019-12-30T11:53:04.000Z",
    "account_created_year": 2019,
    "rank_br": 322,
    "rank_cs": 311,
    "ranking_points_br": 4169,
    "ranking_points_cs": 38,
    "prime_level": 1,
    "diamond": null,
    "gold": null,
    "liked": 2857,
    "signature": "I LOVE FREE FIRE MAX!!.",
    "avatar_url": null,
    "banner_url": "http://ffxinfo-ffx.ffxapis.workers.dev/api/banner/banner_1704140050.webp",
    "clan": null,
    "favorite_weapons": ["MP5 - Achiever", "Malevolent Shrine"],
    "vehicles": null,
    "animations": null,
    "vault": null,
    "pet": {
      "id": "Falco",
      "name": "Falco",
      "level": 4,
      "exp": 540,
      "skill": "Skyline Spree",
      "skin": "Pet Skin: Cyber Falco"
    },
    "clothes": ["Gym Uniform (Shoes)", "Default", "..."],
    "last_login": "2026-09-22T11:33:31.000Z",
    "credit_score": 100,
    "title": "6 Years Old",
    "release_version": "OB55",
    "raw": null
  },
  "error": null,
  "source": "ffxapi"
}
```

## Field biasanya tersedia vs sering null

| Field | Biasanya ada? | Keterangan |
|-------|---------------|------------|
| player_id, nickname, level, region | ✅ | Inti profil |
| exp, liked, last_login, created_at | ✅ | Sering ada |
| rank_br / rank_cs, ranking_points | ✅ | Angka rank (bukan nama tier) |
| signature / bio | ✅ | Jika diisi pemain |
| clan / guild | ⚠️ | Hanya jika join clan |
| pet | ⚠️ | Jika punya pet aktif |
| clothes / outfit, weapons | ⚠️ | Nama item equipped |
| prime_level | ⚠️ | Kadang ada |
| banner_url | ⚠️ | Relative/absolute dari upstream |
| avatar_url | ❌ sering null | Banyak sumber hanya kasih ID |
| diamond, gold | ❌ selalu null | Private |
| vehicles, animations, vault | ❌ sering null | Jarang diekspos publik |
| email, password, phone | ❌ tidak diambil | Private |

## Env (opsional)

| Variable | Default | Desc |
|----------|---------|------|
| `FF_PRIMARY_URL` | FFxAPI ffinfo | Upstream utama |
| `FF_FALLBACK_URL` | (kosong) | URL fallback jika primary gagal |
| `FF_TIMEOUT` | 12 | Timeout detik |
| `FF_INCLUDE_RAW` | 0 | Set 1 atau `?include_raw=true` untuk payload mentah |

## Deploy

1. Upload seluruh folder `ff-lookup`
2. Install deps: `pip install -r requirements.txt`
3. Run: `uvicorn backend.main:app --host 0.0.0.0 --port 8080`  
   (atau set `WORKDIR` ke folder `backend` lalu `uvicorn main:app ...`)
4. Reverse proxy (nginx/caddy) ke port 8080 jika perlu HTTPS

Struktur:

```
ff-lookup/
├── backend/main.py
├── static/          # frontend (HTML/CSS/JS)
├── requirements.txt
└── README.md
```

## Disclaimer

Bukan produk resmi Garena. Gunakan hanya data publik untuk keperluan legal (bot info, dashboard, dll). Hormati rate-limit upstream.
