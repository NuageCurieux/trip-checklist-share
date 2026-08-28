import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ExternalLink } from "lucide-react";
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
      { title: "Catalogue de lieux par ville — Carnets" },
      {
        name: "description",
        content:
          "Parcourez la sélection de lieux ville par ville : parcs de Séoul, adresses de Paris, Lisbonne, Rome et plus, avec aperçu de carte.",
      },
      { property: "og:title", content: "Catalogue de lieux par ville — Carnets" },
      {
        property: "og:description",
        content: "Explorez les lieux recensés par ville, avec description et aperçu de carte.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function CatalogPage() {
  const { t } = useI18n();
  const [city, setCity] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: places } = useQuery({
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

  const cities = [...new Set((places ?? []).map((p) => p.city))].filter(Boolean) as string[];
  const activeCity = city ?? cities[0] ?? null;
  const cityPlaces = (places ?? []).filter((p) => p.city === activeCity);
  const country = cityPlaces[0]?.country ?? null;
  const provider = providerForCountry(country);

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

  return (
    <AppShell kicker={t("discover.catalog")} title={activeCity ?? t("discover.title")}>
      <main className="px-6">
        <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1">
          {cities.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setCity(c);
                setOpenId(null);
              }}
              aria-pressed={c === activeCity}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${
                c === activeCity
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-5">
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("discover.noResults")}</p>
          ) : (
            groups.map(([category, list]) => (
              <section key={category}>
                <h2 className="font-serif text-sm italic text-foreground">
                  {activeCity ? `${activeCity} · ${category}` : category}
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
      </main>
    </AppShell>
  );
}
