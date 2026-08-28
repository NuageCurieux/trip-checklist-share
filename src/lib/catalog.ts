import { supabase } from "@/integrations/supabase/client";
import type { CatalogPlace } from "@/lib/travel";

/** Cities are shown in travel order rather than alphabetically. */
const CITY_ORDER = ["Séoul", "Autour de Séoul", "Suncheon", "Busan"];

export function orderCities(a: string, b: string) {
  const ia = CITY_ORDER.indexOf(a);
  const ib = CITY_ORDER.indexOf(b);
  if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  return a.localeCompare(b);
}

/** Countries with their city / place counts, for the catalogue home. */
export function countriesQuery() {
  return {
    queryKey: ["catalog-countries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog_places")
        .select("country, city")
        .order("country");
      if (error) throw error;
      const map = new Map<string, { cities: Set<string>; count: number }>();
      for (const row of data ?? []) {
        const key = row.country?.trim() || "—";
        const entry = map.get(key) ?? { cities: new Set<string>(), count: 0 };
        if (row.city) entry.cities.add(row.city);
        entry.count += 1;
        map.set(key, entry);
      }
      return [...map.entries()]
        .map(([name, info]) => ({ name, cities: info.cities.size, count: info.count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    },
  };
}

/** Cities of one country, with their place counts. */
export function citiesQuery(country: string) {
  return {
    queryKey: ["catalog-cities", country],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog_places")
        .select("city")
        .eq("country", country);
      if (error) throw error;
      const map = new Map<string, number>();
      for (const row of data ?? []) {
        if (!row.city) continue;
        map.set(row.city, (map.get(row.city) ?? 0) + 1);
      }
      return [...map.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => orderCities(a.name, b.name));
    },
  };
}

/** Every place of one city, scoped to its country. */
export function cityPlacesQuery(country: string, city: string) {
  return {
    queryKey: ["catalog-city", country, city],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog_places")
        .select("*")
        .eq("country", country)
        .eq("city", city)
        .order("name");
      if (error) throw error;
      return (data ?? []) as CatalogPlace[];
    },
  };
}

/** Places grouped by category label. */
export function groupByCategory(
  places: CatalogPlace[],
  fallback: string,
): Array<[string, CatalogPlace[]]> {
  const map = new Map<string, CatalogPlace[]>();
  for (const place of places) {
    const key = place.category?.trim() || fallback;
    const list = map.get(key) ?? [];
    list.push(place);
    map.set(key, list);
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}
