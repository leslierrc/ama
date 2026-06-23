/**
 * Vercel Serverless Function — /api/tropipay
 *
 * Genera un enlace de pago TropiPay de forma segura en el servidor.
 * Las credenciales (client_id / client_secret) NUNCA van al browser.
 *
 * Replicado del patrón de petshop (pawnova-store).
 * Docs: https://doc.tropipay.com/docs/basics/create-paymentcards
 *
 * ── Variables de entorno en Vercel Dashboard → Settings → Environment Variables ──
 *   TROPIPAY_CLIENT_ID     = tu client_id de TropiPay
 *   TROPIPAY_CLIENT_SECRET = tu client_secret de TropiPay
 *   VITE_APP_URL           = https://ama-5svv.vercel.app  (sin slash final)
 */

const TROPIPAY_AUTH = "https://www.tropipay.com/api/v2/access/token";
const TROPIPAY_API  = "https://www.tropipay.com/api/v3";

const APP_URL = process.env.VITE_APP_URL ?? "https://ama-5svv.vercel.app";
const isDev   = APP_URL.startsWith("http://localhost") || APP_URL.startsWith("http://127.");

const hasCredentials =
  !!process.env.TROPIPAY_CLIENT_ID &&
  !!process.env.TROPIPAY_CLIENT_SECRET;

async function getAccessToken() {
  const res = await fetch(TROPIPAY_AUTH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id:     process.env.TROPIPAY_CLIENT_ID,
      client_secret: process.env.TROPIPAY_CLIENT_SECRET,
      grant_type:    "client_credentials",
      scope:         "ALLOW_PAYMENT_IN ALLOW_EXTERNAL_CHARGE",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TropiPay auth failed: ${err}`);
  }
  const data = await res.json();
  return data.access_token;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const {
      orderId,
      amount,           // en USD, ej: 35.50
      description,
      customerName,
      customerPhone,
      customerAddress,
    } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({ error: "orderId y amount son requeridos" });
    }

    // ── MODO SIMULADO: desarrollo local o sin credenciales ─────────────────
    if (!hasCredentials || isDev) {
      const mockUrl = `${APP_URL}/?payment=success&order=${orderId}&simulated=true`;
      return res.status(200).json({
        paymentUrl: mockUrl,
        reference:  orderId,
        simulated:  true,
      });
    }

    // ── MODO REAL ──────────────────────────────────────────────────────────

    // 1. OAuth token
    const accessToken = await getAccessToken();

    // 2. Objeto client — igual que petshop:
    //    si tenemos todos los campos lo pre-cargamos en TropiPay,
    //    si no, TropiPay se los pide al cliente en su página
    const nameParts = (customerName ?? "").trim().split(" ");
    const firstName = nameParts[0] ?? "-";
    const lastName  = nameParts.slice(1).join(" ") || "-";

    const hasFullClient = !!(customerName && customerPhone && customerAddress);

    const clientData = hasFullClient
      ? {
          name:               firstName,
          lastName:           lastName,
          address:            customerAddress,
          phone:              customerPhone,
          email:              "cliente@ama.cu",   // TropiPay lo requiere; placeholder
          city:               "La Habana",
          postCode:           "10400",
          countryId:          54,                 // Cuba = 54
          termsAndConditions: "true",
          dateOfBirth:        "1990-01-01",        // requerido por API
        }
      : null;

    // 3. Crear enlace de pago (amount en centavos)
    const amountCents = Math.round(amount * 100);

    const payRes = await fetch(`${TROPIPAY_API}/paymentcards`, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        reference:       orderId,
        concept:         `AMA Store – Pedido #${orderId}`,
        favorite:        false,
        description:     description ?? `Pedido AMA #${orderId}`,
        amount:          amountCents,
        currency:        "USD",
        singleUse:       true,
        reasonId:        4,
        expirationDays:  1,
        lang:            "es",
        urlSuccess:      `${APP_URL}/?payment=success&order=${orderId}`,
        urlFailed:       `${APP_URL}/?payment=failed&order=${orderId}`,
        urlNotification: `${APP_URL}/api/payment-webhook`,
        directPayment:   true,
        paymentMethods:  ["EXT", "TPP"],
        client:          clientData,
      }),
    });

    if (!payRes.ok) {
      const errData = await payRes.json().catch(() => ({}));
      console.error("[tropipay] paymentcards error:", JSON.stringify(errData));
      const msg = errData?.error?.message ?? `HTTP ${payRes.status}`;
      return res.status(502).json({ error: `TropiPay error: ${msg}` });
    }

    const payData = await payRes.json();
    const paymentUrl = payData.shortUrl ?? payData.paymentUrl ?? payData.url;

    if (!paymentUrl) {
      return res.status(502).json({ error: "TropiPay no devolvió URL de pago" });
    }

    return res.status(200).json({ paymentUrl, reference: orderId });

  } catch (err) {
    console.error("[tropipay] error:", err);
    return res.status(500).json({ error: "Error interno al crear el enlace de pago" });
  }
}
