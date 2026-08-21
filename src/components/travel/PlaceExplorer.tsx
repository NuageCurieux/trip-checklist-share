import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, ExternalLink, Heart, Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import {
  embedMapUrl,
  externalMapUrl,
  providerForCountry,
  providerLabel,
} from "@/lib/mapProviders";
import { searchPlaces, type MapsSearchResult } from "@/lib/maps.functions";
import { SuggestCorrection } from "@/components/travel/SuggestCorrection";
import type { CatalogPlace } from "@/lib/travel";

/**
 * City library: seeded/community catalogue first, live Google Maps search as a
 * top-up so the traveller can always complete the list.
 */
export function PlaceExplorer({
  tripId,
  city,
  country,
  onAdded,
}: {
  tripId: string;
  city: string | null;
  country?: string | null;
  onAdded: () => void;
}) {
  const { t, lang } = useI18n();
  const queryClient = useQueryClient();
  const search = useServerFn(searchPlaces);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<MapsSearchResult[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const provider = providerForCountry(country);

  const { data: catalog } = useQuery({
    queryKey: ["catalog", city, country],
    enabled: Boolean(city || country),
    queryFn: async () => {
      // The notebook stores a free destination ("Corée du Sud"), so match both
      // the catalogue city and its country to always surface the seeded places.
      const term = (city ?? country ?? "").trim();
      const { data, error } = await supabase
        .from("catalog_places")
        .select("*")
        .or(`city.ilike.%${term}%,country.ilike.%${term}%`)
        .order("city")
        .order("name");
      if (error) throw error;
      return (data ?? []) as CatalogPlace[];
    },
  });


  const { data: favorites } = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const { data, error } = await supabase.from("favorites").select("catalog_place_id");
      if (error) throw error;
      return new Set((data ?? []).map((row) => row.catalog_place_id));
    },
  });

  const runSearch = useMutation({
    mutationFn: async () => {
      const payload: {
        query: string;
        language: "fr" | "en" | "es";
        city?: string;
      } = { query: term.trim(), language: lang };
      if (city) payload.city = city;
      return search({ data: payload });
    },
    onSuccess: (data) => setResults(data),
    onError: () => toast.error(t("common.error")),
  });

  const toggleFavorite = useMutation({
    mutationFn: async (place: CatalogPlace) => {
      if (favorites?.has(place.id)) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("catalog_place_id", place.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("favorites").insert({ catalog_place_id: place.id });
        if (error) throw error;
      }
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["favorites"] }),
    onError: () => toast.error(t("common.error")),
  });

  const addFromCatalog = useMutation({
    mutationFn: async (place: CatalogPlace) => {
      const { error } = await supabase.from("places").insert({
        trip_id: tripId,
        name: place.name,
        area: place.area,
        category: place.category,
        note: place.description,
        lat: place.lat,
        lng: place.lng,
        catalog_place_id: place.id,
        google_place_id: place.google_place_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("discover.added"));
      onAdded();
    },
    onError: () => toast.error(t("common.error")),
  });

  /** A Google result is saved to the shared catalogue, then added to the notebook. */
  const addFromSearch = useMutation({
    mutationFn: async (result: MapsSearchResult) => {
      const { data: existing } = await supabase
        .from("catalog_places")
        .select("id")
        .eq("google_place_id", result.googlePlaceId)
        .maybeSingle();

      let catalogId = existing?.id ?? null;
      if (!catalogId) {
        const { data: inserted, error } = await supabase
          .from("catalog_places")
          .insert({
            city: city ?? result.address?.split(",").slice(-2, -1)[0]?.trim() ?? "—",
            country: country ?? null,
            name: result.name,
            category: result.category,
            area: result.address,
            lat: result.lat,
            lng: result.lng,
            google_place_id: result.googlePlaceId,
            source: "google",
          })
          .select("id")
          .maybeSingle();
        if (error) throw error;
        catalogId = inserted?.id ?? null;
      }

      const { error: placeError } = await supabase.from("places").insert({
        trip_id: tripId,
        name: result.name,
        area: result.address,
        category: result.category,
        lat: result.lat,
        lng: result.lng,
        google_place_id: result.googlePlaceId,
        catalog_place_id: catalogId,
      });
      if (placeError) throw placeError;
    },
    onSuccess: () => {
      toast.success(t("discover.added"));
      void queryClient.invalidateQueries({ queryKey: ["catalog", city] });
      onAdded();
    },
    onError: () => toast.error(t("common.error")),
  });

  /** Catalogue grouped by category so each city reads as labelled sections. */
  const groups: Array<[string, CatalogPlace[]]> = (() => {
    const map = new Map<string, CatalogPlace[]>();
    for (const place of catalog ?? []) {
      const key = place.category?.trim() || t("discover.catalog");
      const list = map.get(key) ?? [];
      list.push(place);
      map.set(key, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  })();

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <h2 className="font-serif text-lg">{t("discover.title")}</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {city ? city : t("discover.noCity")}
      </p>

      <div className="mt-4 flex gap-2">
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && term.trim().length > 1) runSearch.mutate();
          }}
          placeholder={t("discover.searchPlaceholder")}
          className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm"
        />
        <button
          type="button"
          aria-label={t("discover.search")}
          disabled={term.trim().length < 2 || runSearch.isPending}
          onClick={() => runSearch.mutate()}
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
        >
          <Search className="size-4" />
        </button>
      </div>

      {results ? (
        <div className="mt-4">
          <p className="kicker mb-2">Google Maps</p>
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("discover.noResults")}</p>
          ) : (
            <ul className="space-y-2">
              {results.map((result) => (
                <li
                  key={result.googlePlaceId}
                  className="flex items-start gap-3 rounded-xl bg-muted/60 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{result.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[result.category, result.address].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={t("discover.addToTrip")}
                    onClick={() => addFromSearch.mutate(result)}
                    className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
                  >
                    <Plus className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      <div className="mt-5">
        <p className="kicker mb-2">{t("discover.catalog")}</p>
        {!catalog || catalog.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("discover.noResults")}</p>
        ) : (
          <div className="space-y-5">
            {groups.map(([category, places]) => (
              <section key={category}>
                <h3 className="font-serif text-sm italic text-foreground">
                  {city ? `${city} · ${category}` : category}
                </h3>
                <ul className="mt-2 divide-y divide-border/70 overflow-hidden rounded-xl border border-border/70 bg-muted/40">
                  {places.map((place) => {
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
                            <span className="block text-sm font-medium">{place.name}</span>
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

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <SuggestCorrection place={place} />
                              <button
                                type="button"
                                aria-label={t("fav.add")}
                                onClick={() => toggleFavorite.mutate(place)}
                                className="grid size-8 shrink-0 place-items-center rounded-full border border-border"
                              >
                                <Heart
                                  className={`size-4 ${
                                    favorites?.has(place.id)
                                      ? "fill-primary text-primary"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              </button>
                              <button
                                type="button"
                                aria-label={t("discover.addToTrip")}
                                onClick={() => addFromCatalog.mutate(place)}
                                className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
                              >
                                <Plus className="size-4" />
                              </button>
                            </div>
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
      </div>
    </div>
  );
}
