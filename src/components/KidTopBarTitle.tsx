"use client";

import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { resolveKidHeaderTitle } from "@/lib/kid-header";

export function KidTopBarTitle() {
  const pathname = usePathname() || "/kid";
  const { title, href } = resolveKidHeaderTitle(pathname);

  return <BrandLogo href={href} size="sm" label={title} />;
}
