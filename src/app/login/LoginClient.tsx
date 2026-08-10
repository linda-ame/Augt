"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/BrandLogo";

type Mode = "parent" | "kid" | "parent-register";

export default function LoginPage({
  initiallyUnlocked,
}: {
  initiallyUnlocked: boolean;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const initial = (params.get("mode") as Mode) || "parent";
  const [unlocked, setUnlocked] = useState(initiallyUnlocked);
  const [accessCode, setAccessCode] = useState("");
  const [mode, setMode] = useState<Mode>(
    initial === "kid" ? "kid" : initial === "parent-register" ? "parent-register" : "parent",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [familyCode, setFamilyCode] = useState("");
  const [children, setChildren] = useState<{ id: string; display_name: string }[]>(
    [],
  );
  const [selectedChild, setSelectedChild] = useState("");
  const [personalCode, setPersonalCode] = useState("");
  const [error, setError] = useState<string | null>(
    params.get("error") ? decodeURIComponent(params.get("error")!) : null,
  );
  const [loading, setLoading] = useState(false);
  const [kidStep, setKidStep] = useState<"code" | "name" | "pin">("code");

  const title = useMemo(() => {
    if (!unlocked) return "Pieslēgties";
    if (mode === "kid") return "Bērna ieeja";
    if (mode === "parent-register") return "Izveidot ģimeni";
    return "Vecāku ieeja";
  }, [mode, unlocked]);

  async function unlockAccess(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/access/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: accessCode }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Nepareizs kods.");
      setUnlocked(true);
      setAccessCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kļūda");
    } finally {
      setLoading(false);
    }
  }

  async function parentAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    try {
      if (mode === "parent-register") {
        const origin = window.location.origin;
        const { data, error: signErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${origin}/auth/callback?next=/parent`,
            data: { family_name: familyName || "Mana ģimene" },
          },
        });
        if (signErr) throw signErr;
        if (!data.user) throw new Error("Neizdevās izveidot kontu.");

        if (!data.session) {
          setError(
            "Konts izveidots. Pārbaudi e-pastu un nospied apstiprinājuma saiti (vai izslēdz e-pasta apstiprinājumu Supabase iestatījumos).",
          );
          return;
        }

        const res = await fetch("/api/family/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: familyName || "Mana ģimene" }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Ģimenes izveide neizdevās.");
        router.push("/parent");
        router.refresh();
        return;
      }
      const { error: loginErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (loginErr) throw loginErr;

      await fetch("/api/family/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: familyName || "Mana ģimene" }),
      });

      router.push("/parent");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kļūda");
    } finally {
      setLoading(false);
    }
  }

  async function findFamily(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/kid/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyCode }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Ģimene nav atrasta.");
      setChildren(json.children);
      setKidStep("name");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kļūda");
    } finally {
      setLoading(false);
    }
  }

  async function kidLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/kid/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyCode,
          childId: selectedChild,
          personalCode,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Ieeja neizdevās.");
      router.push("/kid");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kļūda");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col px-6 py-10">
      <BrandLogo href="/" size="sm" />
      <div className="panel section-enter mt-10 p-6 sm:p-8">
        <h1 className="brand-mark text-3xl text-[var(--bg-deep)]">{title}</h1>

        {!unlocked ? (
          <>
            <p className="mt-3 text-[var(--ink-soft)] leading-relaxed">
              Personalizētais ģimenes konts pagaidām nav publiski pieejams.
              Plānojam to atvērt pakāpeniski — ar pielāgotu saturu bērniem un
              vecākiem.
            </p>
            <p className="mt-3 text-[var(--ink-soft)] leading-relaxed">
              Ja tev ir piekļuves kods, ievadi to zemāk, lai atvērtu
              pieslēgšanos un reģistrāciju.
            </p>
            <form onSubmit={unlockAccess} className="mt-6 space-y-4">
              <input
                className="field"
                type="password"
                required
                autoComplete="off"
                placeholder="Piekļuves kods"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
              />
              <button className="btn btn-primary w-full" disabled={loading}>
                {loading ? "Gaida…" : "Turpināt"}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="mt-2 text-[var(--ink-soft)]">
              Dieva Vārds. Ticība. Dzīve. Katru dienu.
            </p>

            <div className="mt-6 flex gap-2 text-sm">
              <button
                type="button"
                className={`btn ${mode.startsWith("parent") ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setMode("parent")}
              >
                Vecāks
              </button>
              <button
                type="button"
                className={`btn ${mode === "kid" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => {
                  setMode("kid");
                  setKidStep("code");
                }}
              >
                Bērns
              </button>
            </div>

            {mode !== "kid" ? (
              <form onSubmit={parentAuth} className="mt-6 space-y-4">
                {mode === "parent-register" && (
                  <input
                    className="field"
                    placeholder="Ģimenes nosaukums"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                  />
                )}
                <input
                  className="field"
                  type="email"
                  required
                  placeholder="E-pasts"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  className="field"
                  type="password"
                  required
                  minLength={6}
                  placeholder="Parole"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button className="btn btn-primary w-full" disabled={loading}>
                  {loading
                    ? "Gaida…"
                    : mode === "parent-register"
                      ? "Izveidot kontu"
                      : "Ienākt"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary w-full"
                  onClick={() =>
                    setMode(mode === "parent" ? "parent-register" : "parent")
                  }
                >
                  {mode === "parent"
                    ? "Vēl nav konta? Reģistrēties"
                    : "Jau ir konts? Ienākt"}
                </button>
              </form>
            ) : (
              <div className="mt-6 space-y-4">
                {kidStep === "code" && (
                  <form onSubmit={findFamily} className="space-y-4">
                    <input
                      className="field"
                      required
                      placeholder="Ģimenes kods"
                      value={familyCode}
                      onChange={(e) =>
                        setFamilyCode(e.target.value.toUpperCase())
                      }
                    />
                    <button className="btn btn-primary w-full" disabled={loading}>
                      Atrast ģimeni
                    </button>
                  </form>
                )}
                {kidStep === "name" && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!selectedChild) {
                        setError("Izvēlies savu vārdu.");
                        return;
                      }
                      setKidStep("pin");
                    }}
                    className="space-y-4"
                  >
                    <p className="text-sm text-[var(--ink-soft)]">Kurš tu esi?</p>
                    <div className="grid gap-2">
                      {children.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className={`btn ${selectedChild === c.id ? "btn-primary" : "btn-secondary"}`}
                          onClick={() => setSelectedChild(c.id)}
                        >
                          {c.display_name}
                        </button>
                      ))}
                    </div>
                    <button className="btn btn-accent w-full">Tālāk</button>
                  </form>
                )}
                {kidStep === "pin" && (
                  <form onSubmit={kidLogin} className="space-y-4">
                    <input
                      className="field"
                      required
                      placeholder="Tavs personīgais kods"
                      value={personalCode}
                      onChange={(e) => setPersonalCode(e.target.value)}
                    />
                    <button className="btn btn-primary w-full" disabled={loading}>
                      Ienākt
                    </button>
                  </form>
                )}
              </div>
            )}
          </>
        )}

        {error && (
          <p className="mt-4 text-sm text-[var(--danger)]" role="alert">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
