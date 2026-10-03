# FF Stalk — Cek Akun Free Fire

Web modern cek profil Free Fire **via Player ID**, tanpa login.

HTML/CSS/JS saja **tidak cukup** — data FF diambil lewat API Python.

## File utama
```
main.py      → app FastAPI + serve web
api.py       → endpoint /api/ff + logic lookup
static/      → index.html, style.css, app.js
requirements.txt
```

## Run
```bash
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8080
```
Buka http://localhost:8080

## Deploy (Railway / Render)
Start command:
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

## Endpoint
- `GET /api/ff?id=<uid>`
- `GET /api/ff/batch?ids=id1,id2`
- `GET /api/health`
