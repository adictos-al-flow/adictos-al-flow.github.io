(function () {
  const SESSION_KEY = "aaf-session2";
  const KEYS = {
    favs: "aaf-favs",
    orders: "aaf-orders",
    profiles: "aaf-profiles",
  };

  try {
    localStorage.removeItem("aaf-accounts");
    localStorage.removeItem("aaf-session");
    localStorage.removeItem("aaf-guest-ok");
  } catch (e) {}

  const html = `
    <div class="acct" id="acctPanel" hidden>
      <div class="acct-box" role="dialog" aria-modal="true" aria-labelledby="acctTitle">
        <button class="acct-close" id="acctClose" type="button" aria-label="Cerrar">✕</button>

        <div class="acct-view" id="acctHome">
          <div class="acct-eyebrow">ADICTOS AL FLOW · CUENTA</div>
          <h2 id="acctTitle">Tu cuenta</h2>
          <div class="acct-profile" id="acctProfile"></div>

          <div class="acct-tabs" role="tablist" aria-label="Mi cuenta">
            <button class="acct-tab active" type="button" data-atab="favs" role="tab" aria-selected="true">Favoritos</button>
            <button class="acct-tab" type="button" data-atab="orders" role="tab" aria-selected="false">Pedidos</button>
          </div>

          <div class="acct-pane" id="paneFavs">
            <div class="fav-list" id="favList"></div>
          </div>

          <div class="acct-pane" id="paneOrders" hidden>
            <div class="ord-list" id="ordList"></div>
          </div>

          <div class="acct-actions" id="acctActions"></div>
          <p class="acct-fine" id="acctFine"></p>
        </div>
      </div>
    </div>`;

  document.body.insertAdjacentHTML("beforeend", html);

  const gateHtml = `
    <div class="gate" id="loginGate" hidden>
      <div class="gate-bg" aria-hidden="true"></div>
      <div class="gate-card" role="dialog" aria-modal="true" aria-labelledby="gateTitle" tabindex="-1">
        <div class="gate-logo" aria-hidden="true">AAF</div>
        <div class="gate-eyebrow">ADICTOS AL FLOW · ACCESO</div>
        <h1 class="gate-title" id="gateTitle">Entra con <em>Google</em><br>para comprar</h1>
        <p class="gate-sub">Necesitas una cuenta de Google para ver el catálogo, guardar favoritos y hacer pedidos con envío. Es rápido y seguro.</p>

        <div class="gate-google" id="gateGoogleWrap"></div>

        <div class="gate-error" id="gateError" hidden>
          <strong>No se pudo cargar el acceso con Google.</strong>
          <span>Revisa tu conexión y vuelve a intentarlo.</span>
          <button class="gate-retry" id="gateRetry" type="button">Reintentar</button>
        </div>

        <ul class="gate-benefits">
          <li>Catálogo completo y pedidos con envío a tu dirección</li>
          <li>Favoritos e historial ligados a tu cuenta</li>
          <li>Tu dirección de entrega queda guardada para la próxima</li>
        </ul>
        <p class="gate-fine">Solo usamos tu nombre y correo de Google. Los pagos se procesan de forma segura en PayPal, nunca en esta página.</p>
      </div>
    </div>`;

  document.body.insertAdjacentHTML("beforeend", gateHtml);

  const panel = document.getElementById("acctPanel");
  const closeBtn = document.getElementById("acctClose");
  const homeView = document.getElementById("acctHome");
  const profileEl = document.getElementById("acctProfile");
  const tabs = Array.from(document.querySelectorAll(".acct-tab"));
  const paneFavs = document.getElementById("paneFavs");
  const paneOrders = document.getElementById("paneOrders");
  const favList = document.getElementById("favList");
  const ordList = document.getElementById("ordList");
  const actionsEl = document.getElementById("acctActions");
  const fineEl = document.getElementById("acctFine");
  const accountBtn = document.getElementById("accountBtn");
  const accountBtnText = document.getElementById("accountBtnText");
  const gate = document.getElementById("loginGate");
  const gateCard = gate.querySelector(".gate-card");
  const gateGoogleWrap = document.getElementById("gateGoogleWrap");
  const gateError = document.getElementById("gateError");
  const gateRetry = document.getElementById("gateRetry");

  let session = null;
  try {
    session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch (e) {}
  if (!session || typeof session.id !== "string") session = null;

  let googleClientId = "";
  let lastFocused = null;
  let currentPane = "favs";

  function readMap(key) {
    try {
      const map = JSON.parse(localStorage.getItem(key) || "{}");
      return map && typeof map === "object" && !Array.isArray(map) ? map : {};
    } catch (e) {
      return {};
    }
  }

  function writeMap(key, map) {
    try {
      localStorage.setItem(key, JSON.stringify(map));
    } catch (e) {}
  }

  function uid() {
    return session ? session.id : "guest";
  }

  function user() {
    return {
      id: session ? session.id : "",
      name: (session && session.name) || "Cliente",
      email: (session && session.email) || "",
      picture: (session && session.picture) || "",
      google: !!session,
    };
  }

  function listOf(key) {
    const arr = readMap(key)[uid()];
    return Array.isArray(arr) ? arr : [];
  }

  function setList(key, arr) {
    const map = readMap(key);
    map[uid()] = arr;
    writeMap(key, map);
  }

  function findOrder(id) {
    const map = readMap(KEYS.orders);
    for (const owner of Object.keys(map)) {
      const arr = Array.isArray(map[owner]) ? map[owner] : [];
      const order = arr.find((o) => o && o.id === id);
      if (order) return { owner, order, map };
    }
    return null;
  }

  const DATA = {
    uid,
    user,
    favs() {
      return listOf(KEYS.favs).filter((id) => typeof id === "string");
    },
    setFavs(list) {
      setList(KEYS.favs, list);
    },
    orders() {
      return listOf(KEYS.orders).filter((o) => o && typeof o.id === "string");
    },
    addOrder(order) {
      const list = DATA.orders();
      list.unshift(order);
      setList(KEYS.orders, list.slice(0, 60));
    },
    getOrder(id) {
      const found = findOrder(id);
      return found ? found.order : null;
    },
    updateOrder(id, patch) {
      const found = findOrder(id);
      if (!found) return null;
      Object.assign(found.order, patch);
      writeMap(KEYS.orders, found.map);
      return found.order;
    },
    profile() {
      const p = readMap(KEYS.profiles)[uid()];
      return p && typeof p === "object" ? p : null;
    },
    saveProfile(p) {
      const map = readMap(KEYS.profiles);
      map[uid()] = p;
      writeMap(KEYS.profiles, map);
    },
  };

  window.AAF_DATA = DATA;

  function migrateGuest(googleId) {
    Object.keys(KEYS).forEach((name) => {
      const key = KEYS[name];
      const map = readMap(key);
      const guest = map.guest;
      if (guest === undefined) return;
      if (name === "profiles") {
        if (!map[googleId]) map[googleId] = guest;
      } else if (Array.isArray(guest)) {
        const existing = Array.isArray(map[googleId]) ? map[googleId] : [];
        if (name === "favs") map[googleId] = Array.from(new Set(guest.concat(existing)));
        else map[googleId] = guest.concat(existing).slice(0, name === "orders" ? 60 : 10);
      }
      delete map.guest;
      writeMap(key, map);
    });
  }

  function esc(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function toast(message) {
    if (typeof window.showToast === "function") window.showToast(message);
  }

  function price(value) {
    if (typeof window.formatPrice === "function") return window.formatPrice(value);
    return "RD$" + Number(value || 0).toLocaleString("en-US");
  }

  function moneyDop(value) {
    return "RD$" + Number(value || 0).toLocaleString("en-US");
  }

  function findProduct(id) {
    return PRODUCTS.find((p) => p.id === id);
  }

  function initials(name) {
    return String(name || "I")
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join("");
  }

  const GOOGLE_G_SVG =
    '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';

  function decodeJwt(token) {
    const part = String(token).split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(part)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  }

  function showGate() {
    gate.hidden = false;
    document.body.classList.add("gate-open");
    if (gateCard) gateCard.focus();
  }

  function hideGate() {
    gate.hidden = true;
    document.body.classList.remove("gate-open");
  }

  function showGateError() {
    gateError.hidden = false;
  }

  function onGoogleCredential(response) {
    try {
      const payload = decodeJwt(response.credential);
      if (!payload || !payload.sub) throw new Error("invalid_token");
      session = {
        id: String(payload.sub),
        name: String(payload.name || payload.given_name || "Cliente"),
        email: String(payload.email || ""),
        picture: String(payload.picture || ""),
      };
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } catch (e) {}
      migrateGuest(session.id);
      hideGate();
      updateHeader();
      toast("Sesión iniciada con Google. Hola, " + session.name.split(/\s+/)[0]);
    } catch (e) {
      toast("No se pudo iniciar con Google. Intenta de nuevo.");
    }
  }

  function renderGoogleButton() {
    gateGoogleWrap.innerHTML = "";
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: onGoogleCredential,
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    window.google.accounts.id.renderButton(gateGoogleWrap, {
      theme: "outline",
      size: "large",
      width: Math.min(360, gateGoogleWrap.clientWidth || 320),
      text: "continue_with",
      locale: "es",
      shape: "pill",
      logo_alignment: "left",
    });
    gateError.hidden = true;
  }

  function setupGoogle() {
    const cfg = (window.STORE && window.STORE.config) || window.STORE_CONFIG || {};
    googleClientId = String(cfg.googleClientId || "").trim();
    if (!googleClientId) {
      showGateError();
      return;
    }
    if (window.google && window.google.accounts && window.google.accounts.id) {
      try {
        renderGoogleButton();
      } catch (e) {
        showGateError();
      }
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      try {
        renderGoogleButton();
      } catch (e) {
        showGateError();
      }
    };
    script.onerror = () => showGateError();
    document.head.appendChild(script);
  }

  function updateHeader() {
    if (!accountBtn || !accountBtnText) return;
    if (session) {
      accountBtn.classList.add("on");
      const first = session.name.split(/\s+/)[0];
      accountBtnText.textContent = first.length > 12 ? first.slice(0, 12) + "…" : first;
      accountBtn.setAttribute("aria-label", "Mi cuenta: " + session.name);
    } else {
      accountBtn.classList.remove("on");
      accountBtnText.textContent = "CUENTA";
      accountBtn.setAttribute("aria-label", "Iniciar sesión con Google");
    }
    syncFavButtons();
    syncModalFav();
  }

  function openAccount(pane) {
    if (!session) {
      showGate();
      return;
    }
    lastFocused = document.activeElement;
    renderHome();
    if (pane) setPane(pane);
    panel.hidden = false;
    document.body.classList.add("acct-open");
    closeBtn.focus();
  }

  function closeAccount() {
    if (panel.hidden) return;
    panel.hidden = true;
    document.body.classList.remove("acct-open");
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  function renderProfile() {
    const u = user();
    const avatar = u.picture
      ? '<img src="' + esc(u.picture) + '" alt="" referrerpolicy="no-referrer">'
      : '<span class="acct-avatar-fallback">' + esc(initials(u.name)) + "</span>";
    profileEl.innerHTML =
      '<span class="acct-avatar">' + avatar + "</span>" +
      '<div class="acct-who"><strong>' + esc(u.name) + "</strong>" +
      "<small>" + esc(u.email) + "</small></div>" +
      '<span class="g-chip">' + GOOGLE_G_SVG + "Google</span>";
  }

  function renderActions() {
    actionsEl.innerHTML = '<button class="acct-out" id="logoutBtn" type="button">Cerrar sesión</button>';
    fineEl.textContent = "Sesión de Google activa en este dispositivo. Tus pedidos, favoritos y tarjetas se guardan aquí.";
    const logout = document.getElementById("logoutBtn");
    if (logout) {
      logout.addEventListener("click", () => {
        session = null;
        try {
          localStorage.removeItem(SESSION_KEY);
        } catch (e) {}
        closeAccount();
        showGate();
        updateHeader();
        toast("Sesión cerrada");
      });
    }
  }

  function setPane(name) {
    currentPane = name;
    tabs.forEach((t) => {
      const on = t.dataset.atab === name;
      t.classList.toggle("active", on);
      t.setAttribute("aria-selected", String(on));
    });
    paneFavs.hidden = name !== "favs";
    paneOrders.hidden = name !== "orders";
    if (name === "favs") renderFavs();
    else renderOrders();
  }

  function renderHome() {
    homeView.hidden = false;
    renderProfile();
    setPane(currentPane);
    renderActions();
  }

  function renderFavs() {
    const items = DATA.favs().map(findProduct).filter(Boolean);
    if (!items.length) {
      favList.innerHTML = '<p class="acct-empty">Toca el corazón en cualquier producto para guardarlo aquí.</p>';
      return;
    }
    favList.innerHTML = items
      .map(
        (p) => `
        <div class="fav-item" data-id="${esc(p.id)}" role="button" tabindex="0">
          <img src="${p.img[0]}" alt="" width="44" height="44" loading="lazy">
          <div class="fav-info">
            <strong>${esc(p.name)}</strong>
            <span>${price(p.price)}</span>
          </div>
          <button class="fav-remove" type="button" data-remove="${esc(p.id)}" aria-label="Quitar de favoritos">✕</button>
        </div>`
      )
      .join("");
  }

  const ORDER_STATUS = {
    pendiente: "Pendiente de pago",
    pagado: "Pagado · Preparando envío",
    cancelado: "Pago cancelado",
  };

  function orderDate(iso) {
    try {
      return new Date(iso).toLocaleDateString("es-DO", { day: "numeric", month: "short", year: "numeric" });
    } catch (e) {
      return "";
    }
  }

  function renderOrders() {
    const orders = DATA.orders();
    if (!orders.length) {
      ordList.innerHTML =
        '<p class="acct-empty">Aquí verás tus pedidos con su estado y la ubicación de entrega. Cuando pagues en la página, preparamos tu envío.</p>';
      return;
    }
    ordList.innerHTML = orders
      .map((o) => {
        const items = Array.isArray(o.items) ? o.items : [];
        const qty = items.reduce((n, it) => n + (Number(it.qty) || 0), 0);
        const s = o.shipping || {};
        const mapQuery = [s.address, s.city, s.zip, s.countryName].filter(Boolean).join(", ");
        const thumbs = items
          .slice(0, 4)
          .map((it) => '<img src="' + esc(it.img || "") + '" alt="" width="34" height="34" loading="lazy">')
          .join("");
        return `
        <article class="ord">
          <div class="ord-top">
            <span class="ord-id">${esc(o.id)}</span>
            <span class="ord-status ${esc(o.status || "pendiente")}">${ORDER_STATUS[o.status] || ORDER_STATUS.pendiente}</span>
          </div>
          <div class="ord-date">${orderDate(o.createdAt)} · ${qty} ${qty === 1 ? "pieza" : "piezas"} · <strong>${moneyDop(o.totalDop)}</strong></div>
          <div class="ord-thumbs">${thumbs}</div>
          <div class="ord-loc">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>
            <div>
              <strong>Ubicación de entrega</strong>
              <span>${esc(s.name || "")}</span>
              <span>${esc(s.address || "")}, ${esc(s.city || "")} ${esc(s.zip || "")}</span>
              <span>${esc(s.countryName || "")} · Tel. ${esc(s.phone || "")}</span>
              ${mapQuery ? '<a href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(mapQuery) + '" target="_blank" rel="noopener">Ver en el mapa</a>' : ""}
            </div>
          </div>
        </article>`;
      })
      .join("");
  }

  function syncFavButtons() {
    const favs = DATA.favs();
    document.querySelectorAll(".fav-btn").forEach((btn) => {
      const on = favs.indexOf(btn.dataset.id) >= 0;
      btn.classList.toggle("active", on);
      btn.setAttribute("aria-pressed", String(on));
    });
  }

  function syncModalFav() {
    const btn = document.getElementById("mFav");
    const label = document.getElementById("mFavText");
    if (!btn) return;
    const on = !!btn.dataset.id && DATA.favs().indexOf(btn.dataset.id) >= 0;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-pressed", String(on));
    btn.setAttribute("aria-label", on ? "Quitar de favoritos" : "Guardar en favoritos");
    if (label) label.textContent = on ? "Guardado" : "Favorito";
  }

  function toggleFav(id) {
    if (!id) return;
    const favs = DATA.favs();
    const index = favs.indexOf(id);
    if (index >= 0) favs.splice(index, 1);
    else favs.unshift(id);
    DATA.setFavs(favs);
    syncFavButtons();
    syncModalFav();
    if (!panel.hidden && !homeView.hidden && currentPane === "favs") renderFavs();
    toast(index >= 0 ? "Quitado de favoritos" : "Guardado en favoritos");
  }

  if (accountBtn) accountBtn.addEventListener("click", () => openAccount());
  closeBtn.addEventListener("click", closeAccount);
  panel.addEventListener("click", (e) => {
    if (e.target === panel) closeAccount();
  });

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => setPane(tab.dataset.atab));
  });

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".fav-btn");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    toggleFav(btn.dataset.id);
  });

  const modalFav = document.getElementById("mFav");
  if (modalFav) modalFav.addEventListener("click", () => toggleFav(modalFav.dataset.id));

  favList.addEventListener("click", (e) => {
    const remove = e.target.closest(".fav-remove");
    if (remove) {
      e.stopPropagation();
      toggleFav(remove.dataset.remove);
      return;
    }
    const item = e.target.closest(".fav-item");
    if (item) {
      closeAccount();
      if (typeof window.openModal === "function") window.openModal(item.dataset.id);
    }
  });

  favList.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const item = e.target.closest(".fav-item");
    if (!item) return;
    e.preventDefault();
    closeAccount();
    if (typeof window.openModal === "function") window.openModal(item.dataset.id);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || panel.hidden) return;
    e.stopImmediatePropagation();
    closeAccount();
  });

  window.ACCOUNTS = {
    isFav(id) {
      return DATA.favs().indexOf(id) >= 0;
    },
    toggleFav,
    syncModalFav,
    syncFavButtons,
    open: openAccount,
    refresh() {
      if (!panel.hidden && !homeView.hidden) setPane(currentPane);
    },
    get logged() {
      return !!session;
    },
  };

  gateRetry.addEventListener("click", setupGoogle);
  updateHeader();
  setupGoogle();
  if (session) hideGate();
  else showGate();
})();