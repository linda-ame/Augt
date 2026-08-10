/** Sticky header: tree always; label is Augt on today, otherwise the section name. */

export type KidHeaderTitle = {
  title: string;
  href: string;
  /** True when showing the Augt brand (home / today). */
  isBrand: boolean;
};

export function resolveKidHeaderTitle(pathname: string): KidHeaderTitle {
  const path = pathname.split("?")[0] || "/kid";

  if (path === "/kid" || path === "/kid/") {
    return { title: "Augt", href: "/kid", isBrand: true };
  }
  if (path.startsWith("/kid/prayers")) {
    return { title: "Lūgšanas", href: "/kid/prayers", isBrand: false };
  }
  if (path.startsWith("/kid/faith")) {
    return { title: "Mana ticība", href: "/kid/faith", isBrand: false };
  }
  if (path.startsWith("/kid/confession")) {
    return { title: "Grēksūdze", href: "/kid/confession", isBrand: false };
  }
  if (path.startsWith("/kid/profile")) {
    return { title: "Profils", href: "/kid/profile", isBrand: false };
  }
  if (path.startsWith("/kid/settings")) {
    return { title: "Paziņojumi", href: "/kid/settings", isBrand: false };
  }

  return { title: "Augt", href: "/kid", isBrand: true };
}
