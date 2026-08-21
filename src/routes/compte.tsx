import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { AppShell, LanguageSwitcher } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/compte")({
  head: () => ({
    meta: [
      { title: "Mon compte voyageur — Carnets" },
      {
        name: "description",
        content:
          "Gérez votre compte voyageur, la langue de l'interface et votre session sur Carnets.",
      },
      { property: "og:title", content: "Mon compte voyageur — Carnets" },
      {
        property: "og:description",
        content: "Réglages du compte voyageur : langue de l'interface et déconnexion.",
      },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { t } = useI18n();
  const { user, loading } = useSession();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center px-8 text-center">
        <div>
          <p className="text-sm text-muted-foreground">{t("landing.travelerHint")}</p>
          <Link to="/auth" className="mt-4 inline-block text-sm font-semibold text-primary">
            {t("auth.signIn")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AppShell kicker={t("account.kicker")} title={t("account.title")}>
      <section className="space-y-4 px-6">
        <PublicPageEditor userId={user.id} />
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">

          <p className="text-xs font-medium text-muted-foreground">{t("account.email")}</p>
          <p className="mt-1 text-sm">{user.email}</p>

          <p className="mt-5 text-xs font-medium text-muted-foreground">{t("account.language")}</p>
          <div className="mt-2">
            <LanguageSwitcher />
          </div>

          <Link
            to="/acces"
            className="mt-6 block rounded-xl border border-border py-3 text-center text-sm font-semibold"
          >
            {t("access.title")}
          </Link>

          <Link
            to="/localisation"
            className="mt-3 block rounded-xl border border-border py-3 text-center text-sm font-semibold"
          >
            {t("loc.cta")}
          </Link>

          <Link
            to="/notifications"
            className="mt-3 block rounded-xl border border-border py-3 text-center text-sm font-semibold"
          >
            {t("notif.title")}
          </Link>


          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
              void navigate({ to: "/" });
            }}
            className="mt-6 w-full rounded-xl border border-border py-3 text-sm font-semibold"
          >
            {t("auth.signOut")}
          </button>
        </div>
      </section>
    </AppShell>
  );
}
