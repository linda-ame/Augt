import { KidBottomNav } from "@/components/KidBottomNav";
import { KidTopBar } from "@/components/KidTopBar";

export default function KidLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="kid-shell min-h-screen pb-24">
      <KidTopBar />
      {children}
      <KidBottomNav />
    </div>
  );
}
