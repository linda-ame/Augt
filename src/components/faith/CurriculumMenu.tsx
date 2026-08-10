"use client";

import { useState } from "react";
import type { CurriculumBook } from "@/lib/faith-types";

export function CurriculumMenu({
  book,
  basePath,
}: {
  book: CurriculumBook;
  basePath: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="faith-curriculum-menu">
      {book.sections.map((section) => {
        const open = openId === section.id;
        return (
          <div
            key={section.id}
            className={`faith-topic-row${open ? " is-open" : ""}`}
          >
            <button
              type="button"
              className="faith-topic-toggle"
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : section.id)}
            >
              <span className="faith-topic-toggle-label">{section.title}</span>
              <span className="faith-topic-chevron" aria-hidden>
                {open ? "▴" : "▾"}
              </span>
            </button>

            {open ? (
              <ul className="faith-topic-groups">
                {section.groups.map((group) => (
                  <li key={group.id}>
                    <a href={`${basePath}/${section.id}/${group.id}`}>
                      <span>{group.title}</span>
                      <span className="faith-topic-group-arrow" aria-hidden>
                        →
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
