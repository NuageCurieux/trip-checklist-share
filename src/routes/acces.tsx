import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/acces")({
  head: () => ({
    meta: [
      { title: "Demandes d'accès à mes carnets — Carnets" },
      {
        name: "description",
        content:
          "Acceptez ou refusez les personnes qui demandent l'accès à vos carnets de voyage partagés.",
      },
      { property: "og:title", content: "Demandes d'accès à mes carnets — Carnets" },
      {
        property: "og:description",
        content: "Validez une par une les personnes autorisées à consulter vos carnets de voyage.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccessPage,
});

type RequestRow = {
  id: string;
  viewer_name: string | null;
  instagram: string | null;
  message: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

function AccessPage() {
  const { t } = useI18n();
  const { user, loading } = useSession();
  const queryClient = useQueryClient();

  const { data: requests } = useQuery({
    queryKey: ["access-requests", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("access_requests")
        .select("id, viewer_name, instagram, message, status, created_at")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as RequestRow[];
    },
  });

  const decide = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const { error } = await supabase.from("access_requests").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("common.saved"));
      queryClient.invalidateQueries({ queryKey: ["access-requests", user?.id] });
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
      <AppShell kicker={t("access.kicker")} title={t("access.title")} showNav={false}>
        <div className="px-6">
          <p className="text-sm text-muted-foreground">{t("access.signInHint")}</p>
          <Link
            to="/auth"
            className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            {t("auth.signIn")}
          </Link>
        </div>
      </AppShell>
    );
  }

  const groups: { key: "pending" | "approved" | "rejected"; label: string }[] = [
    { key: "pending", label: t("access.pendingSection") },
    { key: "approved", label: t("access.approvedSection") },
    { key: "rejected", label: t("access.rejectedSection") },
  ];

  return (
    <AppShell kicker={t("access.kicker")} title={t("access.title")}>
      <div className="space-y-8 px-6">
        <p className="text-sm text-muted-foreground">{t("access.lead")}</p>

        {(requests ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("access.empty")}</p>
        ) : (
          groups.map((group) => {
            const rows = (requests ?? []).filter((r) => r.status === group.key);
            if (rows.length === 0) return null;
            return (
              <section key={group.key}>
                <h2 className="mb-3 text-sm font-semibold tracking-widest uppercase">
                  {group.label}
                </h2>
                <ul className="space-y-3">
                  {rows.map((row) => (
                    <li
                      key={row.id}
                      className="rounded-2xl border border-border bg-card p-4 shadow-card"
                    >
                      <p className="text-sm font-medium">
                        {row.instagram ? `@${row.instagram}` : (row.viewer_name ?? "—")}
                      </p>
                      {row.viewer_name && row.instagram ? (
                        <p className="text-xs text-muted-foreground">{row.viewer_name}</p>
                      ) : null}
                      {row.message ? (
                        <p className="mt-2 font-serif text-sm italic text-muted-foreground">
                          {row.message}
                        </p>
                      ) : null}
                      <div className="mt-3 flex gap-2">
                        {row.status !== "approved" ? (
                          <button
                            type="button"
                            onClick={() => decide.mutate({ id: row.id, status: "approved" })}
                            className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground"
                          >
                            {t("access.approve")}
                          </button>
                        ) : null}
                        {row.status !== "rejected" ? (
                          <button
                            type="button"
                            onClick={() => decide.mutate({ id: row.id, status: "rejected" })}
                            className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold"
                          >
                            {row.status === "approved" ? t("access.revoke") : t("access.reject")}
                          </button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })
        )}
      </div>
    </AppShell>
  );
}
