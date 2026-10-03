"""
API routes + logic lookup profil Free Fire (unofficial).
Sumber: FFxAPI publik (tanpa key). Bisa putus kapan saja.
Data private (diamond/gold/email/password) → selalu null.
"""

from __future__ import annotations

import os
import re
from datetime import datetime, timezone
from typing import Any, Optional

import httpx
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

PRIMARY_URL = os.getenv(
    "FF_PRIMARY_URL",
    "http://ffxinfo-ffx.ffxapis.workers.dev/ffinfo",
)
FALLBACK_URL = os.getenv("FF_FALLBACK_URL", "")
TIMEOUT = float(os.getenv("FF_TIMEOUT", "12"))
MAX_BATCH = 5
UID_RE = re.compile(r"^\d{5,15}$")

router = APIRouter()


class PlayerData(BaseModel):
    player_id: Optional[str] = None
    nickname: Optional[str] = None
    level: Optional[int] = None
    exp: Optional[int] = None
    region: Optional[str] = None
    account_created_at: Optional[str] = None
    account_created_year: Optional[int] = None
    rank_br: Optional[Any] = None
    rank_cs: Optional[Any] = None
    ranking_points_br: Optional[int] = None
    ranking_points_cs: Optional[int] = None
    prime_level: Optional[int] = None
    diamond: Optional[int] = None
    gold: Optional[int] = None
    liked: Optional[int] = None
    signature: Optional[str] = None
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None
    clan: Optional[dict] = None
    favorite_weapons: Optional[list] = None
    vehicles: Optional[list] = None
    animations: Optional[list] = None
    vault: Optional[list] = None
    pet: Optional[dict] = None
    clothes: Optional[list] = None
    last_login: Optional[str] = None
    credit_score: Optional[int] = None
    title: Optional[str] = None
    release_version: Optional[str] = None
    raw: Optional[dict] = Field(default=None)


class ApiResponse(BaseModel):
    ok: bool
    data: Optional[PlayerData] = None
    error: Optional[str] = None
    source: Optional[str] = None


def _safe_int(v: Any) -> Optional[int]:
    if v is None:
        return None
    try:
        return int(v)
    except (TypeError, ValueError):
        return None


def _parse_ts(val: Any) -> Optional[str]:
    if val is None:
        return None
    if isinstance(val, str):
        if val.isdigit():
            val = int(val)
        else:
            try:
                datetime.fromisoformat(val.replace("Z", "+00:00"))
                return val if "T" in val else None
            except Exception:
                return val
    if isinstance(val, (int, float)):
        try:
            return datetime.fromtimestamp(int(val), tz=timezone.utc).isoformat()
        except Exception:
            return None
    return None


def _year_from(iso_or_ts: Any) -> Optional[int]:
    s = _parse_ts(iso_or_ts)
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00")).year
    except Exception:
        return None


