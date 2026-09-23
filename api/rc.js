// api/rc.js
// Private proxy for FireAPI RC Vehicle Info
// Keeps the real API key hidden on the server side.
// Developed by @its_aritra_nath

const FIREAPI_URL = "https://api.fireapi.io/secure-app/rc-vehicle-info/v1";

// Developer credit (shown in every JSON response)
const DEVELOPER = {
  name: "Aritra Nath",
  instagram: "@its_aritra_nath",
  credit: "API developed by @its_aritra_nath",
};

// Private API key (hardcoded, required from browser or any client)
const PRIVATE_KEY = "aritra";

// CORS + JSON helper
function send(res, status, body) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");
  res.status(status).send(
    JSON.stringify(
      {
        developer: DEVELOPER,
        ...body,
      },
      null,
      2
    )
  );
}

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    send(res, 405, { success: false, error: "Method not allowed. Use GET." });
    return;
  }

  // ---- Private key check (accessible from browser) ----
  // Accept ?key=aritra OR header x-api-key: aritra
  const providedKey =
    (req.query.key && String(req.query.key).trim()) ||
    (req.headers["x-api-key"] && String(req.headers["x-api-key"]).trim()) ||
    "";

  if (providedKey !== PRIVATE_KEY) {
    send(res, 401, {
      success: false,
      error: "Unauthorized",
      message: "Missing or invalid API key.",
      hint: "Pass your key as ?key=YOUR_KEY or header x-api-key: YOUR_KEY",
      credit: DEVELOPER.credit,
    });
    return;
  }

  // ---- Get vehicle number ----
  const vehicle_no = (req.query.vehicle_no || "").trim().toUpperCase();

  if (!vehicle_no) {
    send(res, 400, {
      success: false,
      error: "Bad request",
      message: "Missing query parameter: vehicle_no",
      example: "/api/rc?key=aritra&vehicle_no=WB26D2797",
    });
    return;
  }

  // Basic RC format check (Indian style): e.g. WB26D2797
  if (!/^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$/.test(vehicle_no)) {
    send(res, 400, {
      success: false,
      error: "Invalid RC format",
      message: "Expected something like WB26D2797",
      received: vehicle_no,
    });
    return;
  }

  const apiKey = process.env.FIREAPI_KEY;

  if (!apiKey) {
    send(res, 500, {
      success: false,
      error: "Server misconfigured",
      message: "FIREAPI_KEY is not set in environment variables.",
    });
    return;
  }

  const url = `${FIREAPI_URL}?vehicle_no=${encodeURIComponent(vehicle_no)}`;

  try {
    const r = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });

    const text = await r.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    // Pass through FireAPI status
    send(res, r.status, {
      proxy: {
        ok: r.ok,
        upstream_status: r.status,
        vehicle_no,
        fetched_at: new Date().toISOString(),
      },
      ...data,
    });
  } catch (err) {
    send(res, 502, {
      success: false,
      error: "Upstream request failed",
      message: String(err),
    });
  }
}
