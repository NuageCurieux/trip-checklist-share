import { useMutation } from "@tanstack/react-query";
import { PencilLine } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import type { CatalogPlace } from "@/lib/travel";

const FIELDS = ["description", "name", "category", "area"] as const;
export type SuggestionField = (typeof FIELDS)[number];

/**
 * Travellers never edit the shared catalogue directly: they file a correction
 * that is applied only after moderator review or community consensus.
 */
export function SuggestCorrection({ place }: { place: CatalogPlace }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [field, setField] = useState<SuggestionField>("description");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");

  const submit = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("place_suggestions").insert({
        catalog_place_id: place.id,
        field,
        proposed_value: value.trim(),
        reason: reason.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("fix.submitted"));
      setOpen(false);
      setValue("");
      setReason("");
    },
    onError: () => toast.error(t("common.error")),
  });

  if (!open) {
    return (
      <button
        type="button"
        aria-label={t("fix.cta")}
        onClick={() => setOpen(true)}
        className="grid size-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground"
      >
        <PencilLine className="size-4" />
      </button>
    );
  }

  return (
    <div className="mt-3 w-full rounded-xl border border-border bg-background p-3">
      <p className="kicker mb-2">{t("fix.title")}</p>
      <div className="flex flex-wrap gap-1">
        {FIELDS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setField(f)}
            aria-pressed={f === field}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
              f === field ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {t(`fix.field.${f}`)}
          </button>
        ))}
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={600}
        rows={3}
        placeholder={t("fix.valuePlaceholder")}
        className="mt-3 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm"
      />
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={600}
        placeholder={t("fix.reasonPlaceholder")}
        className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm"
      />
      <p className="mt-2 text-[11px] text-muted-foreground">{t("fix.moderationNote")}</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={value.trim().length < 2 || submit.isPending}
          onClick={() => submit.mutate()}
          className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {t("fix.send")}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl border border-border px-4 py-2.5 text-sm"
        >
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}
