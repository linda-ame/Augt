"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export type ParentContentChild = {
  id: string;
  display_name: string;
  age: number;
};

export function ParentContentPicker({
  childrenList,
  selectedId,
  date,
}: {
  childrenList: ParentContentChild[];
  selectedId: string;
  date: string;
}) {
  const router = useRouter();

  if (childrenList.length === 0) return null;

  return (
    <div
      className="flex flex-wrap gap-2"
      role="tablist"
      aria-label="Izvēlies bērnu"
    >
      {childrenList.map((c) => {
        const selected = c.id === selectedId;
        const href = `/parent/content?childId=${encodeURIComponent(c.id)}&date=${encodeURIComponent(date)}`;
        return (
          <Link
            key={c.id}
            href={href}
            role="tab"
            aria-selected={selected}
            onClick={(e) => {
              e.preventDefault();
              router.push(href);
            }}
            className={
              selected
                ? "btn btn-accent !px-3 !py-1.5 text-sm"
                : "btn btn-secondary !px-3 !py-1.5 text-sm"
            }
          >
            {c.display_name}
            <span className="opacity-70"> · {c.age}</span>
          </Link>
        );
      })}
    </div>
  );
}
