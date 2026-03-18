const { exchangeCodeForTokens, saveAgencyTokens } = require("../../lib/token-manager");

/**
 * GET /api/oauth/callback
 *
 * Callback de OAuth de GHL. Recibe el authorization code después de
 * que instalas la app en tu agencia, lo intercambia por tokens,
 * y los guarda en Supabase.
 *
 * Este flujo solo se ejecuta UNA VEZ al instalar la app.
 */
module.exports = async function handler(req, res) {
  const { code, error } = req.query;

  if (error) {
    return res.status(400).send(`
      <html><body style="font-family:system-ui;padding:40px;max-width:600px;margin:0 auto;">
        <h1 style="color:#dc2626;">Error de Autorización</h1>
        <p>GHL devolvió: <strong>${error}</strong></p>
      </body></html>
    `);
  }

  if (!code) {
    return res.status(400).send(`
      <html><body style="font-family:system-ui;padding:40px;max-width:600px;margin:0 auto;">
        <h1>Falta el código de autorización</h1>
        <p>Instala la app desde el marketplace de GHL.</p>
      </body></html>
    `);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    await saveAgencyTokens(
      tokens.companyId,
      tokens.access_token,
      tokens.refresh_token,
      tokens.expires_in
    );

    res.status(200).send(`
      <html><body style="font-family:system-ui;padding:40px;max-width:600px;margin:0 auto;">
        <h1 style="color:#16a34a;">✅ App Instalada Exitosamente</h1>
        <p>Los tokens de tu agencia han sido guardados.</p>
        <h2>Detalles:</h2>
        <ul>
          <li><strong>Company ID:</strong> ${tokens.companyId}</li>
          <li><strong>User Type:</strong> ${tokens.userType}</li>
          <li><strong>Token expira en:</strong> ${Math.round(tokens.expires_in / 3600)} horas</li>
        </ul>
        <p style="margin-top:24px;color:#16a34a;font-weight:bold;">
          Ya puedes usar los endpoints desde GHL. Este paso no necesita repetirse.
        </p>
      </body></html>
    `);
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.status(500).send(`
      <html><body style="font-family:system-ui;padding:40px;max-width:600px;margin:0 auto;">
        <h1 style="color:#dc2626;">Error al procesar tokens</h1>
        <p>${err.message}</p>
      </body></html>
    `);
  }
};
