(() => {
  const form = document.getElementById("searchForm");
  const input = document.getElementById("uidInput");
  const btn = document.getElementById("searchBtn");
  const btnText = btn.querySelector(".btn-text");
  const btnLoader = btn.querySelector(".btn-loader");
  const resultSection = document.getElementById("resultSection");
  const resultCard = document.getElementById("resultCard");
  const errorSection = document.getElementById("errorSection");
  const errorTitle = document.getElementById("errorTitle");
  const errorMsg = document.getElementById("errorMsg");
  const pasteBtn = document.getElementById("pasteBtn");
  const retryBtn = document.getElementById("retryBtn");

  function setLoading(on) {
    btn.disabled = on;
    btnText.hidden = on;
    btnLoader.hidden = !on;
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
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  function tags(list) {
    if (!list || !list.length) return "";
    return `<div class="tag-list">${list.map((t) => `<span class="tag">${escapeHtml(String(t))}</span>`).join("")}</div>`;
  }

  function escapeHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderPlayer(data, source) {
    const clanHtml =
      data.clan && (data.clan.name || data.clan.id)
        ? `<div class="section-block">
            <h3>Clan / Guild</h3>
            <div class="clan-row">
              <span class="clan-icon">🛡️</span>
              <div>
                <div class="clan-name">${escapeHtml(data.clan.name || "—")}</div>
                <div class="clan-meta">ID: ${fmt(data.clan.id)} · Lv ${fmt(data.clan.level)} · ${fmt(data.clan.members)}/${fmt(data.clan.capacity)} members</div>
              </div>
            </div>
          </div>`
        : "";

    const petHtml =
      data.pet && (data.pet.name || data.pet.id)
        ? `<div class="section-block">
            <h3>Pet</h3>
            <div class="clan-row">
              <span class="clan-icon">🐾</span>
              <div>
                <div class="clan-name">${escapeHtml(data.pet.name || data.pet.id || "—")}</div>
                <div class="clan-meta">Lv ${fmt(data.pet.level)} · EXP ${fmt(data.pet.exp)}${data.pet.skill ? " · " + escapeHtml(data.pet.skill) : ""}</div>
              </div>
            </div>
          </div>`
        : "";

    const bioHtml = data.signature
      ? `<div class="section-block"><h3>Bio / Signature</h3><div class="bio">${escapeHtml(data.signature)}</div></div>`
      : "";

    const weaponsHtml =
      data.favorite_weapons && data.favorite_weapons.length
        ? `<div class="section-block"><h3>Weapons</h3>${tags(data.favorite_weapons)}</div>`
        : "";

    const clothesHtml =
      data.clothes && data.clothes.length
        ? `<div class="section-block"><h3>Outfit / Clothes</h3>${tags(data.clothes)}</div>`
        : "";

    resultCard.innerHTML = `
      <div class="profile-header">
        <div class="avatar-placeholder">🔥</div>
        <div class="profile-meta">
          <h2>${escapeHtml(data.nickname || "Unknown")}</h2>
          <div class="uid">UID · ${escapeHtml(String(data.player_id || ""))}</div>
          <div class="badges">
            ${data.level != null ? `<span class="badge level">Lv ${data.level}</span>` : ""}
            ${data.region ? `<span class="badge region">${escapeHtml(data.region)}</span>` : ""}
            ${data.rank_br != null ? `<span class="badge rank">BR ${data.rank_br}</span>` : ""}
            ${data.rank_cs != null ? `<span class="badge rank">CS ${data.rank_cs}</span>` : ""}
            ${data.prime_level != null ? `<span class="badge">Prime ${data.prime_level}</span>` : ""}
          </div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat"><div class="stat-label">EXP</div><div class="stat-value mono">${fmt(data.exp)}</div></div>
        <div class="stat"><div class="stat-label">Likes</div><div class="stat-value mono">${fmt(data.liked)}</div></div>
        <div class="stat"><div class="stat-label">BR Points</div><div class="stat-value mono">${fmt(data.ranking_points_br)}</div></div>
        <div class="stat"><div class="stat-label">CS Points</div><div class="stat-value mono">${fmt(data.ranking_points_cs)}</div></div>
        <div class="stat"><div class="stat-label">Created</div><div class="stat-value">${fmtDate(data.account_created_at)}</div></div>
        <div class="stat"><div class="stat-label">Last Login</div><div class="stat-value">${fmtDate(data.last_login)}</div></div>
        <div class="stat"><div class="stat-label">Credit Score</div><div class="stat-value mono">${fmt(data.credit_score)}</div></div>
        <div class="stat"><div class="stat-label">Title</div><div class="stat-value">${fmt(data.title)}</div></div>
        <div class="stat"><div class="stat-label">Diamond</div><div class="stat-value mono">${fmt(data.diamond)}</div></div>
        <div class="stat"><div class="stat-label">Gold</div><div class="stat-value mono">${fmt(data.gold)}</div></div>
        <div class="stat"><div class="stat-label">Version</div><div class="stat-value mono">${fmt(data.release_version)}</div></div>
        <div class="stat"><div class="stat-label">Year</div><div class="stat-value mono">${fmt(data.account_created_year)}</div></div>
      </div>

      ${bioHtml}
      ${clanHtml}
      ${petHtml}
      ${weaponsHtml}
      ${clothesHtml}

      <div class="source-note">Source: ${escapeHtml(source || "upstream")} · Unofficial public data</div>
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
            ? "Pemain tidak ditemukan"
            : res.status === 502
            ? "Upstream gagal"
            : "Error";
        showError(title, json.error || "Terjadi kesalahan");
        return;
      }

      renderPlayer(json.data, json.source);
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

  document.querySelectorAll(".chip").forEach((el) => {
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

  document.querySelectorAll(".btn-copy").forEach((el) => {
    el.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(el.dataset.copy || "");
        el.textContent = "Copied!";
        setTimeout(() => (el.textContent = "Copy curl"), 1500);
      } catch {}
    });
  });

  // Deep link ?id=
  const params = new URLSearchParams(location.search);
  if (params.get("id")) {
    input.value = params.get("id");
    lookup(params.get("id"));
  }
})();
