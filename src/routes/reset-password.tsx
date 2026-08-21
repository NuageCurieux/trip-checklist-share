import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — Carnets" },
      {
        name: "description",
        content: "Choisissez un nouveau mot de passe pour accéder à vos carnets de voyage.",
      },
      { property: "og:title", content: "Nouveau mot de passe — Carnets" },
      {
        property: "og:description",
        content: "Choisissez un nouveau mot de passe pour accéder à vos carnets de voyage.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // The recovery link delivers a session (hash tokens) that Supabase picks up on load.
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
        setInvalid(false);
      }
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) setReady(true);
      else setInvalid(true);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function submit() {
    if (password !== confirm) {
      toast.error(t("auth.mismatch"));
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success(t("auth.updated"));
      void navigate({ to: "/profil" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-secondary/20 text-secondary">
            <KeyRound className="size-6" />
          </div>
          <h1 className="mt-5 font-serif text-2xl italic">{t("auth.resetTitle")}</h1>
        </div>

        {invalid && !ready ? (
          <div className="mt-8 rounded-2xl border border-border bg-card p-5 text-center shadow-card">
            <p className="text-sm text-muted-foreground">{t("auth.resetInvalid")}</p>
            <Link to="/auth" className="mt-4 block text-xs font-semibold text-primary">
              {t("auth.backSignIn")}
            </Link>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-card">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="new-password">
              {t("auth.newPassword")}
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
            />

            <label
              className="mt-4 block text-xs font-medium text-muted-foreground"
              htmlFor="confirm-password"
            >
              {t("auth.confirmPassword")}
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
            />

            <button
              type="button"
              disabled={busy || !ready || password.length < 6 || !confirm}
              onClick={() => void submit()}
              className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {busy ? t("common.loading") : t("auth.resetTitle")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
