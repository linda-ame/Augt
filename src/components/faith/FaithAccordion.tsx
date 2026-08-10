"use client";

import { useState } from "react";
import { answerLines } from "@/lib/faith-types";

export function FaithAccordion({
  items,
}: {
  items: { key: string; question: string; answer: string | string[] }[];
}) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="faith-accordion">
      {items.map((item) => {
        const isOpen = open === item.key;
        return (
          <div
            key={item.key}
            className={`faith-accordion-item${isOpen ? " is-open" : ""}`}
          >
            <button
              type="button"
              className="faith-accordion-q"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : item.key)}
            >
              <span className="faith-accordion-q-text">{item.question}</span>
              <span className="faith-accordion-chevron" aria-hidden>
                {isOpen ? "▴" : "▾"}
              </span>
            </button>
            {isOpen ? (
              <div className="faith-accordion-a">
                {answerLines(item.answer).map((line) => (
                  <p key={line.slice(0, 48)}>{line}</p>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
