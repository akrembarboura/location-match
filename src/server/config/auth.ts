export const AUTH_CONFIG = {
  SESSION_COOKIE_NAME: "loc_maison_session",
  JWT_EXPIRES_IN: "7d",
  JWT_ALGORITHM: "HS256" as const,
  COOKIE_OPTIONS: {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  },
};

