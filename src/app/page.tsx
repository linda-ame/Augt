import { AuthCodeRedirect } from "@/components/AuthCodeRedirect";
import { HomeLanding } from "@/components/HomeLanding";
import { getGuestAgeBand } from "@/lib/guest-age";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ changeAge?: string }>;
}) {
  const params = await searchParams;
  const band = await getGuestAgeBand();
  const forcePicker = params.changeAge === "1";

  return (
    <>
      <AuthCodeRedirect />
      <HomeLanding initialBand={band} forcePicker={forcePicker} />
    </>
  );
}
