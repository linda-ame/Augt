import Link from "next/link";

export type FaithPagerLink = {
  href: string;
  label: string;
};

export function FaithSectionPager({
  prev,
  next,
}: {
  prev?: FaithPagerLink | null;
  next?: FaithPagerLink | null;
}) {
  if (!prev && !next) return null;

  const mode = prev && next ? "multi" : prev ? "one-left" : "one-right";

  return (
    <nav className={`faith-lesson-nav faith-lesson-nav--${mode}`} aria-label="Sadaļu navigācija">
      {prev ? (
        <Link className="faith-nav-btn faith-nav-btn--prev" href={prev.href}>
          ← {prev.label}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link className="faith-nav-btn faith-nav-btn--next" href={next.href}>
          {next.label} →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
