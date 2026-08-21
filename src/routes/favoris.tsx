import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { PlacesMap } from "@/components/travel/PlacesMap";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useI18n } from "@/lib/i18n";
import type { CatalogPlace } from "@/lib/travel";

export const Route = createFileRoute("/favoris")({
  head: () => ({
    meta: [
      { title: "Mes coups de cœur — Carnets" },
      {
        name: "description",
        content:
          "Retrouvez tous vos lieux favoris sur une carte, ville par ville, et ajoutez-les à vos carnets de voyage.",
      },
      { property: "og:title", content: "Mes coups de cœur — Carnets" },
      {
        property: "og:description",
        content: "Vos lieux favoris rassemblés sur une carte, prêts à rejoindre un carnet.",
      },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { t } = useI18n();
  const { user, loading } = useSession();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["favorites-full"],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("favorites")
        .select("id, catalog_place_id, catalog_places(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (rows ?? []) as unknown as Array<{
        id: string;
        catalog_place_id: string;
        catalog_places: CatalogPlace | null;
      }>;
    },
  });

  const remove = useMutation({
    mutationFn: async (favoriteId: string) => {
      const { error } = await supabase.from("favorites").delete().eq("id", favoriteId);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["favorites-full"] });
      void queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
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
          <p className="text-sm text-muted-foreground">{t("landing.travelerHint")}</p>
          <Link to="/auth" className="mt-4 inline-block text-sm font-semibold text-primary">
            {t("auth.signIn")}
          </Link>
        </div>
      </div>
    );
  }

  const rows = (data ?? []).filter((row) => row.catalog_places);
  const points = rows.map((row) => ({
    id: row.id,
    name: row.catalog_places!.name,
    lat: row.catalog_places!.lat,
    lng: row.catalog_places!.lng,
    favorite: true,
  }));
  const country = rows[0]?.catalog_places?.country ?? null;

  return (
    <AppShell kicker={t("fav.kicker")} title={t("fav.title")}>
      <section className="px-6">
        <PlacesMap points={points} country={country} />
      </section>

      <section className="mt-8 px-6">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("fav.empty")}</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((row) => {
              const place = row.catalog_places!;
              return (
                <li
                  key={row.id}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-card"
                >
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-medium">{place.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {[place.city, place.category, place.area].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={t("fav.remove")}
                    onClick={() => remove.mutate(row.id)}
                    className="grid size-8 shrink-0 place-items-center rounded-full border border-border"
                  >
                    <Heart className="size-4 fill-primary text-primary" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
