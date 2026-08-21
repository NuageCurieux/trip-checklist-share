import coverDefault from "@/assets/cover-calanques.jpg";
import coverKorea from "@/assets/cover-korea.jpg";

export function defaultCoverFor(destination?: string | null) {
  const d = (destination ?? "").toLowerCase();
  if (
    ["corée du sud", "south korea", "korea", "corée", "korean", "séoul", "seoul"].some((k) =>
      d.includes(k)
    )
  ) {
    return coverKorea;
  }
  return coverDefault;
}
