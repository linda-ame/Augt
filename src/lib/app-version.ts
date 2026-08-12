/** Short git SHA shown on the landing page (Vercel / Pages / local). */
export function getAppVersionLabel(): string {
  const sha =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.CF_PAGES_COMMIT_SHA ||
    process.env.NEXT_PUBLIC_APP_GIT_SHA ||
    "";
  const short = sha.trim().slice(0, 7);
  return short || "dev";
}