def map_ffxapi(raw: dict) -> PlayerData:
    data = raw.get("data") or {}
    identity = data.get("identity") or {}
    profile = data.get("profile") or {}
    account = data.get("account_info") or {}
    rank = data.get("rank_info") or {}
    equipped = data.get("equipped_items") or {}
    pet = data.get("pet_details") or {}
    guild = data.get("guild_info") or {}

    created = profile.get("created_at") or account.get("createAt")
    last_login = profile.get("last_login") or account.get("lastLoginAt")

    clan = None
    if guild.get("name") or guild.get("id"):
        clan = {
            "id": str(guild["id"]) if guild.get("id") is not None else None,
            "name": guild.get("name"),
            "level": _safe_int(guild.get("level")),
            "members": (guild.get("members") or {}).get("current"),
            "capacity": (guild.get("members") or {}).get("capacity"),
        }

    pet_obj = None
    if pet.get("name") or pet.get("id"):
        pet_obj = {
            "id": pet.get("id"),
            "name": pet.get("name"),
            "level": _safe_int(pet.get("level")),
            "exp": _safe_int(pet.get("exp")),
            "skill": pet.get("skill_id"),
            "skin": pet.get("skin_id"),
        }

    weapons = equipped.get("weapon") or []
    if isinstance(weapons, str):
        weapons = [weapons]
    outfits = equipped.get("outfit") or []
    if isinstance(outfits, str):
        outfits = [outfits]

    banner = profile.get("banner_image")
    if banner and isinstance(banner, str) and banner.startswith("/"):
        banner = "http://ffxinfo-ffx.ffxapis.workers.dev" + banner

    return PlayerData(
        player_id=str(identity.get("uid") or ""),
        nickname=identity.get("username") or profile.get("nickname"),
        level=_safe_int(profile.get("level")),
        exp=_safe_int(account.get("exp")),
        region=identity.get("region"),
        account_created_at=_parse_ts(created),
        account_created_year=_year_from(created),
        rank_br=rank.get("br_max_rank") or rank.get("br_rank"),
        rank_cs=rank.get("cs_max_rank") or rank.get("cs_rank"),
        ranking_points_br=_safe_int(rank.get("br_rank_points")),
        ranking_points_cs=_safe_int(rank.get("cs_rank_points")),
        prime_level=_safe_int(profile.get("prime_level") or account.get("booyah_pass")),
        diamond=None,
        gold=None,
        liked=_safe_int(profile.get("likes") or account.get("liked")),
        signature=profile.get("bio") or account.get("signature"),
        avatar_url=None,
        banner_url=banner,
        clan=clan,
        favorite_weapons=weapons or None,
        vehicles=None,
        animations=None,
        vault=None,
        pet=pet_obj,
        clothes=outfits or None,
        last_login=_parse_ts(last_login),
        credit_score=_safe_int(account.get("credit_score")),
        title=account.get("title"),
        release_version=account.get("release_version"),
        raw=raw if os.getenv("FF_INCLUDE_RAW", "0") == "1" else None,
    )


def map_generic(raw: dict) -> PlayerData:
    basic = raw.get("basicInfo") or raw.get("AccountInfo") or raw
    profile = raw.get("profileInfo") or {}
    social = raw.get("socialInfo") or {}
    clan_raw = raw.get("clanBasicInfo") or raw.get("Guild") or {}
    pet_raw = raw.get("petInfo") or {}

    created = basic.get("createAt") or basic.get("created_at")
    last_login = basic.get("lastLoginAt") or basic.get("last_login")

    clan = None
    if clan_raw.get("clanName") or clan_raw.get("guildName") or clan_raw.get("clanId"):
        clan = {
            "id": str(clan_raw.get("clanId") or clan_raw.get("guildId") or ""),
            "name": clan_raw.get("clanName") or clan_raw.get("guildName"),
            "level": _safe_int(clan_raw.get("clanLevel") or clan_raw.get("guildLevel")),
            "members": _safe_int(clan_raw.get("memberNum") or clan_raw.get("guildMembers")),
            "capacity": _safe_int(clan_raw.get("capacity")),
        }

    pet_obj = None
    if pet_raw.get("id") or pet_raw.get("name"):
        pet_obj = {
            "id": str(pet_raw.get("id")) if pet_raw.get("id") is not None else None,
            "name": pet_raw.get("name"),
            "level": _safe_int(pet_raw.get("level")),
            "exp": _safe_int(pet_raw.get("exp")),
        }

    clothes = profile.get("clothes")
    if isinstance(clothes, dict):
        clothes = clothes.get("ids") or clothes.get("images")

    return PlayerData(
        player_id=str(basic.get("accountId") or basic.get("uid") or ""),
        nickname=basic.get("nickname") or basic.get("AccountName"),
        level=_safe_int(basic.get("level") or basic.get("AccountLevel")),
        exp=_safe_int(basic.get("exp")),
        region=basic.get("region") or basic.get("AccountRegion"),
        account_created_at=_parse_ts(created),
        account_created_year=_year_from(created),
        rank_br=basic.get("rank") or basic.get("maxRank"),
        rank_cs=basic.get("csRank") or basic.get("csMaxRank"),
        ranking_points_br=_safe_int(basic.get("rankingPoints")),
        ranking_points_cs=_safe_int(basic.get("csRankingPoints")),
        prime_level=None,
        diamond=None,
        gold=None,
        liked=_safe_int(basic.get("liked") or basic.get("AccountLikes")),
        signature=social.get("signature") or basic.get("signature"),
        avatar_url=None,
        banner_url=None,
        clan=clan,
        favorite_weapons=None,
        vehicles=None,
        animations=None,
        vault=None,
        pet=pet_obj,
        clothes=clothes if isinstance(clothes, list) else None,
        last_login=_parse_ts(last_login),
        credit_score=_safe_int((raw.get("creditScoreInfo") or {}).get("creditScore")),
        title=None,
        release_version=basic.get("releaseVersion"),
        raw=raw if os.getenv("FF_INCLUDE_RAW", "0") == "1" else None,
    )


