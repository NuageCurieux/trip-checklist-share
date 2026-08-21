import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { LanguageSwitcher } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useSession } from "@/hooks/useSession";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion voyageur — Carnets" },
      {
        name: "description",
        content:
          "Connectez-vous pour créer vos carnets de voyage, cocher vos lieux et partager vos itinéraires.",
      },
      { property: "og:title", content: "Connexion voyageur — Carnets" },
      {
        property: "og:description",
        content: "Créez votre compte voyageur pour composer et partager vos carnets de voyage.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { mode?: "signup" } =>
    search['mode'] === "signup" ? { mode: "signup" } : {},
  component: AuthPage,
});

function AuthPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user } = useSession();
  const { mode: initialMode } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">(
    initialMode === "signup" ? "signup" : "signin",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // Already signed in: don't bounce silently, explain it so "create my space"
  // doesn't look broken for someone who already has an account.


  async function submit() {
    setBusy(true);
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success(t("auth.resetSent"));
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success(t("auth.checkEmail"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(t("common.error"));
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/profil" });
  }

  if (user) {
    return (
      <div className="min-h-screen bg-background px-6 pt-8 pb-12 text-foreground">
        <div className="flex items-start justify-between">
          <p className="kicker">{t("landing.kicker")}</p>
          <LanguageSwitcher />
        </div>
        <h1 className="mt-2 font-serif text-3xl italic">{t("auth.alreadyTitle")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("auth.alreadyLead")} {user.email}
        </p>
        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={() => void navigate({ to: "/profil" })}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
          >
            {t("auth.goToProfile")}
          </button>
          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
              setMode("signup");
            }}
            className="w-full rounded-xl border border-border py-3 text-sm font-semibold"
          >
            {t("auth.signOut")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 pt-8 pb-12 text-foreground">
      <div className="flex items-start justify-between">
        <p className="kicker">{t("landing.kicker")}</p>
        <LanguageSwitcher />
      </div>

      <h1 className="mt-2 font-serif text-3xl italic">
        {mode === "signin" ? t("auth.signIn") : mode === "signup" ? t("auth.signUp") : t("auth.resetTitle")}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {mode === "reset" ? t("auth.resetLead") : mode === "signup" ? t("auth.verifyLead") : ""}
      </p>

      <div className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-card">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="email">
          {t("auth.email")}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
        />

        {mode === "reset" ? null : (
        <>
        <label className="mt-4 block text-xs font-medium text-muted-foreground" htmlFor="password">
          {t("auth.password")}
        </label>
        <input
          id="password"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
        />
        </>
        )}

        <button
          type="button"
          disabled={busy || !email || (mode !== "reset" && !password)}
          onClick={() => void submit()}
          className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {mode === "signin"
            ? t("auth.signIn")
            : mode === "signup"
              ? t("auth.signUp")
              : t("auth.resetSend")}
        </button>

        {mode === "reset" ? null : (
        <button
          type="button"
          onClick={() => void google()}
          className="mt-2 w-full rounded-xl border border-border py-3 text-sm font-semibold"
        >
          {t("auth.google")}
        </button>
        )}

        <button
          type="button"
          onClick={() => setMode(mode === "signup" ? "signin" : mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-xs font-semibold text-primary"
        >
          {mode === "signin" ? t("auth.toSignUp") : mode === "signup" ? t("auth.toSignIn") : t("auth.backSignIn")}
        </button>

        {mode === "signin" ? (
          <button
            type="button"
            onClick={() => setMode("reset")}
            className="mt-2 w-full text-xs font-medium text-muted-foreground underline"
          >
            {t("auth.forgot")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
