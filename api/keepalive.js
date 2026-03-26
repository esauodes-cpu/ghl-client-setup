const { getSupabase } = require("../lib/token-manager");

/**
 * GET /api/keepalive
 *
 * Ping ligero a Supabase para evitar que el proyecto free tier
 * se pause por inactividad (7 días sin queries).
 * Ejecutado semanalmente via Vercel Cron.
 */
module.exports = async function handler(req, res) {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from("ghl_tokens").select("company_id").limit(1);

    if (error) throw error;

    return res.status(200).json({ success: true, ping: "ok", timestamp: new Date().toISOString() });
  } catch (err) {
    console.error("Keepalive failed:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
