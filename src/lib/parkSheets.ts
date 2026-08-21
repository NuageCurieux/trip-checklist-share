import ansan from "@/assets/parcs/fiche-ansan.png";
import banpo from "@/assets/parcs/fiche-banpo.png";
import bugaksan from "@/assets/parcs/fiche-bugaksan.png";
import bukhansan from "@/assets/parcs/fiche-bukhansan.png";
import dream from "@/assets/parcs/fiche-dream.png";
import huwon from "@/assets/parcs/fiche-huwon.png";
import inwangsan from "@/assets/parcs/fiche-inwangsan.png";
import namsan from "@/assets/parcs/fiche-namsan.png";
import seokchon from "@/assets/parcs/fiche-seokchon.png";
import seonyudo from "@/assets/parcs/fiche-seonyudo.png";
import seoulForest from "@/assets/parcs/fiche-seoul-forest.png";
import yeouidoHangang from "@/assets/parcs/fiche-yeouido-hangang.png";
import yeouidoPark from "@/assets/parcs/fiche-yeouido-park.png";

/** Illustrated cards (price, popularity, mood, highlight, walking) from the Canva booklet. */
export const parkSheets: Record<string, string> = {
  ansan,
  banpo,
  bugaksan,
  bukhansan,
  dream,
  huwon,
  inwangsan,
  namsan,
  seokchon,
  seonyudo,
  "seoul-forest": seoulForest,
  "yeouido-hangang": yeouidoHangang,
  "yeouido-park": yeouidoPark,
};

export function sheetImage(key?: string | null): string | null {
  if (!key) return null;
  return parkSheets[key] ?? null;
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
