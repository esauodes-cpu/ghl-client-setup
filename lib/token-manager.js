const { createClient } = require("@supabase/supabase-js");

const GHL_BASE_URL = "https://services.leadconnectorhq.com";

/**
 * Inicializa el cliente de Supabase.
 */
function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
}

/**
 * Guarda o actualiza tokens de agencia en Supabase.
 */
async function saveAgencyTokens(companyId, accessToken, refreshToken, expiresIn) {
  const supabase = getSupabase();
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  const { data, error } = await supabase
    .from("ghl_tokens")
    .upsert(
      {
        company_id: companyId,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
      },
      { onConflict: "company_id" }
    )
    .select();

  if (error) throw new Error(`Supabase upsert error: ${error.message}`);
  return data;
}

/**
 * Obtiene los tokens de agencia desde Supabase.
 * Si el access token expiró, lo renueva automáticamente.
 */
async function getAgencyTokens(companyId) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("ghl_tokens")
    .select("*")
    .eq("company_id", companyId)
    .single();

  if (error || !data) {
    throw new Error(
      `No tokens found for company ${companyId}. Install the app first.`
    );
  }

  // Verificar si el token expiró (con 5 min de margen)
  const now = new Date();
  const expiresAt = new Date(data.expires_at);
  const fiveMinutes = 5 * 60 * 1000;

  if (now.getTime() > expiresAt.getTime() - fiveMinutes) {
    // Renovar el token
    const refreshed = await refreshAgencyToken(data.refresh_token);
    await saveAgencyTokens(
      companyId,
      refreshed.access_token,
      refreshed.refresh_token,
      refreshed.expires_in
    );
    return {
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
    };
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  };
}

/**
 * Renueva el access token usando el refresh token.
 * IMPORTANTE: El refresh token de GHL es de un solo uso.
 * Cada refresh devuelve un nuevo refresh_token que invalida el anterior.
 */
async function refreshAgencyToken(refreshToken) {
  const res = await fetch(`${GHL_BASE_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GHL_CLIENT_ID,
      client_secret: process.env.GHL_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      user_type: "Company",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${res.status} — ${err}`);
  }

  return res.json();
}

/**
 * Intercambia el token de agencia por un token de subcuenta (location).
 * Este token se obtiene en tiempo real y NO se guarda en la DB.
 */
async function getLocationToken(companyId, locationId) {
  const agency = await getAgencyTokens(companyId);

  const res = await fetch(`${GHL_BASE_URL}/oauth/locationToken`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Version: "2021-07-28",
      Authorization: `Bearer ${agency.access_token}`,
    },
    body: new URLSearchParams({
      companyId,
      locationId,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(
      `Location token exchange failed: ${res.status} — ${err}`
    );
  }

  const data = await res.json();
  return data.access_token;
}

/**
 * Intercambia el authorization code por tokens (primer install).
 */
async function exchangeCodeForTokens(code) {
  const res = await fetch(`${GHL_BASE_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GHL_CLIENT_ID,
      client_secret: process.env.GHL_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      user_type: "Company",
      redirect_uri: process.env.GHL_REDIRECT_URI,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Code exchange failed: ${res.status} — ${err}`);
  }

  return res.json();
}

module.exports = {
  GHL_BASE_URL,
  getSupabase,
  saveAgencyTokens,
  getAgencyTokens,
  refreshAgencyToken,
  getLocationToken,
  exchangeCodeForTokens,
};
