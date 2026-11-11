(function () {
  const CART_KEY = "aaf-cart";
  const MAX_QTY = 99;
  const MAX_ITEMS = 50;
  const DATA = window.AAF_DATA;

  const COUNTRIES = [
    { code: "DO", name: "República Dominicana", doc: "Cédula de identidad", docPh: "001-1234567-8", zipRe: /^\d{5}$/, zipPh: "10101" },
    { code: "US", name: "Estados Unidos", doc: "ID legal (licencia o pasaporte)", docPh: "Número de ID", zipRe: /^\d{5}(-\d{4})?$/, zipPh: "10001" },
    { code: "PR", name: "Puerto Rico", doc: "ID legal (licencia o pasaporte)", docPh: "Número de ID", zipRe: /^\d{5}(-\d{4})?$/, zipPh: "00901" },
    { code: "ES", name: "España", doc: "DNI / NIE", docPh: "12345678A", zipRe: /^\d{5}$/, zipPh: "28001" },
    { code: "MX", name: "México", doc: "INE / CURP", docPh: "Clave INE o CURP", zipRe: /^\d{5}$/, zipPh: "06000" },
    { code: "CO", name: "Colombia", doc: "Cédula de ciudadanía", docPh: "1.020.345.678", zipRe: /^\d{6}$/, zipPh: "110111" },
    { code: "VE", name: "Venezuela", doc: "Cédula de identidad", docPh: "V-12345678", zipRe: /^\d{4}$/, zipPh: "1010" },
    { code: "PA", name: "Panamá", doc: "Cédula de identidad", docPh: "8-123-4567", zipRe: /^[A-Za-z0-9 -]{3,10}$/, zipPh: "0801" },
    { code: "EC", name: "Ecuador", doc: "Cédula de identidad", docPh: "1712345678", zipRe: /^\d{6}$/, zipPh: "170101" },
    { code: "CR", name: "Costa Rica", doc: "Cédula de identidad", docPh: "1-1234-5678", zipRe: /^\d{5}$/, zipPh: "10101" },
    { code: "CL", name: "Chile", doc: "RUT / RUN", docPh: "12.345.678-9", zipRe: /^\d{7}$/, zipPh: "8320000" },
    { code: "PE", name: "Perú", doc: "DNI", docPh: "12345678", zipRe: /^\d{5}$/, zipPh: "15001" },
    { code: "AR", name: "Argentina", doc: "DNI", docPh: "12.345.678", zipRe: /^[A-Za-z0-9 -]{3,10}$/, zipPh: "C1000" },
    { code: "GT", name: "Guatemala", doc: "DPI", docPh: "1234 56789 0101", zipRe: /^\d{5}$/, zipPh: "01001" },
    { code: "HN", name: "Honduras", doc: "DNI / Identidad", docPh: "0801-1990-12345", zipRe: /^[A-Za-z0-9 -]{3,10}$/, zipPh: "11101" },
    { code: "SV", name: "El Salvador", doc: "DUI", docPh: "01234567-8", zipRe: /^\d{4}$/, zipPh: "1101" },
  ];

  const PIN_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>';
  const TRASH_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V5h6v2m-8 0 1 13h8l1-13"/></svg>';
  const LOCK_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  const CHECK_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 13 4 4L19 7"/></svg>';
  const CART_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 10.4a2 2 0 0 0 1.96 1.6H18a2 2 0 0 0 1.96-1.55L21.6 7H6"/><circle cx="10" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/></svg>';

  const html = `
    <div class="cart" id="cartPanel" hidden>
      <div class="cart-box" role="dialog" aria-modal="true" aria-labelledby="cartTitle">
        <div class="cart-head">
          <div>
            <div class="cart-eyebrow">ADICTOS AL FLOW</div>
            <h2 id="cartTitle">Tu carrito</h2>
          </div>
          <button class="cart-close" id="cartClose" type="button" aria-label="Cerrar carrito">✕</button>
        </div>

        <div class="cart-view" id="viewCart">
          <div class="cart-minbar" id="cartMinbar">
            <div class="cart-minbar-txt" id="cartMinText"></div>
            <div class="cart-minbar-track"><div class="cart-minbar-fill" id="cartMinFill"></div></div>
          </div>
          <div class="cart-selectrow" id="cartSelectRow">
            <label class="ck-wrap"><input type="checkbox" id="selectAll" class="ck"><span>Seleccionar todo</span></label>
            <button class="cart-removesel" id="removeSelected" type="button">Eliminar seleccionados</button>
          </div>
          <div class="cart-body" id="cartList"></div>
          <div class="cart-reco" id="cartReco"></div>
          <div class="cart-foot">
            <div class="cart-total-row">
              <span>Total <small id="cartPieces"></small></span>
              <strong id="cartTotal">RD$0</strong>
            </div>
            <p class="cart-note" id="cartFootNote"></p>
            <button class="cart-pay cart-continue" id="cartContinue" type="button">Continuar</button>
            <button class="cart-clear" id="cartClear" type="button">Vaciar carrito</button>
          </div>
        </div>

        <div class="cart-view" id="viewCheckout" hidden>
          <div class="co-body" id="coBody">
            <button class="co-back" id="coBack" type="button">‹ Volver al carrito</button>
            <form class="co-form" id="coForm" novalidate>
              <div class="co-sec-title">Datos de entrega</div>
              <label class="acct-field">Nombre completo
                <input id="coName" name="name" type="text" autocomplete="name" placeholder="Nombre y apellido" maxlength="80">
              </label>
              <div class="co-grid2">
                <label class="acct-field">País
                  <select id="coCountry" name="country"></select>
                </label>
                <label class="acct-field" id="coDocField"><span id="coDocLabel">Cédula de identidad</span>
                  <input id="coDoc" name="doc" type="text" placeholder="001-1234567-8" maxlength="30" autocomplete="off">
                </label>
              </div>
              <label class="acct-field">Teléfono de contacto
                <input id="coPhone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="8091234567" maxlength="18">
              </label>
              <label class="acct-field">Dirección de entrega
                <input id="coAddress" name="address" type="text" autocomplete="street-address" placeholder="Calle, número, sector y referencia" maxlength="140">
              </label>
              <div class="co-grid2">
                <label class="acct-field">Ciudad / Municipio
                  <input id="coCity" name="city" type="text" autocomplete="address-level2" placeholder="Santo Domingo" maxlength="60">
                </label>
                <label class="acct-field">Código postal
                  <input id="coZip" name="zip" type="text" autocomplete="postal-code" placeholder="10101" maxlength="10">
                </label>
              </div>
              <p class="acct-msg" id="coMsg" role="alert"></p>

              <div class="co-sec-title">Método de pago</div>
              <div class="co-paymethods" id="coPayMethods"></div>
              <p class="co-payment-note">Los datos de tarjeta se introducen en PayPal, no en esta tienda. La opción sin cuenta depende de PayPal y del país.</p>

              <div class="co-sec-title">Resumen del pedido</div>
              <div class="co-summary" id="coSummary"></div>

              <div class="co-location" id="coLocation"></div>
            </form>
          </div>
          <div class="cart-foot co-foot">
            <div class="cart-total-row">
              <span>Total <small id="coPieces"></small></span>
              <strong id="coTotal">RD$0</strong>
            </div>
            <p class="cart-pay-note" id="coUsdNote"></p>
            <button class="cart-pay is-paypal" id="coPay" type="button">Pagar</button>
            <p class="co-secure">${LOCK_SVG}<span>Pago cifrado en PayPal. Nunca guardamos el número completo ni el CVV de tu tarjeta.</span></p>
          </div>
        </div>

        <div class="cart-view" id="viewConfirm" hidden>
          <div class="confirm-body" id="confirmBody"></div>
          <div class="cart-foot">
            <button class="cart-pay cart-continue" id="cfShop" type="button">Seguir comprando</button>
          </div>
        </div>
      </div>
    </div>`;

  document.body.insertAdjacentHTML("beforeend", html);

  const panel = document.getElementById("cartPanel");
  const cartTitle = document.getElementById("cartTitle");
  const closeBtn = document.getElementById("cartClose");
  const cartBtn = document.getElementById("cartBtn");
  const badge = document.getElementById("cartBadge");

  const viewCart = document.getElementById("viewCart");
  const viewCheckout = document.getElementById("viewCheckout");
  const viewConfirm = document.getElementById("viewConfirm");

  const minbar = document.getElementById("cartMinbar");
  const minText = document.getElementById("cartMinText");
  const minFill = document.getElementById("cartMinFill");
  const selectRow = document.getElementById("cartSelectRow");
  const selectAll = document.getElementById("selectAll");
  const removeSelectedBtn = document.getElementById("removeSelected");
  const list = document.getElementById("cartList");
  const reco = document.getElementById("cartReco");
  const totalEl = document.getElementById("cartTotal");
  const piecesEl = document.getElementById("cartPieces");
  const footNote = document.getElementById("cartFootNote");
  const continueBtn = document.getElementById("cartContinue");
  const clearBtn = document.getElementById("cartClear");

  const coBody = document.getElementById("coBody");
  const coBack = document.getElementById("coBack");
  const coForm = document.getElementById("coForm");
  const coName = document.getElementById("coName");
  const coCountry = document.getElementById("coCountry");
  const coDocLabel = document.getElementById("coDocLabel");
  const coDoc = document.getElementById("coDoc");
  const coPhone = document.getElementById("coPhone");
  const coAddress = document.getElementById("coAddress");
  const coCity = document.getElementById("coCity");
  const coZip = document.getElementById("coZip");
  const coMsg = document.getElementById("coMsg");
  const coPayMethods = document.getElementById("coPayMethods");
  const coSummary = document.getElementById("coSummary");
  const coLocation = document.getElementById("coLocation");
  const coTotal = document.getElementById("coTotal");
  const coPieces = document.getElementById("coPieces");
  const coUsdNote = document.getElementById("coUsdNote");
  const coPay = document.getElementById("coPay");

  const confirmBody = document.getElementById("confirmBody");
  const cfShop = document.getElementById("cfShop");

  let items = readCart();
  let selected = new Set(items.map(key));
  let view = "cart";
  let payMethod = "paypal";
  let lastFocused = null;
  let lastOrder = null;

  coCountry.innerHTML = COUNTRIES.map(
    (c) => '<option value="' + c.code + '">' + esc(c.name) + "</option>"
  ).join("");

  function key(it) {
    return it.id + "|" + it.size;
  }

  function readCart() {
    try {
      const saved = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      if (!Array.isArray(saved)) return [];
      return saved
        .filter((it) => it && typeof it.id === "string" && typeof it.size === "string" && Number(it.qty) > 0)
        .map((it) => ({ id: it.id, size: it.size, qty: Math.min(MAX_QTY, Math.floor(Number(it.qty))) }))
        .slice(0, MAX_ITEMS);
    } catch (e) {
      return [];
    }
  }

  function persist() {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch (e) {}
  }

  function productOf(id) {
    return PRODUCTS.find((p) => p.id === id);
  }

  function esc(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function money(value) {
    if (typeof window.formatPrice === "function") return window.formatPrice(value);
    return "RD$" + Number(value || 0).toLocaleString("en-US");
  }

  function moneyDop(value) {
    return "RD$" + Number(value || 0).toLocaleString("en-US");
  }

  function toast(message) {
    if (typeof window.showToast === "function") window.showToast(message);
  }

  function storeConfig() {
    return (window.STORE && window.STORE.config) || window.STORE_CONFIG || {};
  }

  function minDop() {
    const m = Number(storeConfig().minOrderDop);
    return m > 0 ? m : 1000;
  }

  function usdRate() {
    const rate = Number(storeConfig().usdRate);
    return rate > 0 ? rate : 60;
  }

  function unitUsd(price) {
    return Math.round((price / usdRate()) * 100) / 100;
  }

  function selectedItems() {
    return items.filter((it) => selected.has(key(it)));
  }

  function totalsOf(arr) {
    let qty = 0;
    let dop = 0;
    arr.forEach((it) => {
      const p = productOf(it.id);
      if (!p) return;
      qty += it.qty;
      dop += p.price * it.qty;
    });
    return { qty, dop };
  }

  function usdTotalOf(arr) {
    let usd = 0;
    arr.forEach((it) => {
      const p = productOf(it.id);
      if (p) usd += unitUsd(p.price) * it.qty;
    });
    return Math.round(usd * 100) / 100;
  }

  function countryOf(code) {
    return COUNTRIES.find((c) => c.code === code) || COUNTRIES[0];
  }

  function updateBadge() {
    const total = totalsOf(items);
    badge.textContent = total.qty > 99 ? "99+" : String(total.qty);
    badge.hidden = total.qty === 0;
    const bnBadge = document.getElementById("bnCartBadge");
    if (bnBadge) {
      bnBadge.textContent = badge.textContent;
      bnBadge.hidden = badge.hidden;
    }
    const fab = document.getElementById("cartFab");
    const fabBadge = document.getElementById("cartFabBadge");
    if (fab && fabBadge) {
      if (!badge.hidden && fabBadge.textContent !== badge.textContent) {
        fab.classList.remove("bump");
        void fab.offsetWidth;
        fab.classList.add("bump");
      }
      fabBadge.textContent = badge.textContent;
      fabBadge.hidden = badge.hidden;
      fab.setAttribute("aria-label", total.qty ? "Abrir carrito, " + total.qty + (total.qty === 1 ? " pieza" : " piezas") : "Abrir carrito");
    }
    cartBtn.setAttribute(
      "aria-label",
      total.qty ? "Abrir carrito, " + total.qty + (total.qty === 1 ? " pieza" : " piezas") : "Abrir carrito"
    );
  }

  function render() {
    items = items.filter((it) => {
      const p = productOf(it.id);
      return p && p.price !== null && p.sizes.indexOf(it.size) >= 0;
    });
    const valid = new Set(items.map(key));
    selected.forEach((k) => {
      if (!valid.has(k)) selected.delete(k);
    });
    updateBadge();
    viewCart.hidden = view !== "cart";
    viewCheckout.hidden = view !== "checkout";
    viewConfirm.hidden = view !== "confirm";
    cartTitle.textContent = view === "checkout" ? "Finalizar compra" : view === "confirm" ? "Pedido confirmado" : "Tu carrito";
    if (view === "cart") renderCart();
    else if (view === "checkout") renderCheckout();
    else renderConfirm();
  }

  function renderCart() {
    const sel = selectedItems();
    const t = totalsOf(sel);
    const min = minDop();

    if (!items.length) {
      minbar.hidden = true;
      selectRow.hidden = true;
      list.innerHTML =
        '<div class="cart-empty">' + CART_SVG +
        "<p>Tu carrito está vacío</p>" +
        "<small>Agrega productos por al menos " + money(min) + " para hacer tu pedido con envío gratis.</small>" +
        '<button class="cart-shop" type="button">Ver productos</button></div>';
      totalEl.textContent = money(0);
      piecesEl.textContent = "";
      footNote.textContent = "Pedido mínimo de " + money(min) + " · Envío gratis";
      continueBtn.disabled = true;
      continueBtn.textContent = "Continuar";
      clearBtn.hidden = true;
      renderReco();
      return;
    }

    minbar.hidden = false;
    selectRow.hidden = false;
    const pct = Math.max(0, Math.min(100, (t.dop / min) * 100));
    minFill.style.width = pct + "%";
    minbar.classList.toggle("ok", t.dop >= min);
    if (t.dop >= min) {
      minText.innerHTML = CHECK_SVG + "<span>¡Listo! Cumples el pedido mínimo de " + money(min) + "</span>";
    } else if (t.qty > 0) {
      minText.innerHTML = "<span>Te faltan <strong>" + money(min - t.dop) + "</strong> para el pedido mínimo de " + money(min) + "</span>";
    } else {
      minText.innerHTML = "<span>Selecciona productos por al menos <strong>" + money(min) + "</strong></span>";
    }

    const allSel = items.length > 0 && selected.size === items.length;
    selectAll.checked = allSel;
    selectAll.indeterminate = selected.size > 0 && !allSel;
    removeSelectedBtn.disabled = selected.size === 0;

    const scroll = list.scrollTop;
    list.innerHTML = items
      .map((it) => {
        const p = productOf(it.id);
        const k = key(it);
        const on = selected.has(k);
        return `
        <article class="cart-item${on ? "" : " off"}">
          <label class="ck-wrap cart-ck"><input type="checkbox" class="ck" data-sel="${esc(k)}" ${on ? "checked" : ""} aria-label="Seleccionar ${esc(p.name)}"></label>
          <img src="${p.img[0]}" alt="${esc(p.name)}" width="62" height="62" loading="lazy" data-open="${esc(p.id)}">
          <div class="cart-info">
            <strong data-open="${esc(p.id)}">${esc(p.name)}</strong>
            <small>Talla ${esc(it.size)} · ${money(p.price)}</small>
            <div class="cart-qty">
              <button type="button" data-act="minus" data-key="${esc(k)}" aria-label="Quitar una unidad">−</button>
              <span>${it.qty}</span>
              <button type="button" data-act="plus" data-key="${esc(k)}" aria-label="Añadir una unidad">+</button>
            </div>
          </div>
          <div class="cart-side">
            <button class="cart-remove" type="button" data-act="remove" data-key="${esc(k)}" aria-label="Quitar ${esc(p.name)} del carrito">${TRASH_SVG}</button>
            <span class="cart-line">${money(p.price * it.qty)}</span>
          </div>
        </article>`;
      })
      .join("");
    list.scrollTop = scroll;

    totalEl.textContent = money(t.dop);
    piecesEl.textContent = t.qty ? "· " + t.qty + (t.qty === 1 ? " pieza" : " piezas") : "";
    footNote.textContent = "Envío gratis · Pedido mínimo de " + money(min);
    continueBtn.disabled = t.dop < min || t.qty === 0;
    continueBtn.textContent = t.qty ? "Continuar (" + t.qty + ")" : "Continuar";
    clearBtn.hidden = false;
    renderReco();
  }

  function renderReco() {
    const inCart = new Set(items.map((it) => it.id));
    let pool = PRODUCTS.filter((p) => p.price !== null && p.sizes.length > 0 && !inCart.has(p.id));
    const below = totalsOf(selectedItems()).dop < minDop();
    if (below) pool = pool.slice().sort((a, b) => a.price - b.price);
    const picks = pool.slice(0, 8);
    if (!picks.length) {
      reco.innerHTML = "";
      reco.hidden = true;
      return;
    }
    reco.hidden = false;
    reco.innerHTML =
      '<div class="reco-title">' + (below ? "Agrega más para llegar al mínimo" : "También te puede gustar") + "</div>" +
      '<div class="reco-row">' +
      picks
        .map(
          (p) => `
        <button class="reco-card" type="button" data-reco="${esc(p.id)}">
          <img src="${p.img[0]}" alt="" width="92" height="92" loading="lazy">
          <span class="reco-name">${esc(p.name)}</span>
          <span class="reco-price">${money(p.price)}</span>
          <span class="reco-add">+ Añadir</span>
        </button>`
        )
        .join("") +
      "</div>";
  }

  function updateCountryFields() {
    const c = countryOf(coCountry.value);
    coDocLabel.textContent = c.doc;
    coDoc.placeholder = c.docPh;
    coZip.placeholder = c.zipPh;
    coZip.setAttribute("inputmode", c.zipRe.source.indexOf("A-Za-z") >= 0 ? "text" : "numeric");
  }

  function collectForm() {
    const c = countryOf(coCountry.value);
    return {
      name: coName.value.trim(),
      country: c.code,
      countryName: c.name,
      doc: coDoc.value.trim(),
      phone: coPhone.value.trim(),
      address: coAddress.value.trim(),
      city: coCity.value.trim(),
      zip: coZip.value.trim(),
    };
  }

  function setCoMsg(text) {
    coMsg.textContent = text || "";
    coMsg.classList.toggle("show", !!text);
  }

  function validateForm() {
    const s = collectForm();
    const c = countryOf(s.country);
    if (s.name.length < 5 || s.name.split(/\s+/).length < 2) {
      return { ok: false, msg: "Escribe tu nombre completo (nombre y apellido).", field: coName };
    }
    if (s.doc.length < 5) {
      return { ok: false, msg: "Escribe tu " + c.doc.toLowerCase() + " completa.", field: coDoc };
    }
    const digits = s.phone.replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15) {
      return { ok: false, msg: "Escribe un teléfono válido (8 a 15 dígitos).", field: coPhone };
    }
    if (s.address.length < 8) {
      return { ok: false, msg: "Escribe tu dirección de entrega completa.", field: coAddress };
    }
    if (s.city.length < 3) {
      return { ok: false, msg: "Escribe tu ciudad o municipio.", field: coCity };
    }
    if (!c.zipRe.test(s.zip)) {
      return { ok: false, msg: "El código postal no es válido para " + c.name + ".", field: coZip };
    }
    return { ok: true, shipping: s };
  }

  function locationHtml(s) {
    const mapQuery = [s.address, s.city, s.zip, s.countryName].filter(Boolean).join(", ");
    const has = s.name || s.address || s.city;
    if (!has) {
      return '<div class="co-loc-empty">' + PIN_SVG + "<span>Completa tus datos para ver aquí la ubicación de entrega de tu pedido.</span></div>";
    }
    return (
      '<div class="co-loc-head">' + PIN_SVG + "<strong>Ubicación de entrega</strong></div>" +
      '<div class="co-loc-body">' +
      (s.name ? "<span>" + esc(s.name) + "</span>" : "") +
      (s.address ? "<span>" + esc(s.address) + "</span>" : "") +
      (s.city || s.zip ? "<span>" + esc([s.city, s.zip].filter(Boolean).join(" · ")) + "</span>" : "") +
      (s.countryName ? "<span>" + esc(s.countryName) + (s.phone ? " · Tel. " + esc(s.phone) : "") + "</span>" : "") +
      (mapQuery
        ? '<a href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(mapQuery) + '" target="_blank" rel="noopener">Ver en el mapa</a>'
        : "") +
      "</div>"
    );
  }

  const CARD_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.5h19"/><path d="M6 14.5h4"/></svg>';

  function renderPayMethods() {
    coPayMethods.innerHTML =
      '<label class="co-pm' + (payMethod === "paypal" ? " on" : "") + '">' +
      '<input type="radio" name="paymethod" value="paypal"' + (payMethod === "paypal" ? " checked" : "") + ">" +
      '<span class="co-pm-badge paypal">PayPal</span>' +
      '<span class="co-pm-txt"><strong>Pagar con PayPal</strong><small>Saldo o cuenta PayPal · Pago seguro</small></span>' +
      "</label>" +
      '<label class="co-pm' + (payMethod === "card" ? " on" : "") + '">' +
      '<input type="radio" name="paymethod" value="card"' + (payMethod === "card" ? " checked" : "") + ">" +
      '<span class="co-pm-badge bankcard">' + CARD_SVG + "</span>" +
      '<span class="co-pm-txt"><strong>Pagar con tarjeta</strong><small>Débito o crédito · En la página segura de PayPal</small></span>' +
      "</label>";
  }

  function renderSummary() {
    const sel = selectedItems();
    const t = totalsOf(sel);
    coSummary.innerHTML =
      sel
        .map((it) => {
          const p = productOf(it.id);
          return (
            '<div class="co-sum-item">' +
            '<img src="' + p.img[0] + '" alt="" width="40" height="40" loading="lazy">' +
            "<div><strong>" + esc(p.name) + "</strong><small>Talla " + esc(it.size) + " × " + it.qty + "</small></div>" +
            "<span>" + money(p.price * it.qty) + "</span></div>"
          );
        })
        .join("") +
      '<div class="co-sum-row"><span>Subtotal</span><span>' + money(t.dop) + "</span></div>" +
      '<div class="co-sum-row free"><span>Envío</span><span>Gratis</span></div>' +
      '<div class="co-sum-total"><span>Total</span><strong>' + money(t.dop) + "</strong></div>";
  }

  function renderCheckout() {
    const sel = selectedItems();
    const t = totalsOf(sel);
    renderPayMethods();
    renderSummary();
    coLocation.innerHTML = locationHtml(collectForm());
    coTotal.textContent = money(t.dop);
    coPieces.textContent = t.qty ? "· " + t.qty + (t.qty === 1 ? " pieza" : " piezas") : "";
    coUsdNote.textContent =
      "Cargo en US$" + usdTotalOf(sel).toFixed(2) + " (tasa RD$" + usdRate() + " por US$) · Pago seguro con PayPal";
    coPay.textContent = (payMethod === "card" ? "Pagar con tarjeta · " : "Pagar con PayPal · ") + money(t.dop);
    coPay.disabled = t.dop < minDop() || t.qty === 0;
  }

  function renderConfirm() {
    const o = lastOrder;
    if (!o) {
      confirmBody.innerHTML = '<p class="acct-empty">No hay un pedido reciente.</p>';
      return;
    }
    const s = o.shipping || {};
    const its = Array.isArray(o.items) ? o.items : [];
    const qty = its.reduce((n, it) => n + (Number(it.qty) || 0), 0);
    confirmBody.innerHTML =
      '<div class="confirm-hero">' +
      '<span class="confirm-check">' + CHECK_SVG + "</span>" +
      "<h3>¡Pago recibido!</h3>" +
      "<p>Estamos preparando tu envío. Te contactaremos al teléfono indicado para coordinar la entrega.</p>" +
      "</div>" +
      '<div class="confirm-meta">' +
      '<div><span>Pedido</span><strong>' + esc(o.id) + "</strong></div>" +
      '<div><span>Estado</span><strong class="confirm-status">Pagado · Preparando envío</strong></div>' +
      '<div><span>Total</span><strong>' + moneyDop(o.totalDop) + " · " + qty + (qty === 1 ? " pieza" : " piezas") + "</strong></div>" +
      "</div>" +
      '<div class="co-location confirm-loc">' + locationHtml(s) + "</div>" +
      '<div class="confirm-items">' +
      its
        .map(
          (it) =>
            '<div class="co-sum-item"><img src="' + esc(it.img || "") + '" alt="" width="40" height="40" loading="lazy">' +
            "<div><strong>" + esc(it.name) + "</strong><small>Talla " + esc(it.size) + " × " + it.qty + "</small></div>" +
            "<span>" + moneyDop(it.price * it.qty) + "</span></div>"
        )
        .join("") +
      "</div>" +
      '<p class="confirm-fine">Guardamos este pedido en tu cuenta. Puedes verlo cuando quieras en la sección Pedidos.</p>';
  }

  function open() {
    if (window.ACCOUNTS && !window.ACCOUNTS.logged) {
      window.ACCOUNTS.open();
      return;
    }
    if (!panel.hidden) return;
    lastFocused = document.activeElement;
    view = "cart";
    render();
    panel.hidden = false;
    document.body.classList.add("cart-open");
    closeBtn.focus();
  }

  function close() {
    if (panel.hidden) return;
    panel.hidden = true;
    document.body.classList.remove("cart-open");
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  function showConfirmPanel(order) {
    lastOrder = order;
    view = "confirm";
    lastFocused = document.activeElement;
    render();
    panel.hidden = false;
    document.body.classList.add("cart-open");
  }

  function goCheckout() {
    const t = totalsOf(selectedItems());
    if (t.dop < minDop() || t.qty === 0) {
      toast("El pedido mínimo es " + money(minDop()));
      return;
    }
    view = "checkout";
    prefillForm();
    render();
    coBody.scrollTop = 0;
    setCoMsg("");
    setTimeout(() => coName.focus(), 60);
  }

  function goCart() {
    view = "cart";
    render();
  }

  function prefillForm() {
    const p = (DATA && DATA.profile()) || {};
    const u = DATA ? DATA.user() : { google: false, name: "" };
    coName.value = p.name || (u.google ? u.name : "") || "";
    coCountry.value = p.country || "DO";
    updateCountryFields();
    coDoc.value = p.doc || "";
    coPhone.value = p.phone || "";
    coAddress.value = p.address || "";
    coCity.value = p.city || "";
    coZip.value = p.zip || "";
    payMethod = "paypal";
  }

  function add(product, size) {
    if (!product || product.price === null || !product.sizes.includes(size)) return;
    const k = product.id + "|" + size;
    const found = items.find((it) => it.id === product.id && it.size === size);
    if (found) {
      found.qty = Math.min(MAX_QTY, found.qty + 1);
    } else {
      items.unshift({ id: product.id, size: String(size), qty: 1 });
      if (items.length > MAX_ITEMS) items.length = MAX_ITEMS;
    }
    selected.add(k);
    persist();
    if (view !== "cart") view = "cart";
    render();
    toast("Añadido al carrito · Total " + money(totalsOf(items).dop));
  }

  function changeQty(k, delta) {
    const item = items.find((it) => key(it) === k);
    if (!item) return;
    const next = item.qty + delta;
    if (next < 1) {
      items = items.filter((it) => key(it) !== k);
      selected.delete(k);
    } else {
      item.qty = Math.min(MAX_QTY, next);
    }
    persist();
    render();
  }

  function removeItem(k) {
    if (!items.some((it) => key(it) === k)) return;
    items = items.filter((it) => key(it) !== k);
    selected.delete(k);
    persist();
    render();
    toast("Producto quitado del carrito");
  }

  function removeSelected() {
    if (!selected.size) return;
    const n = selected.size;
    items = items.filter((it) => !selected.has(key(it)));
    selected.clear();
    persist();
    render();
    toast(n === 1 ? "Producto eliminado" : n + " productos eliminados");
  }

  function clear() {
    if (!items.length) return;
    if (!confirm("¿Vaciar el carrito?")) return;
    items = [];
    selected.clear();
    persist();
    render();
  }

  function openProduct(id) {
    close();
    if (typeof window.openModal === "function") window.openModal(id);
  }

  function pay() {
    const sel = selectedItems();
    const t = totalsOf(sel);
    if (t.dop < minDop() || t.qty === 0) {
      toast("El pedido mínimo es " + money(minDop()));
      goCart();
      return;
    }
    const v = validateForm();
    if (!v.ok) {
      setCoMsg(v.msg);
      if (v.field) v.field.focus();
      return;
    }
    const cfg = storeConfig();
    const business = String(cfg.paypalEmail || "").trim();
    if (!business) {
      setCoMsg("La tienda aún no configura su cuenta de pago. Intenta más tarde.");
      return;
    }

    const s = v.shipping;
    const orderId =
      "AAF-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 4).toUpperCase();

    const order = {
      id: orderId,
      createdAt: new Date().toISOString(),
      status: "pendiente",
      uid: DATA ? DATA.uid() : "guest",
      items: sel.map((it) => {
        const p = productOf(it.id);
        return { id: p.id, name: p.name, img: p.img[0], size: it.size, qty: it.qty, price: p.price };
      }),
      totalDop: t.dop,
      totalUsd: usdTotalOf(sel),
      shipping: s,
    };

    if (DATA) {
      DATA.addOrder(order);
      DATA.saveProfile({
        name: s.name,
        country: s.country,
        doc: s.doc,
        phone: s.phone,
        address: s.address,
        city: s.city,
        zip: s.zip,
      });
    }
    lastOrder = order;

    const base = window.location.origin + window.location.pathname;
    const parts = s.name.split(/\s+/);
    const firstName = parts[0] || s.name;
    const lastName = parts.slice(1).join(" ") || firstName;
    const fields = {
      cmd: "_cart",
      upload: "1",
      business: business,
      currency_code: "USD",
      charset: "utf-8",
      return: base + "?pago=exito&orden=" + encodeURIComponent(orderId),
      cancel_return: base + "?pago=cancelado&orden=" + encodeURIComponent(orderId),
      address_override: "1",
      first_name: firstName,
      last_name: lastName,
      address1: s.address,
      city: s.city,
      zip: s.zip,
      country: s.country,
      shipping: "0",
      shipping2: "0",
      handling_cart: "0",
      tax_cart: "0",
      invoice: orderId,
      custom: [orderId, "ced:" + s.doc, "tel:" + s.phone].join("|").slice(0, 255),
      lc: "ES",
      landing_page: payMethod === "card" ? "Billing" : "Login",
    };
    const u = DATA ? DATA.user() : null;
    if (u && u.google && u.email) fields.email = u.email;

    sel.forEach((it, i) => {
      const p = productOf(it.id);
      const n = i + 1;
      fields["item_name_" + n] = p.name + " — Talla " + it.size;
      fields["amount_" + n] = unitUsd(p.price).toFixed(2);
      fields["quantity_" + n] = String(it.qty);
    });

    coPay.disabled = true;
    coPay.textContent = "Redirigiendo al pago seguro…";

    const form = document.createElement("form");
    form.method = "POST";
    form.action = "https://www.paypal.com/cgi-bin/webscr";
    form.style.display = "none";
    Object.keys(fields).forEach((name) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = fields[name];
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  }

  function handlePaymentReturn() {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("pago");
    if (status !== "exito" && status !== "cancelado") return;
    const ordenId = params.get("orden");
    let order = ordenId && DATA ? DATA.getOrder(ordenId) : null;
    if (!order && DATA) {
      order = DATA.orders().filter((o) => o.status === "pendiente")[0] || null;
    }

    if (status === "exito") {
      if (order && DATA) {
        DATA.updateOrder(order.id, { status: "pagado", paidAt: new Date().toISOString() });
        order = DATA.getOrder(order.id);
        const orderedKeys = new Set((order.items || []).map((it) => it.id + "|" + it.size));
        items = items.filter((it) => !orderedKeys.has(key(it)));
        selected.forEach((k) => {
          if (orderedKeys.has(k)) selected.delete(k);
        });
        persist();
        updateBadge();
        showConfirmPanel(order);
      } else {
        toast("Pago recibido. Estamos preparando tu envío.");
      }
    } else {
      if (order && DATA) DATA.updateOrder(order.id, { status: "cancelado" });
      toast("Pago cancelado. Tu carrito sigue guardado.");
    }

    try {
      window.history.replaceState(null, "", window.location.pathname + window.location.hash);
    } catch (e) {}
  }

  cartBtn.addEventListener("click", open);
  const cartFab = document.getElementById("cartFab");
  if (cartFab) cartFab.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  panel.addEventListener("click", (e) => {
    if (e.target === panel) close();
  });

  selectAll.addEventListener("change", () => {
    if (selectAll.checked) items.forEach((it) => selected.add(key(it)));
    else selected.clear();
    render();
  });

  removeSelectedBtn.addEventListener("click", removeSelected);

  list.addEventListener("change", (e) => {
    const cb = e.target.closest("input[data-sel]");
    if (!cb) return;
    if (cb.checked) selected.add(cb.dataset.sel);
    else selected.delete(cb.dataset.sel);
    render();
  });

  list.addEventListener("click", (e) => {
    const shop = e.target.closest(".cart-shop");
    if (shop) {
      close();
      const grid = document.getElementById("grid");
      if (grid) grid.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const opener = e.target.closest("[data-open]");
    if (opener) {
      openProduct(opener.dataset.open);
      return;
    }
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const k = btn.dataset.key;
    if (btn.dataset.act === "plus") changeQty(k, 1);
    else if (btn.dataset.act === "minus") changeQty(k, -1);
    else if (btn.dataset.act === "remove") removeItem(k);
  });

  reco.addEventListener("click", (e) => {
    const card = e.target.closest("[data-reco]");
    if (card) openProduct(card.dataset.reco);
  });

  continueBtn.addEventListener("click", goCheckout);
  clearBtn.addEventListener("click", clear);
  coBack.addEventListener("click", goCart);
  coPay.addEventListener("click", pay);
  cfShop.addEventListener("click", () => {
    view = "cart";
    close();
    const grid = document.getElementById("grid");
    if (grid) grid.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  coCountry.addEventListener("change", () => {
    updateCountryFields();
    coLocation.innerHTML = locationHtml(collectForm());
    setCoMsg("");
  });

  coForm.addEventListener("input", (e) => {
    if (e.target === coCountry) return;
    coLocation.innerHTML = locationHtml(collectForm());
    if (coMsg.classList.contains("show")) setCoMsg("");
  });

  coPayMethods.addEventListener("change", (e) => {
    const radio = e.target.closest('input[name="paymethod"]');
    if (!radio) return;
    payMethod = radio.value === "card" ? "card" : "paypal";
    renderCheckout();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || panel.hidden) return;
    e.stopImmediatePropagation();
    if (view === "checkout") goCart();
    else close();
  });

  window.CART = {
    add,
    render,
    open,
    get count() {
      return totalsOf(items).qty;
    },
  };

  updateCountryFields();
  handlePaymentReturn();
  render();
})();