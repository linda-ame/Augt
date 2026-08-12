import { resolveActiveChild } from "@/lib/active-child";
import {
  kidShellToneClass,
  visualToneFromAge,
  visualToneFromAgeBand,
  type VisualTone,
} from "@/lib/visual-tone";

export async function KidShell({ children }: { children: React.ReactNode }) {
  const active = await resolveActiveChild();
  const tone: VisualTone = active
    ? active.ageBandId
      ? visualToneFromAgeBand(active.ageBandId)
      : visualToneFromAge(active.age)
    : "calm";

  return (
    <div className={`kid-shell min-h-screen pb-24 ${kidShellToneClass(tone)}`}>
      {children}
    </div>
  );
}
