/**
 * Vercel Serverless Function — /api/notify-order
 *
 * Envía email de notificación de pedido a los admins usando Resend.
 * Se llama desde el ShoppingCart cuando se realiza un pedido.
 *
 * ── Variables de entorno en Vercel Dashboard → Settings → Environment Variables ──
 *   RESEND_API_KEY = re_xxxxxxxxxxxx  (obtener en resend.com → API Keys)
 *
 * ── Setup rápido de Resend ──────────────────────────────────────────────────
 *   1. Crear cuenta gratis en https://resend.com
 *   2. Dashboard → API Keys → Create API Key
 *   3. Pegar la key en Vercel como RESEND_API_KEY
 *   4. (Opcional) Verificar dominio para enviar desde amacontrera93@gmail.com
 *      Si no verificas dominio, usa: onboarding@resend.dev como remitente
 */

const ADMIN_EMAILS = [
  "serranoadrianr99@gmail.com",
  "leslierrodriguezcontrera25@gmail.com",
];

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "AMA Store <onboarding@resend.dev>";
const WA_NUMBER  = "5355542936";

function buildOrderHtml(order) {
  const { orderNumber, customerName, customerPhone, customerAddress, notes, paymentMethod, total, items, gpsLat, gpsLng } = order;

  const itemsHtml = (items || []).map(item => {
    const subtotal = (item.price * item.quantity).toLocaleString("en-US", { minimumFractionDigits: 2 });
    let row = `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0ebe0;color:#1c3a2f;">${item.quantity}×</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0ebe0;color:#1c3a2f;font-weight:600;">${item.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0ebe0;color:#9b4500;font-weight:600;text-align:right;">$${subtotal}</td>
      </tr>`;
    if (item.comboItems && item.comboItems.length > 0) {
      row += item.comboItems.map(ci => `
      <tr>
        <td style="padding:2px 12px 2px 24px;color:#707974;font-size:12px;"></td>
        <td colspan="2" style="padding:2px 12px 2px 24px;color:#707974;font-size:12px;">↳ ${ci.quantity}× ${ci.name}</td>
      </tr>`).join("");
    }
    return row;
  }).join("");

  const totalFmt = Number(total).toLocaleString("en-US", { minimumFractionDigits: 2 });
  const paymentLabel = paymentMethod === "tropipay" ? "TropiPay 💳 (Pago online)" : paymentMethod === "whatsapp" ? "Contra entrega en USD" : paymentMethod;
  const gpsLink = gpsLat && gpsLng ? `https://www.google.com/maps/place/${gpsLat},${gpsLng}` : null;
  const dateStr = new Date().toLocaleString("es-ES", { dateStyle: "full", timeStyle: "short" });

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f3ec;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">

    <!-- Header -->
    <div style="background:#003527;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
      <h1 style="margin:0;color:white;font-size:28px;font-family:Georgia,serif;letter-spacing:-0.5px;">
        <span style="color:#e07b39;">A</span>MA Store
      </h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">Nuevo pedido recibido</p>
    </div>

    <!-- Body -->
    <div style="background:white;padding:32px;border:1px solid #e6e3d3;border-top:none;">

      <!-- Order number -->
      <div style="background:#f7f3ec;border-radius:12px;padding:16px 20px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;border:1px solid #e6e3d3;">
        <div>
          <p style="margin:0;font-size:11px;color:#707974;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Número de pedido</p>
          <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#003527;font-family:monospace;">#${orderNumber}</p>
        </div>
        <div style="text-align:right;">
          <p style="margin:0;font-size:11px;color:#707974;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Fecha</p>
          <p style="margin:4px 0 0;font-size:13px;color:#1c3a2f;">${dateStr}</p>
        </div>
      </div>

      <!-- Customer info -->
      <h2 style="margin:0 0 16px;font-size:14px;color:#707974;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Datos del cliente</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0ebe0;color:#707974;font-size:13px;width:40%;">👤 Nombre</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0ebe0;color:#1c3a2f;font-size:13px;font-weight:600;">${customerName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0ebe0;color:#707974;font-size:13px;">📞 Teléfono</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0ebe0;color:#1c3a2f;font-size:13px;font-weight:600;">${customerPhone}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0ebe0;color:#707974;font-size:13px;">📍 Dirección</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0ebe0;color:#1c3a2f;font-size:13px;">${customerAddress}</td>
        </tr>
        ${gpsLink ? `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0ebe0;color:#707974;font-size:13px;">🧭 Ubicación</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0ebe0;font-size:13px;">
            <a href="${gpsLink}" style="color:#003527;font-weight:600;">Ver en Google Maps</a>
          </td>
        </tr>` : ""}
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0ebe0;color:#707974;font-size:13px;">💬 Notas</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0ebe0;color:#1c3a2f;font-size:13px;">${notes || "Sin notas"}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#707974;font-size:13px;">💳 Pago</td>
          <td style="padding:8px 0;color:#1c3a2f;font-size:13px;font-weight:600;">${paymentLabel}</td>
        </tr>
      </table>

      <!-- Products -->
      <h2 style="margin:0 0 16px;font-size:14px;color:#707974;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Productos</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr style="background:#f7f3ec;">
            <th style="padding:8px 12px;text-align:left;font-size:11px;color:#707974;text-transform:uppercase;letter-spacing:0.1em;">Cant.</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;color:#707974;text-transform:uppercase;letter-spacing:0.1em;">Producto</th>
            <th style="padding:8px 12px;text-align:right;font-size:11px;color:#707974;text-transform:uppercase;letter-spacing:0.1em;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr style="background:#f7f3ec;">
            <td colspan="2" style="padding:12px;font-weight:700;color:#1c3a2f;font-size:15px;">TOTAL</td>
            <td style="padding:12px;font-weight:700;color:#9b4500;font-size:18px;text-align:right;">$${totalFmt}</td>
          </tr>
        </tfoot>
      </table>

      <!-- Actions -->
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:8px;">
        <a href="https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Pedido #${orderNumber} — ${customerName} — $${totalFmt}`)}"
          style="flex:1;min-width:140px;background:#25d366;color:white;text-decoration:none;padding:14px 20px;border-radius:10px;text-align:center;font-weight:600;font-size:13px;">
          💬 WhatsApp cliente
        </a>
        ${gpsLink ? `
        <a href="${gpsLink}"
          style="flex:1;min-width:140px;background:#003527;color:white;text-decoration:none;padding:14px 20px;border-radius:10px;text-align:center;font-weight:600;font-size:13px;">
          🗺️ Ver ubicación
        </a>` : ""}
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f7f3ec;border:1px solid #e6e3d3;border-top:none;border-radius:0 0 16px 16px;padding:16px 32px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#707974;">AMA Store · La Habana, Cuba · Responde a este email para contactar al equipo</p>
    </div>
  </div>
</body>
</html>`;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Sin Resend configurado — responder OK para no bloquear el flujo del usuario
    console.warn("[notify-order] RESEND_API_KEY no configurada — email no enviado");
    return res.status(200).json({ sent: false, reason: "RESEND_API_KEY not set" });
  }

  try {
    const order = req.body;
    if (!order.orderNumber) {
      return res.status(400).json({ error: "orderNumber requerido" });
    }

    const html = buildOrderHtml(order);
    const subject = `🛒 Nuevo pedido AMA #${order.orderNumber} — ${order.customerName} ($${Number(order.total).toLocaleString("en-US", { minimumFractionDigits: 2 })})`;

    // Enviar a todos los admins en un solo email (BCC)
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from:    FROM_EMAIL,
        to:      ADMIN_EMAILS,
        subject,
        html,
        reply_to: "amacontrera93@gmail.com",
      }),
    });

    if (!emailRes.ok) {
      const errData = await emailRes.json().catch(() => ({}));
      console.error("[notify-order] Resend error:", JSON.stringify(errData));
      // No fallar el flujo del usuario por un email que no llegó
      return res.status(200).json({ sent: false, error: errData?.message });
    }

    const emailData = await emailRes.json();
    console.log("[notify-order] Email enviado:", emailData.id);
    return res.status(200).json({ sent: true, id: emailData.id });

  } catch (err) {
    console.error("[notify-order] error:", err);
    return res.status(200).json({ sent: false, error: String(err) });
  }
}
