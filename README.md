# FF Stalk — Cek Akun Free Fire

Website modern untuk **cek profil Free Fire lewat Player ID**.  
Tanpa login. Hanya data publik.

Backend API **Python (FastAPI)** — dipakai web, bukan file utama yang ditonjolkan.

## Fitur web
- Input Player ID → hasil: nickname, level, rank BR/CS, likes, exp, clan, pet, outfit, bio, dll.
- UI dark modern, animasi smooth, mobile-friendly
- Tombol Tempel, contoh ID, deep-link `?id=...`
- Tidak menampilkan diamond/gold/email/password (privat)

## Jalankan lokal

```bash
pip install -r requirements.txt
cd backend
uvicorn main:app --host 0.0.0.0 --port 8080
```

Buka http://localhost:8080

Atau: `./run.sh`

## Deploy (disarankan)

**Railway / Render** — Start command:

```bash
cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
```

Vercel kurang cocok untuk FastAPI + static seperti ini.

## API (backend pendukung)

- `GET /api/ff?id=<uid>`
- `GET /api/ff/batch?ids=id1,id2`
- `GET /api/health`

Sumber data unofficial (bisa putus kapan saja).

## Struktur

```
ff-lookup/
├── static/          ← WEB (inti produk)
│   ├── index.html
│   ├── style.css
│   └── app.js
├── backend/
│   └── main.py      ← API Python
├── requirements.txt
└── run.sh
```
