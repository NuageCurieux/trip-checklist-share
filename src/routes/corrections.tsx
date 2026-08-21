import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useI18n } from "@/lib/i18n";
import type { CatalogPlace } from "@/lib/travel";

export const Route = createFileRoute("/corrections")({
  head: () => ({
    meta: [
      { title: "Corrections proposées — Carnets" },
      {
        name: "description",
        content:
          "Confirmez ou contestez les corrections proposées par les voyageurs sur les lieux du catalogue. Une correction n'est appliquée qu'après vérification.",
      },
      { property: "og:title", content: "Corrections proposées — Carnets" },
      {
        property: "og:description",
        content: "La vérification communautaire des descriptions de lieux, avant publication.",
      },
    ],
  }),
  component: CorrectionsPage,
});

type Suggestion = {
  id: string;
  field: string;
  proposed_value: string;
  reason: string | null;
  status: string;
  created_by: string;
  created_at: string;
  catalog_places: CatalogPlace | null;
};

function CorrectionsPage() {
  const { t } = useI18n();
  const { user, loading } = useSession();
  const queryClient = useQueryClient();

  const { data: suggestions } = useQuery({
    queryKey: ["suggestions"],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("place_suggestions")
        .select("id, field, proposed_value, reason, status, created_by, created_at, catalog_places(*)")
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as unknown as Suggestion[];
    },
  });

  const { data: votes } = useQuery({
    queryKey: ["suggestion-votes"],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suggestion_votes")
        .select("suggestion_id, user_id, agree");
      if (error) throw error;
      return data ?? [];
    },
  });

  const vote = useMutation({
    mutationFn: async ({ id, agree }: { id: string; agree: boolean }) => {
      const { error } = await supabase
        .from("suggestion_votes")
        .insert({ suggestion_id: id, agree });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("fix.voted"));
      void queryClient.invalidateQueries({ queryKey: ["suggestion-votes"] });
      void queryClient.invalidateQueries({ queryKey: ["suggestions"] });
    },
    onError: () => toast.error(t("fix.voteError")),
  });

  const review = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      const { error } = await supabase.rpc("review_place_suggestion", {
        _suggestion_id: id,
        _approve: approve,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("fix.reviewed"));
      void queryClient.invalidateQueries({ queryKey: ["suggestions"] });
    },
    onError: () => toast.error(t("fix.notModerator")),
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
          <p className="text-sm text-muted-foreground">{t("fix.signInHint")}</p>
          <Link to="/auth" className="mt-4 inline-block text-sm font-semibold text-primary">
            {t("auth.signIn")}
          </Link>
        </div>
      </div>
    );
  }

  const rows = suggestions ?? [];

  return (
    <AppShell kicker={t("fix.kicker")} title={t("fix.pageTitle")}>
      <section className="px-6">
        <p className="text-xs text-muted-foreground">{t("fix.moderationNote")}</p>
      </section>

      <section className="mt-6 px-6">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("fix.empty")}</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((suggestion) => {
              const mine = suggestion.created_by === user.id;
              const own = votes?.find(
                (v) => v.suggestion_id === suggestion.id && v.user_id === user.id,
              );
              const agrees = (votes ?? []).filter(
                (v) => v.suggestion_id === suggestion.id && v.agree,
              ).length;
              const disagrees = (votes ?? []).filter(
                (v) => v.suggestion_id === suggestion.id && !v.agree,
              ).length;

              return (
                <li
                  key={suggestion.id}
                  className="rounded-xl border border-border bg-card p-4 shadow-card"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="truncate text-sm font-medium">
                      {suggestion.catalog_places?.name ?? "—"}
                    </h2>
                    <span className="kicker shrink-0">{t(`fix.status.${suggestion.status}`)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t(`fix.field.${suggestion.field}`)}
                    {suggestion.catalog_places?.city ? ` · ${suggestion.catalog_places.city}` : ""}
                  </p>
                  <p className="mt-2 font-serif text-sm italic">{suggestion.proposed_value}</p>
                  {suggestion.reason ? (
                    <p className="mt-1 text-xs text-muted-foreground">{suggestion.reason}</p>
                  ) : null}

                  <p className="mt-3 text-[11px] text-muted-foreground">
                    {agrees} ✓ · {disagrees} ✕ — {t("fix.consensusHint")}
                  </p>

                  {suggestion.status === "pending" ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={mine || Boolean(own) || vote.isPending}
                        onClick={() => vote.mutate({ id: suggestion.id, agree: true })}
                        className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground disabled:opacity-40"
                      >
                        <Check className="size-3" /> {t("fix.confirm")}
                      </button>
                      <button
                        type="button"
                        disabled={mine || Boolean(own) || vote.isPending}
                        onClick={() => vote.mutate({ id: suggestion.id, agree: false })}
                        className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold disabled:opacity-40"
                      >
                        <X className="size-3" /> {t("fix.dispute")}
                      </button>
                      <button
                        type="button"
                        onClick={() => review.mutate({ id: suggestion.id, approve: true })}
                        className="rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold"
                      >
                        {t("fix.moderatorApprove")}
                      </button>
                      <button
                        type="button"
                        onClick={() => review.mutate({ id: suggestion.id, approve: false })}
                        className="rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold"
                      >
                        {t("fix.moderatorReject")}
                      </button>
                    </div>
                  ) : null}
                  {mine ? (
                    <p className="mt-2 text-[11px] text-muted-foreground">{t("fix.ownHint")}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
