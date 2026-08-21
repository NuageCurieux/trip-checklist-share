import { useState } from "react";
import { createFileRoute, useRouter, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Lock } from "lucide-react";

import { unlockSite, checkGate } from "@/lib/gate.functions";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/unlock")({
  head: () => ({
    meta: [
      { title: "Accès privé — Carnets" },
      {
        name: "description",
        content: "Cette application est réservée aux personnes invitées. Saisissez le mot de passe pour entrer.",
      },
      { property: "og:title", content: "Accès privé — Carnets" },
      {
        property: "og:description",
        content: "Cette application est réservée aux personnes invitées. Saisissez le mot de passe pour entrer.",
      },
    ],
  }),
  beforeLoad: async () => {
    try {
      await checkGate({ data: {} });
      throw redirect({ to: "/" });
    } catch {
      // Not unlocked yet: render the unlock page.
    }
  },
  component: UnlockPage,
});

function UnlockPage() {
  const { t } = useI18n();
  const router = useRouter();
  const unlock = useServerFn(unlockSite);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const { ok } = await unlock({ data: { password: password.trim() } });
    if (ok) {
      await router.navigate({ to: "/" });
    } else {
      setError(true);
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-secondary/20 text-secondary">
            <Lock className="size-6" />
          </div>
          <h1 className="mt-5 font-serif text-2xl italic">{t("gate.title")}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t("gate.lead")}
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("gate.placeholder")}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {error ? (
            <p className="text-center text-sm text-destructive">{t("gate.error")}</p>
          ) : null}
          <button
            type="submit"
            disabled={!password.trim() || loading}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? t("common.loading") : t("gate.cta")}
          </button>
        </form>
      </div>
    </div>
  );
}
