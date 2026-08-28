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
  // Musées
  "musee-national": 5,
  "musee-palais": 3,
  "mmca-seoul": 4,
  leeum: 4,
  sema: 3,
  "musee-histoire-seoul": 3,
  "memorial-guerre": 4,
  "musee-folklore": 3,
  kimchikan: 2,
  ddp: 4,
  "nam-june-paik": 2,
  "paju-mimesis": 2,
  // Activités
  "n-seoul-tower": 5,
  "seoul-sky": 5,
  gyeongbokgung: 5,
  changdeokgung: 4,
  "hanbok-bukchon": 4,
  "dragon-hill": 3,
  "croisiere-han": 3,
  gwangjang: 4,
  "baseball-jamsil": 3,
  "lotte-world": 4,
  everland: 4,
  nami: 4,
  "hwaseong-suwon": 3,
  "dmz-paju": 4,
  // Ateliers
  "atelier-bagues": 3,
  "atelier-poterie": 3,
  "atelier-kimchi": 3,
  "atelier-parfum": 2,
  // Suncheon
  "suncheon-jardin": 4,
  "suncheon-baie": 4,
  naganeupseong: 3,
  "suncheon-drama": 2,
  songgwangsa: 3,
  // Busan
  gamcheon: 4,
  haeundae: 5,
  jagalchi: 4,
  yonggungsa: 4,
  gwangalli: 4,
  "busan-x-the-sky": 4,
  taejongdae: 3,
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
