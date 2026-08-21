import { CloudSun, Moon, Sun, Sunrise } from "lucide-react";

import { useI18n } from "@/lib/i18n";
import { bestTimeMeta, fameRating, orderedBestTime, type BestTimeSlot } from "@/lib/parkSheets";

const ICONS: Record<BestTimeSlot, typeof Sun> = {
  matin: Sunrise,
  "debut-aprem": Sun,
  "fin-aprem": CloudSun,
  soiree: Moon,
};

/** "When to go" chips extracted from the Canva booklet's daypart row. */
export function BestTimeBadges({ value }: { value?: string[] | null }) {
  const { t } = useI18n();
  const slots = orderedBestTime(value);
  if (slots.length === 0) return null;

  return (
    <div>
      <p className="kicker">{t("time.when")}</p>
      <ul className="mt-1 flex flex-wrap gap-1.5">
        {slots.map((slot) => {
          const Icon = ICONS[slot];
          return (
            <li
              key={slot}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-foreground"
            >
              <Icon className="size-3.5 text-primary" />
              {t(bestTimeMeta[slot].key)}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Fame rating shown as stars instead of the old illustrated sheet. */
export function PlaceFameStars({
  sheetKey,
  name,
}: {
  sheetKey?: string | null;
  name: string;
}) {
  const { t } = useI18n();
  const rating = fameRating(sheetKey);
  if (!rating) return null;

  return (
    <div>
      <p className="kicker">{t("time.fame")}</p>
      <p
        className="mt-1 text-base leading-none tracking-[0.15em] text-primary"
        aria-label={`${name} — ${rating}/5`}
        title={`${rating}/5`}
      >
        <span aria-hidden="true">{"\u2605".repeat(rating) + "\u2606".repeat(5 - rating)}</span>
      </p>
    </div>
  );
}
