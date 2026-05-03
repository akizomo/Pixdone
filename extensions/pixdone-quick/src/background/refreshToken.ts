/**
 * Firebase secure-token API — refresh an ID token with the refresh token.
 * Public Web API key is safe to embed (it's the same one any Firebase Web SDK client uses).
 * https://firebase.google.com/docs/reference/rest/auth#section-refresh-token
 */

interface RefreshResponse {
  idToken: string;
  refreshToken: string;
  expiresAt: number; // ms epoch
}

interface RawRefreshResponse {
  id_token?: string;
  access_token?: string;
  refresh_token?: string;
  expires_in?: string;
}

export async function refreshFirebaseToken(
  apiKey: string,
  refreshToken: string,
): Promise<RefreshResponse> {
  const url = `https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(apiKey)}`;
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`refresh failed: ${resp.status} ${text}`);
  }

  const json = (await resp.json()) as RawRefreshResponse;
  const idToken = json.id_token ?? json.access_token;
  const nextRefresh = json.refresh_token ?? refreshToken;
  const expiresInSec = Number.parseInt(json.expires_in ?? '3600', 10);
  if (!idToken) throw new Error('refresh returned no id_token');

  return {
    idToken,
    refreshToken: nextRefresh,
    expiresAt: Date.now() + expiresInSec * 1000,
  };
}
