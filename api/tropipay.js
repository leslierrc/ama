/**
 * Vercel Serverless Function — /api/tropipay
 *
 * Genera un enlace de pago TropiPay de forma segura en el servidor.
 * Las credenciales (client_id / client_secret) NUNCA van al browser.
 *
 * Docs oficiales: https://doc.tropipay.com/docs/basics/create-paymentcards
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
    const accessToken = await getAccessToken();

    // amount en centavos según doc: 10.55 EUR → 1055
    const amountCents = Math.round(amount * 100);

    // client: pasar null para que TropiPay pida los datos al cliente en su página.
    // Según doc: "pass null to let TropiPay request the client data in the payment card"
    // No pasar datos incompletos — causa errores de validación.
    const clientData = null;

    const payload = {
      reference:       orderId,
      concept:         `AMA Store – Pedido #${orderId}`,
      favorite:        false,
      description:     description ?? `Pedido AMA #${orderId}`,
      amount:          amountCents,
      currency:        "EUR",        // EUR es la moneda base de TropiPay
      singleUse:       true,
      reasonId:        4,
      expirationDays:  1,
      lang:            "es",
      urlSuccess:      `${APP_URL}/?payment=success&order=${orderId}`,
      urlFailed:       `${APP_URL}/?payment=failed&order=${orderId}`,
      urlNotification: `${APP_URL}/api/payment-webhook`,
      // directPayment: true activa flujo que requiere cuenta Business y genera
      // "Card credit cashin limit exceded" en cuentas personales. Se omite.
      paymentMethods:  ["EXT", "TPP"],
      client:          clientData,
    };

    console.log("[tropipay] payload:", JSON.stringify({ ...payload, amount: amountCents }));

    const payRes = await fetch(`${TROPIPAY_API}/paymentcards`, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const payData = await payRes.json();

    if (!payRes.ok) {
      console.error("[tropipay] paymentcards error:", JSON.stringify(payData));
      const msg = payData?.error?.message ?? payData?.message ?? `HTTP ${payRes.status}`;
      return res.status(502).json({ error: `TropiPay error: ${msg}` });
    }

    const paymentUrl = payData.shortUrl ?? payData.paymentUrl ?? payData.url;

    if (!paymentUrl) {
      console.error("[tropipay] no paymentUrl in response:", JSON.stringify(payData));
      return res.status(502).json({ error: "TropiPay no devolvió URL de pago" });
    }

    return res.status(200).json({ paymentUrl, reference: orderId });

  } catch (err) {
    console.error("[tropipay] error:", err);
    return res.status(500).json({ error: "Error interno al crear el enlace de pago" });
  }
}
