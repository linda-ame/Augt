"use client";

import { useMemo, useState } from "react";
import { shuffle } from "@/components/faith/shuffle";

const COMMANDMENTS = [
  "Tev nebūs citus dievus turēt līdzās manim.",
  "Tev nebūs Kunga, sava Dieva, vārdu nelietīgi valkāt.",
  "Tev būs svēto dienu svētīt.",
  "Tev būs godāt savu tēvu un māti.",
  "Tev nebūs nokaut.",
  "Tev nebūs laulību pārkāpt.",
  "Tev nebūs zagt.",
  "Tev nebūs nepatiesu liecību dot pret savu tuvāko.",
  "Tev nebūs iekārot sava sievu.",
  "Tev nebūs iekārot nevienu lietu, kas pieder tavam tuvākam.",
];

type SlotState = {
  value: string;
  status: "" | "filled" | "correct" | "wrong";
};

function emptySlots(): SlotState[] {
  return COMMANDMENTS.map(() => ({ value: "", status: "" }));
}

export function BausliSavienoGame() {
  const [seed, setSeed] = useState(0);
  const [slots, setSlots] = useState<SlotState[]>(emptySlots);
  const [pool, setPool] = useState(() => shuffle(COMMANDMENTS));
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    kind: "" | "success" | "error";
  }>({ text: "", kind: "" });

  const allFilled = useMemo(
    () => slots.every((s) => s.value !== ""),
    [slots],
  );

  function selectItem(text: string) {
    setSelected(text);
  }

  function placeInSlot(index: number) {
    if (!selected) return;
    const existing = slots[index].value;
    setSlots((prev) => {
      const next = [...prev];
      next[index] = { value: selected, status: "filled" };
      return next;
    });
    setPool((p) => {
      const withoutSelected = p.filter((t) => t !== selected);
      return existing ? [...withoutSelected, existing] : withoutSelected;
    });
    setSelected(null);
    setMessage({ text: "", kind: "" });
  }

  function clearSlot(index: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const value = slots[index].value;
    if (!value) return;
    setPool((p) => [...p, value]);
    setSlots((prev) => {
      const next = [...prev];
      next[index] = { value: "", status: "" };
      return next;
    });
    setMessage({ text: "", kind: "" });
  }

  function checkAnswers() {
    let correct = 0;
    const next = slots.map((slot, i) => {
      if (!slot.value) return slot;
      const ok = slot.value === COMMANDMENTS[i];
      if (ok) correct++;
      return {
        ...slot,
        status: (ok ? "correct" : "wrong") as SlotState["status"],
      };
    });
    setSlots(next);
    if (correct === 10) {
      setMessage({ text: "🎉 Tu visu paveici pareizi!", kind: "success" });
    } else {
      setMessage({
        text: "Ir kļūdas — izlabo un mēģini vēlreiz.",
        kind: "error",
      });
    }
  }

  function restart() {
    setSeed((s) => s + 1);
    setSlots(emptySlots());
    setPool(shuffle(COMMANDMENTS));
    setSelected(null);
    setMessage({ text: "", kind: "" });
  }

  return (
    <div className="flashcards" key={seed}>
      <div id="intro">
        <p>
          <strong>Savieno katru baušļa numuru ar pareizo tekstu.</strong>
        </p>
        <p className="flashcards__text">
          Klikšķini uz baušļa tekstu, tad uz numuru, kurā to ievietot.
        </p>
      </div>

      <div className={`match-layout${allFilled ? " single" : ""}`}>
        <div id="slots">
          {slots.map((slot, i) => (
            <div
              key={i}
              className={`slot${slot.value ? " filled" : ""}${
                slot.status ? ` ${slot.status}` : ""
              }`}
              onClick={() => placeInSlot(i)}
            >
              <span className="num">{i + 1}.</span>
              <span className="value">
                {slot.value || "— tukšs —"}
              </span>
              <button type="button" onClick={(e) => clearSlot(i, e)}>
                ×
              </button>
            </div>
          ))}
        </div>

        <div id="pool">
          {pool.map((text) => (
            <div
              key={text}
              className={`item${selected === text ? " selected" : ""}`}
              onClick={() => selectItem(text)}
            >
              {text}
            </div>
          ))}
        </div>
      </div>

      {message.text ? (
        <div className={`message ${message.kind}`}>{message.text}</div>
      ) : null}

      <button
        type="button"
        className="check-btn"
        disabled={!allFilled}
        onClick={checkAnswers}
      >
        Pārbaudīt
      </button>

      <button type="button" className="restart-btn" onClick={restart}>
        Spēlēt vēlreiz
      </button>
    </div>
  );
}
