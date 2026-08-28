import { supabase } from "@/integrations/supabase/client";
import type { CatalogPlace } from "@/lib/travel";

/** A curated one-day itinerary, referencing catalogue places by their sheet key. */
export type CuratedDayPlan = {
  key: string;
  title: string;
  summary: string;
  steps: Array<{ slot: string; sheetKey: string; tip?: string }>;
};

export const SLOTS = ["Matin", "Midi", "Après-midi", "Fin de journée", "Soirée"] as const;

/** Suggested day programmes, city by city. */
export const CURATED_DAY_PLANS: Record<string, CuratedDayPlan[]> = {
  "Séoul": [
    {
      key: "seoul-joseon",
      title: "Séoul royale",
      summary: "Palais, hanok et thé : une journée dans le Séoul de la dynastie Joseon.",
      steps: [
        { slot: "Matin", sheetKey: "hanbok-bukchon", tip: "Louer le hanbok tôt : l'entrée des palais devient gratuite." },
        { slot: "Matin", sheetKey: "gyeongbokgung", tip: "Relève de la garde à 10h." },
        { slot: "Midi", sheetKey: "insadong" },
        { slot: "Après-midi", sheetKey: "changdeokgung" },
        { slot: "Après-midi", sheetKey: "bukchon" },
        { slot: "Fin de journée", sheetKey: "ikseondong" },
        { slot: "Soirée", sheetKey: "cheonggyecheon" },
      ],
    },
    {
      key: "seoul-jeune",
      title: "Séoul créative",
      summary: "Friperies, ateliers et cafés : la journée des quartiers jeunes.",
      steps: [
        { slot: "Matin", sheetKey: "friperie-dongmyo" },
        { slot: "Midi", sheetKey: "gwangjang", tip: "Bindaetteok et mayak gimbap." },
        { slot: "Après-midi", sheetKey: "atelier-bagues" },
        { slot: "Fin de journée", sheetKey: "seongsu" },
        { slot: "Soirée", sheetKey: "hongdae" },
      ],
    },
    {
      key: "seoul-vues",
      title: "Séoul en hauteur",
      summary: "Montagne le matin, panoramas le soir, sauna pour finir.",
      steps: [
        { slot: "Matin", sheetKey: "inwangsan" },
        { slot: "Midi", sheetKey: "namdaemun" },
        { slot: "Après-midi", sheetKey: "namsan" },
        { slot: "Fin de journée", sheetKey: "n-seoul-tower", tip: "Monter 45 min avant le coucher du soleil." },
        { slot: "Soirée", sheetKey: "autre-jjimjilbang" },
      ],
    },
    {
      key: "seoul-culture",
      title: "Séoul musées & temples",
      summary: "Idéal par temps de pluie : grandes collections et temples paisibles.",
      steps: [
        { slot: "Matin", sheetKey: "musee-national" },
        { slot: "Midi", sheetKey: "myeongdong" },
        { slot: "Après-midi", sheetKey: "jogyesa" },
        { slot: "Après-midi", sheetKey: "leeum" },
        { slot: "Fin de journée", sheetKey: "starfield-library" },
        { slot: "Soirée", sheetKey: "bongeunsa", tip: "Le temple illuminé face aux tours de Gangnam." },
      ],
    },
  ],
  "Autour de Séoul": [
    {
      key: "autour-seoul-histoire",
      title: "Journée Joseon à Yongin",
      summary: "Art ancien, village traditionnel et jardins, à une heure de Séoul.",
      steps: [
        { slot: "Matin", sheetKey: "yongin-hoam" },
        { slot: "Après-midi", sheetKey: "yongin-village-folklorique" },
        { slot: "Fin de journée", sheetKey: "gwacheon-mmca" },
      ],
    },
    {
      key: "autour-seoul-nature",
      title: "Nature & frontière",
      summary: "L'île de Nami le matin, la DMZ l'après-midi.",
      steps: [
        { slot: "Matin", sheetKey: "nami" },
        { slot: "Après-midi", sheetKey: "dmz-paju", tip: "Passeport obligatoire." },
        { slot: "Fin de journée", sheetKey: "paju-mimesis" },
      ],
    },
    {
      key: "autour-seoul-suwon",
      title: "Forteresse de Suwon",
      summary: "Remparts, marché et art contemporain.",
      steps: [
        { slot: "Matin", sheetKey: "hwaseong-suwon" },
        { slot: "Après-midi", sheetKey: "nam-june-paik" },
        { slot: "Soirée", sheetKey: "everland", tip: "Option familles : parade et illuminations." },
      ],
    },
  ],
  "Busan": [
    {
      key: "busan-mer",
      title: "Busan côté mer",
      summary: "Plages, téléphérique et panorama nocturne.",
      steps: [
        { slot: "Matin", sheetKey: "haeundae" },
        { slot: "Midi", sheetKey: "blueline-park" },
        { slot: "Après-midi", sheetKey: "songdo-skywalk" },
        { slot: "Fin de journée", sheetKey: "busan-x-the-sky" },
        { slot: "Soirée", sheetKey: "gwangalli", tip: "Spectacle de drones certains samedis." },
      ],
    },
    {
      key: "busan-vieille-ville",
      title: "Busan authentique",
      summary: "Marchés, ruelles colorées et librairies d'occasion.",
      steps: [
        { slot: "Matin", sheetKey: "jagalchi" },
        { slot: "Midi", sheetKey: "gukje" },
        { slot: "Après-midi", sheetKey: "friperie-bosudong" },
        { slot: "Après-midi", sheetKey: "gamcheon" },
        { slot: "Fin de journée", sheetKey: "busan-yongdusan" },
        { slot: "Soirée", sheetKey: "autre-spaland" },
      ],
    },
    {
      key: "busan-culture",
      title: "Busan culture",
      summary: "Musées, temple de bord de mer et cinéma.",
      steps: [
        { slot: "Matin", sheetKey: "yonggungsa", tip: "Arriver avant 9h pour éviter la foule." },
        { slot: "Midi", sheetKey: "busan-musee-national" },
        { slot: "Après-midi", sheetKey: "busan-f1963" },
        { slot: "Fin de journée", sheetKey: "huinnyeoul" },
        { slot: "Soirée", sheetKey: "busan-cinema-center" },
      ],
    },
  ],
  "Suncheon": [
    {
      key: "suncheon-nature",
      title: "Baie de Suncheon",
      summary: "Roselières, coucher de soleil sur les marais et jardin national.",
      steps: [
        { slot: "Matin", sheetKey: "suncheon-jardin" },
        { slot: "Midi", sheetKey: "aryong" },
        { slot: "Après-midi", sheetKey: "suncheon-eco-musee" },
        { slot: "Après-midi", sheetKey: "suncheon-baie" },
        { slot: "Fin de journée", sheetKey: "yongsan-suncheon", tip: "Le meilleur point de vue au coucher du soleil." },
      ],
    },
    {
      key: "suncheon-patrimoine",
      title: "Temples & village fortifié",
      summary: "Une journée lente entre bouddhisme et architecture Joseon.",
      steps: [
        { slot: "Matin", sheetKey: "songgwangsa" },
        { slot: "Midi", sheetKey: "seonamsa" },
        { slot: "Après-midi", sheetKey: "naganeupseong" },
        { slot: "Fin de journée", sheetKey: "suncheon-drama" },
      ],
    },
  ],
  "Autour de Suncheon": [
    {
      key: "boseong-the",
      title: "Champs de thé de Boseong",
      summary: "Terrasses de thé, musée du thé et bain de thé vert face à la mer.",
      steps: [
        { slot: "Matin", sheetKey: "boseong-dawon" },
        { slot: "Midi", sheetKey: "boseong-musee-the" },
        { slot: "Après-midi", sheetKey: "yulpo-beach" },
      ],
    },
    {
      key: "yeosu-mer",
      title: "Yeosu maritime",
      summary: "Île, aquarium et téléphérique au-dessus de la baie.",
      steps: [
        { slot: "Matin", sheetKey: "odongdo" },
        { slot: "Midi", sheetKey: "yeosu-jinnamgwan" },
        { slot: "Après-midi", sheetKey: "yeosu-aquaplanet" },
        { slot: "Fin de journée", sheetKey: "yeosu-cablecar", tip: "Cabine cristal au coucher du soleil." },
      ],
    },
    {
      key: "oiseaux-fleurs",
      title: "Oiseaux & pruniers",
      summary: "Observation des grues et village en fleurs (surtout en mars).",
      steps: [
        { slot: "Matin", sheetKey: "suncheonman-birds" },
        { slot: "Après-midi", sheetKey: "gwangyang-maehwa" },
      ],
    },
  ],
};

