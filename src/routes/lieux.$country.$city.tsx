import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronLeft, ExternalLink } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { BestTimeBadges, PlaceFameStars, PlacePrice } from "@/components/travel/PlaceDetails";
import { cityPlacesQuery, groupActivities, groupByCategory } from "@/lib/catalog";
import { useI18n } from "@/lib/i18n";
import {
  embedMapUrl,
  externalMapUrl,
  providerForCountry,
  providerLabel,
  type MapProvider,
} from "@/lib/mapProviders";
import { placeTitle, type CatalogPlace } from "@/lib/travel";

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

function PlaceBody({
  place,
  provider,
  compact = false,
}: {
  place: CatalogPlace;
  provider: MapProvider;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const title = placeTitle(place);

  return (
    <div className={compact ? "" : "px-3 pb-3"}>
      {compact ? (
        <div>
          {place.website ? (
            <a
              href={place.website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary underline"
            >
              {title.name}
              <ExternalLink className="size-3" />
            </a>
          ) : (
            <p className="text-sm font-medium">{title.name}</p>
          )}
          {title.ko ? <p className="text-xs text-muted-foreground">{title.ko}</p> : null}
          {place.area ? <p className="text-xs text-muted-foreground">{place.area}</p> : null}
        </div>
      ) : null}

      {place.description ? (
        <p className="mt-1 font-serif text-xs italic leading-relaxed text-muted-foreground">
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
        <p className="mt-3 text-xs text-muted-foreground">{t("map.noCoords")}</p>
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

      {!compact && place.website ? (
        <a
          href={place.website}
          target="_blank"
          rel="noreferrer"
          className="mt-2 block text-xs font-medium text-primary underline"
        >
          {placeTitle(place).name} — site officiel
        </a>
      ) : null}
    </div>
  );
}

function CityPage() {
  const { country, city } = Route.useParams();
  const { t } = useI18n();
  const [openId, setOpenId] = useState<string | null>(null);
  const { data: places, isLoading } = useQuery(cityPlacesQuery(country, city));

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

        <Link
          to="/journee/$country/$city"
          params={{ country, city }}
          className="mb-5 flex items-center gap-3 rounded-xl border border-border/70 bg-muted/40 px-3 py-3"
        >
          <CalendarDays className="size-5 shrink-0 text-primary" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Une journée à {city}</span>
            <span className="block font-serif text-xs italic text-muted-foreground">
              Programmes suggérés et fiche à composer soi-même
            </span>
          </span>
        </Link>


        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("discover.noResults")}</p>
        ) : (
          <div className="space-y-5">
            {groups.map(([category, list]) => {
              const entries = groupActivities(list);
              return (
                <section key={category}>
                  <h2 className="font-serif text-sm italic text-foreground">
                    {category} · {entries.length}
                  </h2>
                  <ul className="mt-2 divide-y divide-border/70 overflow-hidden rounded-xl border border-border/70 bg-muted/40">
                    {entries.map((entry) => {
                      const open = openId === entry.key;
                      const heading =
                        entry.kind === "group"
                          ? { name: entry.label, ko: null as string | null }
                          : placeTitle(entry.place);
                      const subtitle =
                        entry.kind === "group"
                          ? `${entry.places.length} adresse${entry.places.length > 1 ? "s" : ""}`
                          : entry.place.area;

                      return (
                        <li key={entry.key}>
                          <button
                            type="button"
                            aria-expanded={open}
                            onClick={() => setOpenId(open ? null : entry.key)}
                            className="flex w-full items-center gap-3 px-3 py-3 text-left"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium">{heading.name}</span>
                              {heading.ko ? (
                                <span className="block text-xs text-muted-foreground">
                                  {heading.ko}
                                </span>
                              ) : null}
                              {subtitle ? (
                                <span className="block truncate text-xs text-muted-foreground">
                                  {subtitle}
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
                            entry.kind === "group" ? (
                              <div className="space-y-4 px-3 pb-3">
                                {entry.places.map((place) => (
                                  <div
                                    key={place.id}
                                    className="rounded-xl border border-border/70 bg-background/60 p-3"
                                  >
                                    <PlaceBody place={place} provider={provider} compact />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <PlaceBody place={entry.place} provider={provider} />
                            )
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </AppShell>
  );
}

