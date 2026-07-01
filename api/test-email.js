/**
 * /api/test-email — Diagnóstico y prueba de email
 *
 * Visita: https://ama-5svv.vercel.app/api/test-email
 * Eliminar este archivo después de confirmar que funciona.
 */
export default async function handler(req, res) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "AMA Store <onboarding@resend.dev>";

  // ── Diagnóstico de configuración ──────────────────────────────
  const config = {
    RESEND_API_KEY:    apiKey ? `✅ Configurada (${apiKey.substring(0, 8)}...)` : "❌ NO configurada",
    RESEND_FROM_EMAIL: fromEmail,
    VITE_APP_URL:      process.env.VITE_APP_URL || "❌ No configurada",
    TROPIPAY_CLIENT_ID: process.env.TROPIPAY_CLIENT_ID ? "✅ Configurada" : "❌ No configurada",
  };

  if (!apiKey || apiKey.startsWith("re_xxx")) {
    return res.status(200).json({
      ok: false,
      config,
      fix: [
        "1. Ve a https://resend.com → crear cuenta gratis",
        "2. Dashboard → API Keys → Create API Key",
        "3. Vercel → tu proyecto → Settings → Environment Variables",
        "4. Agregar: RESEND_API_KEY = re_tu_key_real",
        "5. Redeploy el proyecto en Vercel",
      ],
    });
  }

  // ── Intentar enviar email de prueba ───────────────────────────
  try {
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from:    fromEmail,
        to:      fromEmail.includes("onboarding@resend.dev") ? ["leslierrodriguezcontrera25@gmail.com"] : ["serranoadrianr99@gmail.com", "leslierrodriguezcontrera25@gmail.com"],
        subject: "✅ Prueba AMA Store — Notificaciones funcionando",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:32px;background:#f7f3ec;border-radius:16px;">
            <h2 style="color:#003527;font-family:Georgia,serif;margin:0 0 16px;">
              <span style="color:#e07b39;">A</span>MA Store — Email de prueba
            </h2>
            <div style="background:white;border-radius:12px;padding:20px;border:1px solid #e6e3d3;">
              <p style="color:#1c3a2f;margin:0 0 8px;">✅ Las notificaciones de pedidos están configuradas correctamente.</p>
              <p style="color:#707974;font-size:13px;margin:0;">
                Este email fue enviado el ${new Date().toLocaleString("es-ES", { dateStyle: "full", timeStyle: "short" })}
              </p>
            </div>
            <p style="color:#9b4500;font-size:12px;margin:16px 0 0;">
              Puedes eliminar el archivo <code>api/test-email.js</code> después de confirmar que funciona.
            </p>
          </div>
        `,
      }),
    });

    const data = await emailRes.json();

    if (!emailRes.ok) {
      return res.status(200).json({
        ok: false,
        config,
        resend_status: emailRes.status,
        resend_error: data,
        tip: emailRes.status === 403
          ? "Dominio no verificado. Cambia RESEND_FROM_EMAIL a: AMA Store <onboarding@resend.dev>"
          : "Revisa que la API key sea válida y esté activa en resend.com",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "✅ Email enviado — revisa la bandeja de entrada (y spam)",
      email_id: data.id,
      sent_to:  ["serranoadrianr99@gmail.com", "leslierrodriguezcontrera25@gmail.com"],
      config,
    });

  } catch (err) {
    return res.status(200).json({ ok: false, error: String(err), config });
  }
}