export function curatedPlansFor(city: string): CuratedDayPlan[] {
  return CURATED_DAY_PLANS[city] ?? [];
}

export type DayPlan = {
  id: string;
  owner_id: string;
  country: string;
  city: string;
  title: string;
  note: string | null;
  planned_date: string | null;
  done: boolean;
  shared: boolean;
  created_at: string;
};

export type DayPlanItem = {
  id: string;
  plan_id: string;
  catalog_place_id: string;
  slot: string | null;
  position: number;
};

export type DayPlanWithItems = DayPlan & { items: DayPlanItem[] };

const PLAN_COLUMNS =
  "id, owner_id, country, city, title, note, planned_date, done, shared, created_at";

async function withItems(plans: DayPlan[]): Promise<DayPlanWithItems[]> {
  const ids = plans.map((p) => p.id);
  if (ids.length === 0) return [];
  const { data: items, error } = await supabase
    .from("day_plan_items")
    .select("id, plan_id, catalog_place_id, slot, position")
    .in("plan_id", ids)
    .order("position");
  if (error) throw error;
  return plans.map((plan) => ({
    ...plan,
    items: ((items ?? []) as DayPlanItem[]).filter((i) => i.plan_id === plan.id),
  }));
}

/** Every day plan visible for one city: the traveller's own ones and the shared ones. */
export function cityDayPlansQuery(country: string, city: string, enabled: boolean) {
  return {
    queryKey: ["day-plans", country, city],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("day_plans")
        .select(PLAN_COLUMNS)
        .eq("country", country)
        .eq("city", city)
        .order("planned_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return withItems((data ?? []) as DayPlan[]);
    },
  };
}

