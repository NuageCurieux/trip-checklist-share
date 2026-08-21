import { useI18n } from "@/lib/i18n";
import { bestTimeMeta, orderedBestTime, sheetImage } from "@/lib/parkSheets";

/** "When to go" chips extracted from the Canva booklet's daypart row. */
export function BestTimeBadges({ value }: { value?: string[] | null }) {
  const { t } = useI18n();
  const slots = orderedBestTime(value);
  if (slots.length === 0) return null;

  return (
    <div>
      <p className="kicker">{t("time.when")}</p>
      <ul className="mt-1 flex flex-wrap gap-1.5">
        {slots.map((slot) => (
          <li
            key={slot}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-foreground"
          >
            <span aria-hidden>{bestTimeMeta[slot].icon}</span>
            {t(bestTimeMeta[slot].key)}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Small illustrated sheet (price, popularity, mood, highlight, walking route). */
export function PlaceSheetImage({
  sheetKey,
  name,
}: {
  sheetKey?: string | null;
  name: string;
}) {
  const { t } = useI18n();
  const src = sheetImage(sheetKey);
  if (!src) return null;

  return (
    <figure className="overflow-hidden rounded-xl border border-border bg-background">
      <img
        src={src}
        alt={`${t("time.sheet")} — ${name}`}
        loading="lazy"
        className="w-full"
      />
    </figure>
  );
}
