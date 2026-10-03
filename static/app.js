(() => {
  const form = document.getElementById("searchForm");
  const input = document.getElementById("uidInput");
  const btn = document.getElementById("searchBtn");
  const btnLabel = btn.querySelector(".btn-label");
  const btnSpin = btn.querySelector(".btn-spin");
  const resultSection = document.getElementById("resultSection");
  const resultCard = document.getElementById("resultCard");
  const errorSection = document.getElementById("errorSection");
  const errorTitle = document.getElementById("errorTitle");
  const errorMsg = document.getElementById("errorMsg");
  const pasteBtn = document.getElementById("pasteBtn");
  const retryBtn = document.getElementById("retryBtn");

  function setLoading(on) {
    btn.disabled = on;
    btnLabel.hidden = on;
    btnSpin.hidden = !on;
  }

  function hideAll() {
    resultSection.hidden = true;
    errorSection.hidden = true;
  }

  function showError(title, msg) {
    hideAll();
    errorTitle.textContent = title;
    errorMsg.textContent = msg;
    errorSection.hidden = false;
  }

  function fmt(val, fallback = "—") {
    if (val === null || val === undefined || val === "") return fallback;
    return val;
  }

  function fmtDate(iso) {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      if (isNaN(d)) return iso;
      return d.toLocaleString("id-ID", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function tags(list) {
    if (!list || !list.length) return "";
    return `<div class="tags">${list.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>`;
  }

  function renderPlayer(data) {
    const clan =
      data.clan && (data.clan.name || data.clan.id)
        ? `<div class="block"><h3>Clan</h3>
           <div class="row-box"><span class="row-emoji">🛡️</span>
           <div><div class="row-title">${esc(data.clan.name || "—")}</div>
           <div class="row-sub">ID ${fmt(data.clan.id)} · Lv ${fmt(data.clan.level)} · ${fmt(data.clan.members)} members</div></div></div></div>`
        : "";

    const pet =
      data.pet && (data.pet.name || data.pet.id)
        ? `<div class="block"><h3>Pet</h3>
           <div class="row-box"><span class="row-emoji">🐾</span>
           <div><div class="row-title">${esc(data.pet.name || data.pet.id || "—")}</div>
           <div class="row-sub">Lv ${fmt(data.pet.level)} · EXP ${fmt(data.pet.exp)}${data.pet.skill ? " · " + esc(data.pet.skill) : ""}</div></div></div></div>`
        : "";

    const bio = data.signature
      ? `<div class="block"><h3>Bio</h3><div class="bio-box">${esc(data.signature)}</div></div>`
      : "";

    const weapons =
      data.favorite_weapons && data.favorite_weapons.length
        ? `<div class="block"><h3>Senjata</h3>${tags(data.favorite_weapons)}</div>`
        : "";

    const clothes =
      data.clothes && data.clothes.length
        ? `<div class="block"><h3>Outfit</h3>${tags(data.clothes)}</div>`
        : "";

    resultCard.innerHTML = `
      <div class="profile-top">
        <div class="avatar">🔥</div>
        <div class="profile-info">
          <h2>${esc(data.nickname || "Unknown")}</h2>
          <div class="uid-line">UID ${esc(data.player_id || "")}</div>
          <div class="pills">
            ${data.level != null ? `<span class="pill lv">Lv ${data.level}</span>` : ""}
            ${data.region ? `<span class="pill rg">${esc(data.region)}</span>` : ""}
            ${data.rank_br != null ? `<span class="pill rk">BR ${data.rank_br}</span>` : ""}
            ${data.rank_cs != null ? `<span class="pill rk">CS ${data.rank_cs}</span>` : ""}
            ${data.prime_level != null ? `<span class="pill">Prime ${data.prime_level}</span>` : ""}
          </div>
        </div>
      </div>
      <div class="grid">
        <div class="cell"><div class="cell-l">Likes</div><div class="cell-v mono">${fmt(data.liked)}</div></div>
        <div class="cell"><div class="cell-l">EXP</div><div class="cell-v mono">${fmt(data.exp)}</div></div>
        <div class="cell"><div class="cell-l">BR Points</div><div class="cell-v mono">${fmt(data.ranking_points_br)}</div></div>
        <div class="cell"><div class="cell-l">CS Points</div><div class="cell-v mono">${fmt(data.ranking_points_cs)}</div></div>
        <div class="cell"><div class="cell-l">Dibuat</div><div class="cell-v">${fmtDate(data.account_created_at)}</div></div>
        <div class="cell"><div class="cell-l">Last login</div><div class="cell-v">${fmtDate(data.last_login)}</div></div>
        <div class="cell"><div class="cell-l">Credit</div><div class="cell-v mono">${fmt(data.credit_score)}</div></div>
        <div class="cell"><div class="cell-l">Title</div><div class="cell-v">${fmt(data.title)}</div></div>
      </div>
      ${bio}${clan}${pet}${weapons}${clothes}
    `;

    hideAll();
    resultSection.hidden = false;
    resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function lookup(uid) {
    uid = String(uid).trim();
    if (!/^\d{5,15}$/.test(uid)) {
      showError("ID tidak valid", "Player ID harus 5–15 digit angka.");
      return;
    }
    setLoading(true);
    hideAll();
    try {
      const res = await fetch(`/api/ff?id=${encodeURIComponent(uid)}`);
      const json = await res.json();
      if (!json.ok) {
        const title =
          json.error === "player not found"
            ? "Akun tidak ditemukan"
            : res.status === 502
            ? "Server sumber sedang down"
            : "Gagal";
        showError(title, json.error || "Terjadi kesalahan");
        return;
      }
      renderPlayer(json.data);
    } catch (e) {
      showError("Koneksi gagal", e.message || "Tidak bisa menghubungi server");
    } finally {
      setLoading(false);
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    lookup(input.value);
  });

  document.querySelectorAll(".hint-chip").forEach((el) => {
    el.addEventListener("click", () => {
      input.value = el.dataset.uid;
      lookup(el.dataset.uid);
    });
  });

  pasteBtn.addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();
      const digits = text.replace(/\D/g, "").slice(0, 15);
      if (digits) {
        input.value = digits;
        input.focus();
      }
    } catch {
      input.focus();
    }
  });

  retryBtn.addEventListener("click", () => {
    if (input.value) lookup(input.value);
  });

  const params = new URLSearchParams(location.search);
  if (params.get("id")) {
    input.value = params.get("id");
    lookup(params.get("id"));
  }
})();
