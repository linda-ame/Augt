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

/** Landing: tree + live Literata wordmark — same lockup proportions as augt-logo.png. */
const LANDING = {
  height: 637,
  width: 621,
  /** Parent font-size = tree width; word uses em so size tracks the mark. */
  shellClass:
    "inline-flex w-[min(58vw,13rem)] flex-col items-center text-[length:min(58vw,13rem)] sm:w-[min(52vw,15rem)] sm:text-[length:min(52vw,15rem)]",
  markClass: "block h-auto w-full object-contain",
  /** ~0.85× tree width; -mt cancels Literata ascent so caps sit under the arc. */
  textClass:
    "brand-mark block w-full text-center font-light text-[length:0.32em] leading-none tracking-[-0.02em] -mt-[0.22em] text-[color:var(--bg-deep)]",
};

/**
 * Brand mark.
 * - sm/md (header): tree mark + label text beside it
 * - lg (landing): tree mark + label stacked (same Literata as headers)
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
  /** Text beside / below the tree. */
  label?: string;
}) {
  const content =
    size === "lg" ? (
      <span className={LANDING.shellClass}>
        <Image
          src="/brand/augt-tree.png"
          alt=""
          width={LANDING.width}
          height={LANDING.height}
          priority={priority}
          unoptimized
          className={LANDING.markClass}
        />
        <span className={LANDING.textClass}>{label}</span>
      </span>
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
