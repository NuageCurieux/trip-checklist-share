import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { BestTimeBadges, PlaceFameStars, PlacePrice } from "@/components/travel/PlaceDetails";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import {
  embedMapUrl,
  externalMapUrl,
  providerForCountry,
  providerLabel,
} from "@/lib/mapProviders";
import { placeTitle, type CatalogPlace } from "@/lib/travel";

export const Route = createFileRoute("/lieux")({
  component: CatalogPage,
  head: () => ({
    meta: [
      { title: "Catalogue de lieux par pays et par ville — Carnets" },
      {
        name: "description",
        content:
          "Choisissez un pays, puis une ville, puis découvrez les activités : parcs de Séoul, Suncheon, Busan et bien d'autres, avec prix et aperçu de carte.",
      },
      { property: "og:title", content: "Catalogue de lieux par pays et par ville — Carnets" },
      {
        property: "og:description",
        content: "Pays, villes, activités : parcourez les lieux recensés avec description, prix et carte.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

/** Cities are shown in travel order rather than alphabetically. */
const CITY_ORDER = ["Séoul", "Autour de Séoul", "Suncheon", "Busan"];

function orderCities(a: string, b: string) {
  const ia = CITY_ORDER.indexOf(a);
  const ib = CITY_ORDER.indexOf(b);
  if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  return a.localeCompare(b);
}

function CatalogPage() {
  const { t } = useI18n();
  const [country, setCountry] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: places, isLoading } = useQuery({
    queryKey: ["catalog-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog_places")
        .select("*")
        .order("city")
        .order("name");
      if (error) throw error;
      return (data ?? []) as CatalogPlace[];
    },
  });

  const all = places ?? [];

  /** Level 1 — countries with their city and place counts. */
  const countries = (() => {
    const map = new Map<string, { cities: Set<string>; count: number }>();
    for (const place of all) {
      const key = place.country?.trim() || "—";
      const entry = map.get(key) ?? { cities: new Set<string>(), count: 0 };
      if (place.city) entry.cities.add(place.city);
      entry.count += 1;
      map.set(key, entry);
    }
    return [...map.entries()].sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]));
  })();

  /** Level 2 — cities of the selected country. */
  const cities = (() => {
    if (!country) return [];
    const map = new Map<string, number>();
    for (const place of all) {
      if ((place.country?.trim() || "—") !== country || !place.city) continue;
      map.set(place.city, (map.get(place.city) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => orderCities(a[0], b[0]));
  })();

  const cityPlaces = city ? all.filter((p) => p.city === city) : [];
  const provider = providerForCountry(cityPlaces[0]?.country ?? country);

  /** Level 3 — activities grouped by category. */
  const groups: Array<[string, CatalogPlace[]]> = (() => {
    const map = new Map<string, CatalogPlace[]>();
    for (const place of cityPlaces) {
      const key = place.category?.trim() || t("discover.catalog");
      const list = map.get(key) ?? [];
      list.push(place);
      map.set(key, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  })();

  const title = city ?? country ?? t("discover.catalog");

  return (
    <AppShell kicker={t("discover.catalog")} title={title}>
      <main className="px-6 pb-6">
        {(country || city) && (
          <button
            type="button"
            onClick={() => (city ? setCity(null) : setCountry(null))}
            className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-primary"
          >
            <ChevronLeft className="size-4" />
            {city ? country : t("discover.catalog")}
          </button>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : !country ? (
          <ul className="space-y-3">
            {countries.map(([name, info]) => (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => {
                    setCountry(name);
                    setCity(null);
                    setOpenId(null);
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-5 text-left shadow-card"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-serif text-xl">{name}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {info.cities.size} {info.cities.size > 1 ? "villes" : "ville"} ·{" "}
                      {info.count} lieux
                    </span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        ) : !city ? (
          <ul className="space-y-3">
            {cities.map(([name, count]) => (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => {
                    setCity(name);
                    setOpenId(null);
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-5 text-left shadow-card"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-serif text-lg">{name}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {count} lieux
                    </span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="space-y-5">
            {groups.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("discover.noResults")}</p>
            ) : (
              groups.map(([category, list]) => (
                <section key={category}>
                  <h2 className="font-serif text-sm italic text-foreground">
                    {category} · {list.length}
                  </h2>
                  <ul className="mt-2 divide-y divide-border/70 overflow-hidden rounded-xl border border-border/70 bg-muted/40">
                    {list.map((place) => {
                      const open = openId === place.id;
                      return (
                        <li key={place.id}>
                          <button
                            type="button"
                            aria-expanded={open}
                            onClick={() => setOpenId(open ? null : place.id)}
                            className="flex w-full items-center gap-3 px-3 py-3 text-left"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium">
                                {placeTitle(place).name}
                              </span>
                              {placeTitle(place).ko ? (
                                <span className="block text-xs text-muted-foreground">
                                  {placeTitle(place).ko}
                                </span>
                              ) : null}
                              {place.area ? (
                                <span className="block truncate text-xs text-muted-foreground">
                                  {place.area}
                                </span>
                              ) : null}
                            </span>
                            <ChevronDown
                              className={`size-4 shrink-0 text-muted-foreground transition-transform ${
                                open ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {open ? (
                            <div className="px-3 pb-3">
                              {place.description ? (
                                <p className="font-serif text-xs italic leading-relaxed text-muted-foreground">
                                  {place.description}
                                </p>
                              ) : null}

                              <div className="mt-3 space-y-3">
                                <BestTimeBadges value={place.best_time} />
                                <PlaceFameStars sheetKey={place.sheet_key} name={place.name} />
                                <PlacePrice value={place.price_info} />
                              </div>

                              {place.lat != null && place.lng != null ? (
                                <div className="mt-3 overflow-hidden rounded-xl border border-border">
                                  <iframe
                                    title={`${t("map.preview")} — ${place.name}`}
                                    src={embedMapUrl(place.lat, place.lng)}
                                    loading="lazy"
                                    className="h-40 w-full border-0"
                                  />
                                </div>
                              ) : (
                                <p className="mt-3 text-xs text-muted-foreground">
                                  {t("map.noCoords")}
                                </p>
                              )}

                              <a
                                href={externalMapUrl(provider, place)}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary underline"
                              >
                                {t("map.openIn")} {providerLabel(provider)}
                                <ExternalLink className="size-3" />
                              </a>
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))
            )}
          </div>
        )}
      </main>
    </AppShell>
  );
}
