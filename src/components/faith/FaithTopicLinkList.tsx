import Link from "next/link";

/** Flat topic list styled like curriculum section rows (for basics, etc.). */
export function FaithTopicLinkList({
  items,
}: {
  items: { href: string; title: string }[];
}) {
  return (
    <div className="faith-curriculum-menu">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className="faith-topic-link-row">
          <span className="faith-topic-toggle-label">{item.title}</span>
          <span className="faith-topic-group-arrow" aria-hidden>
            →
          </span>
        </Link>
      ))}
    </div>
  );
}
