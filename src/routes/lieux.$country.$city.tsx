import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronLeft, ExternalLink } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { BestTimeBadges, PlaceFameStars, PlacePrice } from "@/components/travel/PlaceDetails";
import { cityPlacesQuery, groupByCategory } from "@/lib/catalog";
import { useI18n } from "@/lib/i18n";
import {
  embedMapUrl,
  externalMapUrl,
  providerForCountry,
  providerLabel,
} from "@/lib/mapProviders";
import { placeTitle } from "@/lib/travel";

export const Route = createFileRoute("/lieux/$country/$city")({
  component: CityPage,
  head: ({ params }) => ({
    meta: [
      { title: `Que faire à ${params.city} — Carnets` },
      {
        name: "description",
        content: `Les lieux à visiter à ${params.city} (${params.country}) : description, notoriété, meilleur moment de la journée, prix et carte.`,
      },
      { property: "og:title", content: `Que faire à ${params.city} — Carnets` },
      {
        property: "og:description",
        content: `Activités, musées, parcs et balades à ${params.city}, avec prix et aperçu de carte.`,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function CityPage() {
  const { country, city } = Route.useParams();
  const { t } = useI18n();
  const [openId, setOpenId] = useState<string | null>(null);
  const { data: places, isLoading } = useQuery(cityPlacesQuery(city));

  const groups = groupByCategory(places ?? [], t("discover.catalog"));
  const provider = providerForCountry(places?.[0]?.country ?? country);

  return (
    <AppShell kicker={country} title={city}>
      <main className="px-6 pb-6">
        <Link
          to="/lieux/$country"
          params={{ country }}
          className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-primary"
        >
          <ChevronLeft className="size-4" />
          {country}
        </Link>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("discover.noResults")}</p>
        ) : (
          <div className="space-y-5">
            {groups.map(([category, list]) => (
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
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}
