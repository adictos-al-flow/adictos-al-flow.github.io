const DEFAULT_SITE_URL = "https://adictos-al-flow.github.io";
const DEFAULT_CATALOG_URL = "https://adictos-al-flow.github.io/products.js";
const HANDYPAY_API = "https://api.handypay.me/api/v1/payment-sessions";
const MIN_PIECES = 3;
const MAX_PIECES = 99;
const MAX_LINES = 50;

const ALLOWED_ORIGINS = new Set([
  DEFAULT_SITE_URL,
  "https://www.adictos-al-flow.github.io",
  "http://localhost:8765",
  "http://127.0.0.1:8765",
]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request.headers.get("Origin")),
      });
    }

    if (url.pathname === "/api/health") {
      return json({ ok: true }, 200, request);
    }

    if (url.pathname === "/api/checkout" && request.method === "POST") {
      return checkout(request, env);
    }

    if (url.pathname === "/api/webhook" && request.method === "POST") {
      return webhook(request, env);
    }

    return json({ error: "not_found" }, 404, request);
  },
};

async function checkout(request, env) {
  if (!env.HANDYPAY_SECRET_KEY) {
    return json({ error: "payments_not_configured" }, 503, request);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400, request);
  }

  const items = body && Array.isArray(body.items) ? body.items : null;
  if (!items || !items.length || items.length > MAX_LINES) {
    return json({ error: "invalid_items" }, 400, request);
  }

  const catalog = await loadCatalog(env);
  if (!catalog) {
    return json({ error: "catalog_unavailable" }, 503, request);
  }

  const lineItems = [];
  const summary = [];
  let pieces = 0;

  for (const item of items) {
    const id = typeof item.id === "string" ? item.id : "";
    const size = typeof item.size === "string" ? item.size : "";
    const qty = Math.floor(Number(item.qty));

    if (!id || !size || !Number.isFinite(qty) || qty < 1) {
      return json({ error: "invalid_item" }, 400, request);
    }

    const product = catalog.get(id);
    if (!product || product.sizes.indexOf(size) < 0) {
      return json({ error: "unknown_product" }, 400, request);
    }

    pieces += qty;
    if (pieces > MAX_PIECES) {
      return json({ error: "too_many_pieces" }, 400, request);
    }

    lineItems.push({
      name: product.name + " — Talla " + size,
      amount: product.price * 100,
      currency: "dop",
      quantity: qty,
    });
    summary.push(id + ":" + size + "x" + qty);
  }

  if (pieces < MIN_PIECES) {
    return json({ error: "min_order", min: MIN_PIECES }, 400, request);
  }

  const siteUrl = (env.SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, "");
  const payload = {
    line_items: lineItems,
    success_url: siteUrl + "/?pago=exito&session_id={CHECKOUT_SESSION_ID}",
    cancel_url: siteUrl + "/?pago=cancelado",
    metadata: { order: summary.join(",").slice(0, 480) },
  };

  let response;
  try {
    response = await fetch(HANDYPAY_API, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + env.HANDYPAY_SECRET_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return json({ error: "gateway_unreachable" }, 502, request);
  }

  const data = await response.json().catch(() => null);
  const checkoutUrl = data && data.data && data.data.url;

  if (!response.ok || !data || !data.success || !checkoutUrl) {
    return json({ error: "gateway_error", status: response.status }, 502, request);
  }

  return json({ url: checkoutUrl }, 200, request);
}

async function loadCatalog(env) {
  const catalogUrl = env.CATALOG_URL || DEFAULT_CATALOG_URL;
  const cache = caches.default;
  const cacheKey = new Request(catalogUrl, { method: "GET" });

  let response = await cache.match(cacheKey);

  if (!response) {
    const fresh = await fetch(catalogUrl, {
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    if (!fresh.ok) return null;

    const text = await fresh.text();
    response = new Response(text, {
      headers: {
        "Content-Type": "text/javascript; charset=utf-8",
        "Cache-Control": "max-age=300",
      },
    });
    await cache.put(cacheKey, response.clone());
  }

  const source = await response.text();
  const catalog = parseCatalog(source);
  return catalog.size ? catalog : null;
}

function parseCatalog(source) {
  const catalog = new Map();

  for (const line of source.split("\n")) {
    if (line.indexOf("id:") < 0) continue;

    const id = line.match(/id\s*:\s*"([^"]+)"/);
    const name = line.match(/name\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const price = line.match(/price\s*:\s*(\d+)/);
    const sizes = line.match(/sizes\s*:\s*\[([^\]]*)\]/);

    if (!id || !name || !price || !sizes) continue;

    const sizeList = sizes[1]
      .split(",")
      .map((size) => size.trim().replace(/^"|"$/g, ""))
      .filter(Boolean);

    if (!sizeList.length) continue;

    catalog.set(id[1], {
      name: unescapeName(name[1]),
      price: Number(price[1]),
      sizes: sizeList,
    });
  }

  return catalog;
}

function unescapeName(value) {
  try {
    return JSON.parse('"' + value + '"');
  } catch {
    return value.replace(/\\"/g, '"');
  }
}

async function webhook(request, env) {
  if (!env.HANDYPAY_WEBHOOK_SECRET) {
    return new Response("not configured", { status: 503 });
  }

  const raw = await request.text();
  const header = request.headers.get("X-HandyPay-Signature") || "";
  const signature = header.startsWith("sha256=") ? header.slice(7) : "";

  if (!signature || !(await verifySignature(raw, signature, env.HANDYPAY_WEBHOOK_SECRET))) {
    return new Response("invalid signature", { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  const type = event && event.type;
  const paid =
    type === "checkout.session.completed" ||
    type === "checkout.session.async_payment_succeeded";

  if (paid && env.ORDERS && event.id) {
    const seen = await env.ORDERS.get("evt:" + event.id);
    if (!seen) {
      await env.ORDERS.put("evt:" + event.id, "1", { expirationTtl: 7776000 });
      const session = (event.data && event.data.object) || {};
      await env.ORDERS.put(
        "order:" + Date.now() + ":" + (session.id || event.id),
        JSON.stringify(session)
      );
    }
  }

  return new Response("ok", { status: 200 });
}

async function verifySignature(payload, expectedHex, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  const hex = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  if (hex.length !== expectedHex.length) return false;

  let diff = 0;
  for (let i = 0; i < hex.length; i += 1) {
    diff |= hex.charCodeAt(i) ^ expectedHex.charCodeAt(i);
  }
  return diff === 0;
}

function corsHeaders(origin) {
  const allowed = origin && ALLOWED_ORIGINS.has(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function json(data, status, request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(request.headers.get("Origin")),
    },
  });
}