/** Shared and personal day plans across every city, for the carnet page. */
export function allDayPlansQuery(enabled: boolean) {
  return {
    queryKey: ["day-plans-all"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("day_plans")
        .select(PLAN_COLUMNS)
        .order("planned_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return withItems((data ?? []) as DayPlan[]);
    },
  };
}

export async function createDayPlan(input: {
  country: string;
  city: string;
  title: string;
  note?: string | null;
  plannedDate?: string | null;
  shared?: boolean;
  selection: Array<{ placeId: string; slot: string }>;
}) {
  const { data: plan, error } = await supabase
    .from("day_plans")
    .insert({
      country: input.country,
      city: input.city,
      title: input.title,
      note: input.note ?? null,
      planned_date: input.plannedDate || null,
      shared: input.shared ?? true,
    })
    .select("id")
    .single();
  if (error) throw error;
  if (input.selection.length > 0) {
    const rows = input.selection.map((item, index) => ({
      plan_id: plan.id,
      catalog_place_id: item.placeId,
      slot: item.slot,
      position: index,
    }));
    const { error: itemsError } = await supabase.from("day_plan_items").insert(rows);
    if (itemsError) throw itemsError;
  }
  return plan.id as string;
}

/** Collaborative edit: any signed-in traveller may update a shared plan. */
export async function updateDayPlan(
  id: string,
  patch: { title?: string; note?: string | null; planned_date?: string | null; done?: boolean },
) {
  const { error } = await supabase.from("day_plans").update(patch).eq("id", id);
  if (error) throw error;
}

export async function addDayPlanItem(planId: string, catalogPlaceId: string, slot: string) {
  const { error } = await supabase
    .from("day_plan_items")
    .insert({ plan_id: planId, catalog_place_id: catalogPlaceId, slot, position: 999 });
  if (error) throw error;
}

export async function removeDayPlanItem(itemId: string) {
  const { error } = await supabase.from("day_plan_items").delete().eq("id", itemId);
  if (error) throw error;
}

export async function deleteDayPlan(id: string) {
  const { error } = await supabase.from("day_plans").delete().eq("id", id);
  if (error) throw error;
}

/** Index catalogue places by sheet key, to resolve curated itineraries. */
export function indexBySheetKey(places: CatalogPlace[]) {
  const map = new Map<string, CatalogPlace>();
  for (const place of places) if (place.sheet_key) map.set(place.sheet_key, place);
  return map;
}

export function indexById(places: CatalogPlace[]) {
  const map = new Map<string, CatalogPlace>();
  for (const place of places) map.set(place.id, place);
  return map;
}

/** Sorts selections by the natural order of a day. */
export function slotRank(slot: string | null) {
  const index = SLOTS.indexOf((slot ?? "") as (typeof SLOTS)[number]);
  return index === -1 ? SLOTS.length : index;
}

export function formatPlanDate(date: string | null) {
  if (!date) return null;
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