async def fetch_upstream(uid: str):
    async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=True) as client:
        try:
            r = await client.get(PRIMARY_URL, params={"uid": uid})
            if r.status_code == 200:
                j = r.json()
                if not j.get("error") and (
                    j.get("msg") in ("id_found", "success") or j.get("data")
                ):
                    return j, "ffxapi", None
                if j.get("error") or j.get("msg") in ("id_not_found", "not_found"):
                    return None, "ffxapi", "player not found"
            primary_err = f"status {r.status_code}"
        except Exception as e:
            primary_err = str(e)

        if FALLBACK_URL:
            try:
                r2 = await client.get(FALLBACK_URL, params={"uid": uid})
                if r2.status_code == 200:
                    j2 = r2.json()
                    if j2.get("basicInfo") or j2.get("AccountInfo") or j2.get("nickname"):
                        return j2, "fallback", None
            except Exception:
                pass

        return None, None, primary_err or "upstream failed"


async def lookup_player(uid: str) -> ApiResponse:
    if not UID_RE.match(uid):
        return ApiResponse(ok=False, error="invalid player id (must be 5-15 digits)")

    raw, source, err = await fetch_upstream(uid)
    if raw is None:
        if err == "player not found":
            return ApiResponse(ok=False, error="player not found")
        return ApiResponse(ok=False, error="upstream failed")

    try:
        data = map_ffxapi(raw) if source == "ffxapi" else map_generic(raw)
        if not data.player_id:
            data.player_id = uid
        return ApiResponse(ok=True, data=data, source=source)
    except Exception as e:
        return ApiResponse(ok=False, error=f"parse failed: {e}")


@router.get("/health")
async def health():
    return {
        "ok": True,
        "service": "ff-stalk",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/ff", response_model=ApiResponse)
async def get_player(
    id: str = Query(..., description="Player / Account ID"),
    include_raw: bool = Query(False),
):
    os.environ["FF_INCLUDE_RAW"] = "1" if include_raw else "0"
    result = await lookup_player(id.strip())
    if not result.ok:
        status = 404 if result.error == "player not found" else 502
        if result.error and "invalid" in result.error:
            status = 400
        return JSONResponse(status_code=status, content=result.model_dump())
    return result


@router.get("/ff/batch")
async def get_batch(ids: str = Query(..., description="Comma-separated UIDs, max 5")):
    uid_list = [u.strip() for u in ids.split(",") if u.strip()][:MAX_BATCH]
    if not uid_list:
        return JSONResponse(status_code=400, content={"ok": False, "error": "no ids"})
    results = []
    for uid in uid_list:
        r = await lookup_player(uid)
        results.append({"id": uid, **r.model_dump()})
    return {"ok": True, "count": len(results), "results": results}
