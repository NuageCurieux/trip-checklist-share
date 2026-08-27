import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

import { LanguageSwitcher } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { progress, signPaths, type Place, type Trip } from "@/lib/travel";
import { defaultCoverFor } from "@/lib/defaultCover";
import { BestTimeBadges, PlaceFameStars, PlacePrice } from "@/components/travel/PlaceDetails";

type PlaceSheet = { sheet_key: string | null; best_time: string[] | null; price_info: string | null };

export const Route = createFileRoute("/partage/$slug")({
  head: () => ({
    meta: [
      { title: "Carnet partagé — les lieux d'un voyage" },
      {
        name: "description",
        content:
          "Découvrez le carnet de voyage partagé par un proche : les lieux à visiter, ceux déjà cochés et les photos du séjour.",
      },
      { property: "og:title", content: "Carnet partagé — les lieux d'un voyage" },
      {
        property: "og:description",
        content: "Suivez l'itinéraire, les lieux cochés et les photos d'un carnet de voyage partagé.",
      },
    ],
  }),
  component: SharedTrip,
});

function SharedTrip() {
  const { slug } = Route.useParams();
  const { t } = useI18n();

  const { data, isLoading } = useQuery({
    queryKey: ["shared", slug],
    queryFn: async () => {
      const { data: trip, error } = await supabase
        .from("trips")
        .select("*")
        .eq("share_slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!trip) {
        const { data: gate } = await supabase.rpc("share_gate_info", { _slug: slug });
        const info = Array.isArray(gate) ? gate[0] : gate;
        return {
          trip: null as Trip | null,
          places: [] as Place[],
          files: {} as Record<string, string>,
          sheets: {} as Record<string, PlaceSheet>,
          gate: (info ?? null) as {
            owner_handle: string | null;
            owner_name: string | null;
            title: string | null;
          } | null,
        };
      }

      const { data: places } = await supabase
        .from("places")
        .select("*")
        .eq("trip_id", trip.id)
        .order("position");
      const list = (places ?? []) as Place[];
      // Catalogue extras (illustrated sheet + best daypart) for library places.
      const catalogIds = [
        ...new Set(list.map((p) => p.catalog_place_id).filter(Boolean)),
      ] as string[];
      const sheets: Record<string, PlaceSheet> = {};
      if (catalogIds.length > 0) {
        const { data: rows } = await supabase
          .from("catalog_places")
          .select("id, sheet_key, best_time, price_info")
          .in("id", catalogIds);
        for (const row of rows ?? []) {
          sheets[row.id] = { sheet_key: row.sheet_key, best_time: row.best_time, price_info: row.price_info };
        }
      }
      const files = await signPaths([
        (trip as Trip).cover_path,
        ...list.map((p) => p.photo_path),
      ]);
      return { trip: trip as Trip, places: list, files, sheets, gate: null };
    },
  });

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  const trip = data?.trip;
  if (!trip) {
    const gate = data?.gate;
    return (
      <div className="grid min-h-screen place-items-center px-8 text-center">
        <div className="max-w-sm">
          {gate ? (
            <>
              <p className="kicker">{t("access.kicker")}</p>
              <h1 className="mt-1 font-serif text-2xl italic">{t("access.lockedTitle")}</h1>
              <p className="mt-3 text-sm text-muted-foreground">{t("access.lockedLead")}</p>
              {gate.owner_handle ? (
                <Link
                  to="/voyageur/$handle"
                  params={{ handle: gate.owner_handle }}
                  className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  {t("access.request")}
                </Link>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t("public.notFound")}</p>
          )}
          <Link to="/" className="mt-4 block text-sm font-semibold text-primary">
            {t("public.backHome")}
          </Link>
        </div>
      </div>
    );
  }


  const places = data.places;
  const cover = trip.cover_path ? data.files[trip.cover_path] : (trip.cover_url ?? defaultCoverFor(trip.destination));

  return (
    <div className="min-h-screen bg-background pb-12 text-foreground">
      <header className="flex items-start justify-between px-6 pt-8">
        <div>
          <p className="kicker">{t("public.kicker")}</p>
          <h1 className="mt-1 font-serif text-3xl italic">{trip.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {trip.destination ?? "—"} · {progress(places)}% {t("home.visited")}
          </p>
        </div>
        <LanguageSwitcher />
      </header>

      {cover ? (
        <div className="mt-6 px-6">
          <img
            src={cover}
            alt={trip.title}
            loading="lazy"
            className="aspect-4/5 w-full rounded-2xl object-cover outline outline-offset-[-1px] outline-foreground/5"
          />
        </div>
      ) : null}

      <section className="mt-8 px-6">
        <h2 className="mb-4 text-sm font-semibold tracking-widest uppercase">
          {t("trip.checklist")}
        </h2>
        {places.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("trip.emptyPlaces")}</p>
        ) : (
          <ul className="space-y-3">
            {places.map((place) => (
              <li
                key={place.id}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-card"
              >
                <span
                  className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 ${
                    place.visited
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-transparent"
                  }`}
                >
                  <Check className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className={`text-sm font-medium ${place.visited ? "opacity-70" : ""}`}>
                    {place.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {[place.category, place.area].filter(Boolean).join(" · ") || "—"}
                  </p>
                  {place.note ? (
                    <p className="mt-1 font-serif text-sm italic text-muted-foreground">
                      {place.note}
                    </p>
                  ) : null}
                  {place.photo_path && data.files[place.photo_path] ? (
                    <img
                      src={data.files[place.photo_path]}
                      alt={place.name}
                      loading="lazy"
                      className="mt-3 aspect-3/2 w-full rounded-lg object-cover"
                    />
                  ) : null}
                  {(() => {
                    const sheet = place.catalog_place_id
                      ? data.sheets[place.catalog_place_id]
                      : undefined;
                    if (!sheet) return null;
                    return (
                      <div className="mt-3 space-y-3">
                        <BestTimeBadges value={sheet.best_time} />
                        <PlaceFameStars sheetKey={sheet.sheet_key} name={place.name} />
                        <PlacePrice value={sheet.price_info} />
                      </div>
                    );
                  })()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="mt-10 px-6 text-center">
        <p className="text-xs text-muted-foreground">{t("public.byTraveler")}</p>
        <Link to="/" className="mt-2 inline-block text-sm font-semibold text-primary">
          {t("public.backHome")}
        </Link>
      </footer>
    </div>
  );
}
