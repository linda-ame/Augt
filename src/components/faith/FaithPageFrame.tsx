import { FaithSubNav } from "@/components/faith/FaithSubNav";
import "@/components/faith/faith.css";

export function FaithPageFrame({
  pageTitle,
  backHref,
  backLabel,
  children,
}: {
  /** Optional in-page heading (section name is in the sticky top bar). */
  pageTitle?: string;
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="faith-app mx-auto max-w-2xl px-6 py-8">
      <FaithSubNav />

      {backHref ? (
        <a className="faith-back-btn" href={backHref}>
          {backLabel ?? "← Atpakaļ"}
        </a>
      ) : null}

      {pageTitle ? <h1 className="faith-page-title">{pageTitle}</h1> : null}

      {children}
    </main>
  );
}
