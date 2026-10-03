"""
FF Stalk — web cek akun Free Fire via Player ID.
Jalankan: uvicorn main:app --host 0.0.0.0 --port 8080
"""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from api import router as api_router

BASE = os.path.dirname(os.path.abspath(__file__))
STATIC = os.path.join(BASE, "static")

app = FastAPI(title="FF Stalk", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

if os.path.isdir(STATIC):
    app.mount("/static", StaticFiles(directory=STATIC), name="static")


@app.get("/")
async def index():
    path = os.path.join(STATIC, "index.html")
    if os.path.isfile(path):
        return FileResponse(path)
    return {"message": "FF Stalk — GET /api/ff?id=<uid>"}


@app.get("/favicon.ico")
async def favicon():
    return JSONResponse(status_code=204, content=None)
