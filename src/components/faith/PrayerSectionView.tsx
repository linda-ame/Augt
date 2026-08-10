"use client";

import { useState } from "react";
import type { PrayerBlock, PrayerQaItem } from "@/lib/faith-types";
import { answerLines } from "@/lib/faith-types";

function QaList({ items }: { items: PrayerQaItem[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="faith-accordion">
      {items.map((item) => {
        const isOpen = open === item.id;
        return (
          <div key={item.id} className="faith-accordion-item">
            <button
              type="button"
              className="faith-accordion-q"
              onClick={() => setOpen(isOpen ? null : item.id)}
            >
              {item.question}
            </button>
            {isOpen ? (
              <div className="faith-accordion-a">
                {answerLines(item.answer).map((line) => (
                  <p key={line.slice(0, 40)}>{line}</p>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function PrayerBlocks({ blocks }: { blocks: PrayerBlock[] }) {
  const [open, setOpen] = useState<string | null>(blocks[0]?.id ?? null);
  return (
    <div className="faith-prayer-blocks">
      {blocks.map((block) => {
        const isOpen = open === block.id;
        return (
          <div key={block.id} className="faith-section-block">
            <button
              type="button"
              className="faith-section-title"
              onClick={() => setOpen(isOpen ? null : block.id)}
            >
              {block.title}
              {block.subtitle ? (
                <span className="faith-prayer-sub"> — {block.subtitle}</span>
              ) : null}
            </button>
            {isOpen ? (
              <div className="faith-prayer-body">
                {block.lines?.map((line) => (
                  <p key={line.slice(0, 40)}>{line}</p>
                ))}
                {block.content ? <p>{block.content}</p> : null}
                {block.qa ? <QaList items={block.qa} /> : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function PrayerSectionView({
  mode,
  items,
  blocks,
}: {
  mode: "qa" | "blocks";
  items?: PrayerQaItem[];
  blocks?: PrayerBlock[];
}) {
  if (mode === "qa" && items) return <QaList items={items} />;
  if (blocks) return <PrayerBlocks blocks={blocks} />;
  return <p>Saturs nav atrasts.</p>;
}
