import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BellRing, Check } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Mes notifications de corrections — Carnets" },
      {
        name: "description",
        content:
          "Suivez vos propositions de correction : en attente de confirmation, validées ou refusées par la communauté et les modérateurs.",
      },
      { property: "og:title", content: "Mes notifications de corrections — Carnets" },
      {
        property: "og:description",
        content: "Alertes sur l'état de vos corrections proposées : en attente, validée, refusée.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotificationsPage,
});

type Notification = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

function NotificationsPage() {
  const { t } = useI18n();
  const { user, loading } = useSession();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications"],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("notifications")
        .select("id, kind, title, body, link, read_at, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (rows ?? []) as Notification[];
    },
  });

  const markAll = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .is("read_at", null);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("notif.allRead"));
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => toast.error(t("common.error")),
  });

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
          <p className="text-sm text-muted-foreground">{t("notif.signInHint")}</p>
          <Link to="/auth" className="mt-4 inline-block text-sm font-semibold text-primary">
            {t("auth.signIn")}
          </Link>
        </div>
      </div>
    );
  }

  const items = data ?? [];

  return (
    <AppShell kicker={t("notif.kicker")} title={t("notif.title")}>
      <section className="space-y-3 px-6">
        {items.some((n) => !n.read_at) ? (
          <button
            type="button"
            onClick={() => markAll.mutate()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-xs font-semibold"
          >
            <Check className="size-4" />
            {t("notif.markAllRead")}
          </button>
        ) : null}

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("notif.empty")}</p>
        ) : (
          items.map((n) => (
            <article
              key={n.id}
              className={`rounded-2xl border p-4 shadow-card ${
                n.read_at ? "border-border bg-card" : "border-primary/40 bg-secondary/40"
              }`}
            >
              <div className="flex items-start gap-3">
                <BellRing
                  className={`mt-0.5 size-4 shrink-0 ${
                    n.read_at ? "text-muted-foreground" : "text-primary"
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{t(`notif.kind.${n.kind}`)}</p>
                  {n.body ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t(`fix.field.${n.body}`)}
                    </p>
                  ) : null}
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                  {n.link ? (
                    <Link
                      to="/corrections"
                      className="mt-2 inline-block text-xs font-semibold text-primary"
                    >
                      {t("notif.open")}
                    </Link>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </AppShell>
  );
}
