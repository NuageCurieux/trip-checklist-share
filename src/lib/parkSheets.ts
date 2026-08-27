/** Fame rating (1-5 stars) per park, from the Canva booklet's popularity row. */
export const parkFame: Record<string, number> = {
  ansan: 2,
  banpo: 4,
  bugaksan: 2,
  bukhansan: 4,
  dream: 2,
  huwon: 3,
  inwangsan: 3,
  namsan: 5,
  seokchon: 4,
  seonyudo: 3,
  "seoul-forest": 4,
  "yeouido-hangang": 4,
  "yeouido-park": 3,
  "coex-aquarium": 4,
  "lotte-aquarium": 4,
  "aquaplanet-63": 3,
};

export function fameRating(key?: string | null): number | null {
  if (!key) return null;
  return parkFame[key] ?? null;
}

export const bestTimeSlots = ["matin", "debut-aprem", "fin-aprem", "soiree"] as const;
export type BestTimeSlot = (typeof bestTimeSlots)[number];

/** Emoji + i18n key for each daypart of the booklet's "when to go" row. */
export const bestTimeMeta: Record<BestTimeSlot, { icon: string; key: string }> = {
  matin: { icon: "🌅", key: "time.morning" },
  "debut-aprem": { icon: "☀️", key: "time.earlyAfternoon" },
  "fin-aprem": { icon: "🌤️", key: "time.lateAfternoon" },
  soiree: { icon: "🌙", key: "time.evening" },
};

export function orderedBestTime(values?: string[] | null): BestTimeSlot[] {
  if (!values?.length) return [];
  return bestTimeSlots.filter((slot) => values.includes(slot));
}
