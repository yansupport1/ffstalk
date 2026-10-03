(() => {
  const form = document.getElementById("searchForm");
  const input = document.getElementById("uidInput");
  const btn = document.getElementById("searchBtn");
  const btnT = btn.querySelector(".btn-t");
  const btnL = btn.querySelector(".btn-l");
  const resultSection = document.getElementById("resultSection");
  const resultCard = document.getElementById("resultCard");
  const errorSection = document.getElementById("errorSection");
  const errorTitle = document.getElementById("errorTitle");
  const errorMsg = document.getElementById("errorMsg");
  const pasteBtn = document.getElementById("pasteBtn");
  const retryBtn = document.getElementById("retryBtn");

  const ICON_CDN = "https://cdn.jsdelivr.net/gh/ShahGCreator/icon@main/PNG/";
  const ITEM_CDN = "https://ffitems.devhubx.org/items/";

  function setLoading(on) {
    btn.disabled = on;
    btnT.hidden = on;
    btnL.hidden = !on;
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

  function fmt(v, fb = "—") {
    if (v === null || v === undefined || v === "") return fb;
    return v;
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

  function avatarUrl(nick, uid) {
    const name = encodeURIComponent((nick || "FF").slice(0, 2));
    // Deterministic official-looking avatar from UID/name
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(uid || nick || "ff")}&backgroundColor=1a1020,2a1510,0f1a28&radius=15`;
  }

  function initial(nick) {
    const t = (nick || "?").trim();
    return (t[0] || "?").toUpperCase();
  }

  function isNumericId(s) {
    return /^\d{6,12}$/.test(String(s).trim());
  }

  function itemImageUrls(idOrName) {
    const s = String(idOrName).trim();
    if (isNumericId(s)) {
      return [
        ICON_CDN + s + ".png",
        ITEM_CDN + s,
      ];
    }
    return [];
  }

  function loadImg(img, urls, onFail) {
    if (!urls.length) {
      onFail && onFail();
      return;
    }
    let i = 0;
    const tryNext = () => {
      if (i >= urls.length) {
        onFail && onFail();
        return;
      }
      img.onload = () => img.classList.add("ok", "loaded");
      img.onerror = () => {
        i++;
        tryNext();
      };
      img.src = urls[i];
    };
    tryNext();
  }

  function gallery(items, iconClass) {
    if (!items || !items.length) return "";
    return `<div class="gallery">${items
      .map((it, idx) => {
        const label = typeof it === "object" ? it.name || it.id || "Item" : String(it);
        const id = typeof it === "object" ? it.id : it;
        const delay = Math.min(idx * 0.04, 0.3);
        return `<div class="item-card" style="animation-delay:${delay}s">
          <div class="item-img">
            <i class="ph fa-solid ${iconClass}"></i>
            <img alt="" loading="lazy" data-src-try="${esc(label)}" />
          </div>
          <div class="item-name">${esc(label)}</div>
        </div>`;
      })
      .join("")}</div>`;
  }

  function bindGalleryImages(root) {
    root.querySelectorAll(".item-card").forEach((card) => {
      const img = card.querySelector("img");
      const name = img?.dataset.srcTry;
      if (!img || !name) return;
      const urls = itemImageUrls(name);
      // also try extracting digits from name
      const digits = String(name).match(/\d{6,12}/);
      if (digits) urls.push(ICON_CDN + digits[0] + ".png", ITEM_CDN + digits[0]);
      loadImg(img, urls, () => {
        // keep placeholder icon visible
      });
    });
  }

  function renderPlayer(data) {
    const nick = data.nickname || "Unknown";
    const uid = data.player_id || "";
    const banner = data.banner_url || "";
    const av = data.avatar_url || avatarUrl(nick, uid);

    const primeHtml =
      data.prime_level != null
        ? `<div class="sec"><div class="prime-bar">
            <div class="prime-badge">${esc(data.prime_level)}</div>
            <div class="prime-info">
              <strong>Prime Level ${esc(data.prime_level)}</strong>
              <span>Booyah Pass / Prime status</span>
            </div>
          </div></div>`
        : "";

    const clanHtml =
      data.clan && (data.clan.name || data.clan.id)
        ? `<div class="sec"><div class="sec-h"><i class="fa-solid fa-users"></i> Clan</div>
           <div class="row">
             <div class="row-ico"><i class="fa-solid fa-shield"></i></div>
             <div>
               <div class="row-t">${esc(data.clan.name || "—")}</div>
               <div class="row-s">ID ${fmt(data.clan.id)} · Lv ${fmt(data.clan.level)} · ${fmt(data.clan.members)} members</div>
             </div>
           </div></div>`
        : "";

    const petHtml =
      data.pet && (data.pet.name || data.pet.id)
        ? `<div class="sec"><div class="sec-h"><i class="fa-solid fa-paw"></i> Pet</div>
           <div class="row">
             <div class="row-ico"><i class="fa-solid fa-paw"></i></div>
             <div>
               <div class="row-t">${esc(data.pet.name || data.pet.id || "—")}</div>
               <div class="row-s">Lv ${fmt(data.pet.level)} · EXP ${fmt(data.pet.exp)}${data.pet.skill ? " · " + esc(data.pet.skill) : ""}</div>
             </div>
           </div></div>`
        : "";

    const bioHtml = data.signature
      ? `<div class="sec"><div class="sec-h"><i class="fa-solid fa-quote-left"></i> Bio</div>
         <div class="bio">${esc(data.signature)}</div></div>`
      : "";

    const clothesHtml =
      data.clothes && data.clothes.length
        ? `<div class="sec"><div class="sec-h"><i class="fa-solid fa-shirt"></i> Outfit</div>${gallery(data.clothes, "fa-shirt")}</div>`
        : "";

    const weaponsHtml =
      data.favorite_weapons && data.favorite_weapons.length
        ? `<div class="sec"><div class="sec-h"><i class="fa-solid fa-gun"></i> Senjata</div>${gallery(data.favorite_weapons, "fa-gun")}</div>`
        : "";

    const vaultHtml =
      data.vault && data.vault.length
        ? `<div class="sec"><div class="sec-h"><i class="fa-solid fa-box-archive"></i> Vault</div>${gallery(data.vault, "fa-box")}</div>`
        : "";

    resultCard.innerHTML = `
      <div class="banner">
        ${banner ? `<img id="bannerImg" alt="Banner" />` : ""}
        <div class="banner-fade"></div>
      </div>
      <div class="profile-body">
        <div class="avatar-row">
          <div class="avatar">
            <img id="avatarImg" alt="" />
            <div class="avatar-fallback" id="avatarFb">${esc(initial(nick))}</div>
          </div>
          <div class="meta">
            <h2>${esc(nick)}</h2>
            <div class="uid"><i class="fa-solid fa-hashtag"></i> ${esc(uid)}</div>
            <div class="pills">
              ${data.level != null ? `<span class="pill lv"><i class="fa-solid fa-chart-line"></i> Lv ${data.level}</span>` : ""}
              ${data.region ? `<span class="pill rg"><i class="fa-solid fa-globe"></i> ${esc(data.region)}</span>` : ""}
              ${data.rank_br != null ? `<span class="pill rk"><i class="fa-solid fa-trophy"></i> BR ${data.rank_br}</span>` : ""}
              ${data.rank_cs != null ? `<span class="pill rk"><i class="fa-solid fa-medal"></i> CS ${data.rank_cs}</span>` : ""}
              ${data.prime_level != null ? `<span class="pill pm"><i class="fa-solid fa-crown"></i> Prime ${data.prime_level}</span>` : ""}
            </div>
          </div>
        </div>

        <div class="stats">
          <div class="stat" style="animation-delay:0.02s"><div class="stat-l"><i class="fa-solid fa-heart"></i> Likes</div><div class="stat-v mono">${fmt(data.liked)}</div></div>
          <div class="stat" style="animation-delay:0.05s"><div class="stat-l"><i class="fa-solid fa-star"></i> EXP</div><div class="stat-v mono">${fmt(data.exp)}</div></div>
          <div class="stat" style="animation-delay:0.08s"><div class="stat-l"><i class="fa-solid fa-trophy"></i> BR Pts</div><div class="stat-v mono">${fmt(data.ranking_points_br)}</div></div>
          <div class="stat" style="animation-delay:0.11s"><div class="stat-l"><i class="fa-solid fa-medal"></i> CS Pts</div><div class="stat-v mono">${fmt(data.ranking_points_cs)}</div></div>
          <div class="stat" style="animation-delay:0.14s"><div class="stat-l"><i class="fa-solid fa-calendar"></i> Dibuat</div><div class="stat-v">${fmtDate(data.account_created_at)}</div></div>
          <div class="stat" style="animation-delay:0.17s"><div class="stat-l"><i class="fa-solid fa-clock"></i> Login</div><div class="stat-v">${fmtDate(data.last_login)}</div></div>
          <div class="stat" style="animation-delay:0.2s"><div class="stat-l"><i class="fa-solid fa-gauge-high"></i> Credit</div><div class="stat-v mono">${fmt(data.credit_score)}</div></div>
          <div class="stat" style="animation-delay:0.23s"><div class="stat-l"><i class="fa-solid fa-tag"></i> Title</div><div class="stat-v">${fmt(data.title)}</div></div>
        </div>

        ${primeHtml}
        ${bioHtml}
        ${clanHtml}
        ${petHtml}
        ${clothesHtml}
        ${weaponsHtml}
        ${vaultHtml}
      </div>
    `;

    // Banner
    const bImg = resultCard.querySelector("#bannerImg");
    if (bImg && banner) {
      bImg.onload = () => bImg.classList.add("loaded");
      bImg.onerror = () => { bImg.style.display = "none"; };
      bImg.src = banner;
    }

    // Avatar
    const aImg = resultCard.querySelector("#avatarImg");
    const aFb = resultCard.querySelector("#avatarFb");
    if (aImg) {
      aImg.onload = () => {
        aImg.style.display = "block";
        if (aFb) aFb.style.display = "none";
      };
      aImg.onerror = () => {
        aImg.style.display = "none";
        if (aFb) aFb.style.display = "grid";
      };
      aImg.src = av;
    }

    bindGalleryImages(resultCard);

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
            ? "Sumber data sedang down"
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

  document.querySelectorAll(".sample").forEach((el) => {
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
