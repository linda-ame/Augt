import Image from "next/image";

/**
 * Right-aligned soft background art for the “Šodien” day card.
 * Kept faded so left-side text stays readable.
 */
export function DayHeroArt() {
  return (
    <div
      className="pointer-events-none absolute inset-y-0 right-0 w-[min(58%,17rem)] sm:w-[min(52%,19rem)]"
      aria-hidden
    >
      <Image
        src="/brand/day-gospel.png"
        alt=""
        fill
        sizes="304px"
        className="object-contain object-right-bottom opacity-[0.42]"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(255,252,245,0.98) 0%, rgba(255,252,245,0.85) 34%, rgba(255,252,245,0.45) 62%, rgba(255,252,245,0.18) 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 top-0 h-12"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,252,245,0.7) 0%, transparent 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-12"
        style={{
          background:
            "linear-gradient(0deg, rgba(232,240,236,0.55) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}
