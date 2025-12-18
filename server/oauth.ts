import { storage } from "./storage";
import crypto from "crypto";

const MICROSOFT_AUTH_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
const MICROSOFT_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
const SCOPES = "openid profile email offline_access User.Read Mail.Read Calendars.Read";

function getRedirectUri(): string {
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0] || process.env.REPLIT_DEV_DOMAIN;
  return `https://${domain}/api/auth/outlook/callback`;
}

export async function createOAuthState(sessionId: string): Promise<string> {
  const state = crypto.randomBytes(32).toString('hex');
  await storage.createOAuthState({ state, sessionId });
  await storage.cleanupExpiredOAuthStates();
  return state;
}

export async function validateAndConsumeState(state: string): Promise<string | null> {
  const oauthState = await storage.getAndDeleteOAuthState(state);
  if (!oauthState) {
    return null;
  }
  if (!oauthState.createdAt) {
    console.error("[OAuth] State missing createdAt timestamp");
    return null;
  }
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  if (oauthState.createdAt < tenMinutesAgo) {
    console.log("[OAuth] State expired, rejecting");
    return null;
  }
  return oauthState.sessionId;
}

export function getAuthUrl(state: string): string {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  if (!clientId) {
    throw new Error("MICROSOFT_CLIENT_ID not configured");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: getRedirectUri(),
    response_mode: "query",
    scope: SCOPES,
    state: state,
    prompt: "select_account"
  });

  return `${MICROSOFT_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}> {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error("Microsoft OAuth credentials not configured");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code: code,
    redirect_uri: getRedirectUri(),
    grant_type: "authorization_code",
    scope: SCOPES
  });

  const response = await fetch(MICROSOFT_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[OAuth] Token exchange failed:", error);
    throw new Error("Failed to exchange code for tokens");
  }

  const data = await response.json();
  const expiresAt = new Date(Date.now() + (data.expires_in * 1000));

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}> {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error("Microsoft OAuth credentials not configured");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
    scope: SCOPES
  });

  const response = await fetch(MICROSOFT_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });

  if (!response.ok) {
    throw new Error("Failed to refresh token");
  }

  const data = await response.json();
  const expiresAt = new Date(Date.now() + (data.expires_in * 1000));

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt
  };
}

export async function getMicrosoftUserInfo(accessToken: string): Promise<{
  email: string;
  displayName: string;
}> {
  const response = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error("Failed to get user info");
  }

  const data = await response.json();
  return {
    email: data.mail || data.userPrincipalName || "unknown",
    displayName: data.displayName || "Unknown User"
  };
}

export async function getValidAccessToken(sessionId: string): Promise<string | null> {
  const token = await storage.getOAuthToken(sessionId, "microsoft");
  if (!token) {
    return null;
  }

  if (token.expiresAt && token.expiresAt < new Date()) {
    if (!token.refreshToken) {
      await storage.deleteOAuthToken(sessionId, "microsoft");
      return null;
    }

    try {
      const newTokens = await refreshAccessToken(token.refreshToken);
      await storage.upsertOAuthToken({
        sessionId,
        provider: "microsoft",
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        expiresAt: newTokens.expiresAt,
        email: token.email,
        displayName: token.displayName
      });
      return newTokens.accessToken;
    } catch (error) {
      console.error("[OAuth] Failed to refresh token:", error);
      await storage.deleteOAuthToken(sessionId, "microsoft");
      return null;
    }
  }

  return token.accessToken;
}

export function isOAuthConfigured(): boolean {
  return !!(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET);
}
