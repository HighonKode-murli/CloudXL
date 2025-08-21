import { createGoogleOAuthClient } from "../config/google.js";
import { refreshDropboxAccessToken } from '../config/dropbox.js';

export async function ensureAccessToken(account) {
  const now = Date.now();
  const valid =
    account.expiresAt && new Date(account.expiresAt).getTime() - 60000 > now;
  if (valid && account.accessToken) return account.accessToken;

  if (account.provider === "google") {
    const oauth2 = createGoogleOAuthClient();
    oauth2.setCredentials({ refresh_token: account.refreshToken });
    const { credentials } = await oauth2.refreshAccessToken();
    account.accessToken = credentials.access_token;
    account.expiresAt = new Date(
      credentials.expiry_date || Date.now() + 3600 * 1000
    );
    return account.accessToken;
  }

  if (account.provider === "dropbox") {
    const data = await refreshDropboxAccessToken(account.refreshToken);
    account.accessToken = data.access_token;
    account.expiresAt = new Date(Date.now() + (data.expires_in - 60) * 1000);
    return account.accessToken;
  }

  throw new Error("unknown provider");
}
