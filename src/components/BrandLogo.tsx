import Image from "next/image";
import Link from "next/link";

const HEADER_SIZES = {
  sm: {
    height: 44,
    width: 43,
    markClass: "h-10 w-auto sm:h-11",
    textClass: "text-2xl",
    gap: "gap-2",
  },
  md: {
    height: 56,
    width: 55,
    markClass: "h-12 w-auto sm:h-14",
    textClass: "text-3xl",
    gap: "gap-2.5",
  },
} as const;

const LANDING = {
  height: 420,
  width: 292,
  className:
    "h-[min(42dvh,18rem)] w-auto max-w-[min(70vw,16rem)] sm:h-[min(48dvh,22rem)] sm:max-w-[18rem]",
};

/**
 * Brand mark.
 * - sm/md (header): tree mark + label text beside it
 * - lg (landing): full wordmark PNG (tree + Augt baked in)
 */
export function BrandLogo({
  href = "/",
  size = "sm",
  className = "",
  as = "link",
  priority = false,
  label = "Augt",
}: {
  href?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  as?: "link" | "span";
  priority?: boolean;
  /** Text beside the tree (header sizes only). */
  label?: string;
}) {
  const content =
    size === "lg" ? (
      <Image
        src="/brand/augt-logo.png"
        alt=""
        width={LANDING.width}
        height={LANDING.height}
        priority={priority}
        unoptimized
        className={`${LANDING.className} object-contain`}
      />
    ) : (
      <>
        <Image
          src="/brand/augt-tree.png"
          alt=""
          width={HEADER_SIZES[size].width}
          height={HEADER_SIZES[size].height}
          priority={priority}
          unoptimized
          className={`${HEADER_SIZES[size].markClass} shrink-0 object-contain`}
        />
        <span
          className={`brand-mark whitespace-nowrap leading-snug text-[var(--bg-deep)] ${HEADER_SIZES[size].textClass}`}
        >
          {label}
        </span>
      </>
    );

  const shared =
    size === "lg"
      ? `inline-flex ${className}`
      : `inline-flex min-w-0 items-center ${HEADER_SIZES[size].gap} ${className}`;

  if (as === "span") {
    return (
      <span className={shared} aria-label={label}>
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={`shrink-0 ${shared}`}
      aria-label={`${label} — sākums`}
    >
      {content}
    </Link>
  );
}
