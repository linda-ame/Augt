import { AuthCodeRedirect } from "@/components/AuthCodeRedirect";
import { HomeLanding } from "@/components/HomeLanding";
import { isFamilyModeEnabled } from "@/lib/dev-features";
import { isFamilyModeId } from "@/lib/family-content";
import { getGuestAgeBand } from "@/lib/guest-age";
import { getAppVersionLabel } from "@/lib/app-version";
import { headers } from "next/headers";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ changeAge?: string }>;
}) {
  const params = await searchParams;
  const band = await getGuestAgeBand();
  const forcePicker = params.changeAge === "1";
  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const showFamilyMode = isFamilyModeEnabled(host);
  const initialBand =
    band && isFamilyModeId(band) && !showFamilyMode ? null : band;

  return (
    <>
      <AuthCodeRedirect />
      <HomeLanding
        initialBand={initialBand}
        forcePicker={forcePicker}
        showFamilyMode={showFamilyMode}
        appVersion={getAppVersionLabel()}
      />
    </>
  );
}
