import { getRequestIP } from "@tanstack/react-start/server";

/** Throws when the caller (by IP) exceeds `limit` hits per `windowSeconds` for `action`. */
export async function enforceRateLimit(action: string, limit: number, windowSeconds: number) {
  const ip = getRequestIP({ xForwardedFor: true }) ?? "unknown";
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("hit_rate_limit", {
    _key: `${action}:${ip}`,
    _limit: limit,
    _window_seconds: windowSeconds,
  });
  if (error) {
    console.error("rate limit check failed", error.message);
    return;
  }
  if (data === false) throw new Error("Too many attempts. Please wait a minute and try again.");
}
