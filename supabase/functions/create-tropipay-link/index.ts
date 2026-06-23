/**
 * Supabase Edge Function — TropiPay Payment Link
 *
 * Replicado del patrón de petshop/pawnova.
 * Docs: https://doc.tropipay.com/docs/basics/create-paymentcards
 *
 * ── Deploy ──────────────────────────────────────────────────────────────────
 *   npx supabase functions deploy create-tropipay-link --project-ref <ref>
 *
 * ── Secrets en Supabase Dashboard → Edge Functions → Secrets ────────────────
 *   TROPIPAY_CLIENT_ID     = tu client_id
 *   TROPIPAY_CLIENT_SECRET = tu client_secret
 *   APP_URL                = https://ama-5svv.vercel.app
 *
 * Notas:
 *  - amount en CENTAVOS (35.50 USD → 3550)
 *  - En localhost/dev devuelve URL simulada para no necesitar credenciales
 *  - client: si tiene todos los datos del cliente se precargan en TropiPay
 *    Si algún campo falta, TropiPay los pide en su propia página
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const TROPIPAY_AUTH = "https://www.tropipay.com/api/v2/access/token";
const TROPIPAY_API  = "https://www.tropipay.com/api/v3";

const cors = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

async function getAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const res = await fetch(TROPIPAY_AUTH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id:     clientId,
      client_secret: clientSecret,
      grant_type:    "client_credentials",
      scope:         "ALLOW_PAYMENT_IN ALLOW_EXTERNAL_CHARGE",
    }),
  });
  if (!res.ok) throw new Error(`TropiPay auth failed: ${await res.text()}`);
  const { access_token } = await res.json();
  return access_token as string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const body = await req.json() as {
      orderId: string;
      amount: number;         // total en USD, ej: 35.50
      description?: string;
      customerName?: string;
      customerPhone?: string;
      customerAddress?: string; // dirección de entrega
    };

    const { orderId, amount, description, customerName, customerPhone, customerAddress } = body;

    if (!orderId || !amount) {
      return json({ error: "orderId y amount son requeridos" }, 400);
    }

    const clientId     = Deno.env.get("TROPIPAY_CLIENT_ID");
    const clientSecret = Deno.env.get("TROPIPAY_CLIENT_SECRET");
    const appUrl       = Deno.env.get("APP_URL") ?? "https://ama-5svv.vercel.app";

    // ── MODO SIMULADO (sin credenciales) ───────────────────────────────────
    if (!clientId || !clientSecret) {
      const mockUrl = `${appUrl}/?payment=success&order=${orderId}&simulated=true`;
      return json({ paymentUrl: mockUrl, reference: orderId, simulated: true });
    }

    // ── MODO REAL ──────────────────────────────────────────────────────────

    // 1. Token OAuth
    const accessToken = await getAccessToken(clientId, clientSecret);

    // 2. Objeto client — si tenemos nombre y teléfono lo pre-cargamos
    //    TropiPay requiere TODOS los campos o ninguno, así que solo enviamos
    //    client si podemos construirlo completo
    const nameParts = (customerName ?? "").trim().split(" ");
    const firstName = nameParts[0] ?? "-";
    const lastName  = nameParts.slice(1).join(" ") || "-";

    const hasFullClient = !!(customerName && customerPhone && customerAddress);

    const clientData = hasFullClient
      ? {
          name:               firstName,
          lastName:           lastName,
          address:            customerAddress!,
          phone:              customerPhone!,
          email:              "cliente@ama.cu",   // TropiPay lo requiere; usamos placeholder
          city:               "La Habana",
          postCode:           "10400",
          countryId:          54,                 // Cuba = 54
          termsAndConditions: "true",
          dateOfBirth:        "1990-01-01",        // placeholder requerido por API
        }
      : null;

    // 3. Crear enlace de pago
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
        urlSuccess:      `${appUrl}/?payment=success&order=${orderId}`,
        urlFailed:       `${appUrl}/?payment=failed&order=${orderId}`,
        urlNotification: `${appUrl}/api/payment-webhook`,
        directPayment:   true,
        paymentMethods:  ["EXT", "TPP"],
        client:          clientData,
      }),
    });

    if (!payRes.ok) {
      const errData = await payRes.json().catch(() => ({}));
      console.error("TropiPay paymentcards error:", JSON.stringify(errData));
      const msg = (errData as any)?.error?.message ?? `HTTP ${payRes.status}`;
      return json({ error: `TropiPay error: ${msg}` }, 502);
    }

    const payData = await payRes.json() as any;
    const paymentUrl = payData.shortUrl ?? payData.paymentUrl ?? payData.url;

    if (!paymentUrl) {
      return json({ error: "TropiPay no devolvió URL de pago" }, 502);
    }

    return json({ paymentUrl, reference: orderId });

  } catch (err) {
    console.error("Edge function error:", err);
    return json({ error: "Error interno al crear el enlace de pago" }, 500);
  }
});
