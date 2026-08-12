import { KidBottomNav } from "@/components/KidBottomNav";
import { KidShell } from "@/components/KidShell";
import { KidTopBar } from "@/components/KidTopBar";

export default function KidLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <KidShell>
      <KidTopBar />
      {children}
      <KidBottomNav />
    </KidShell>
  );
}
