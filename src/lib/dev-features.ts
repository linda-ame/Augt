/** Feature flags for guest content modes (Ģimene, future adult, …). */

export function hostnameFromRequestHost(host: string | null | undefined): string {
  if (!host) return "";
  return host.split(":")[0]?.toLowerCase() ?? "";
}

export function isLocalDevHost(host: string | null | undefined): boolean {
  const h = hostnameFromRequestHost(host);
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h === "::1";
}

/**
 * Ģimene mode in the picker / cookie.
 * On by default (public web). Set ENABLE_FAMILY_MODE=0 to hide.
 */
export function isFamilyModeEnabled(_host?: string | null): boolean {
  if (process.env.ENABLE_FAMILY_MODE === "0") return false;
  return true;
}
