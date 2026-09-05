import { Check, Heart } from "lucide-react";
import { toast } from "sonner";

import { usePlaceMarks } from "@/lib/placeMarks";

/** Love / already-done buttons for one catalogue place. */
export function PlaceMarks({ placeId }: { placeId: string }) {
  const { user, favoriteIds, visitedIds, toggleFavorite, toggleVisited } = usePlaceMarks();

  if (!user) return null;

  const loved = favoriteIds.has(placeId);
  const done = visitedIds.has(placeId);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button
        type="button"
        aria-pressed={loved}
        aria-label={loved ? "Retirer des coups de cœur" : "Ajouter aux coups de cœur"}
        disabled={toggleFavorite.isPending}
        onClick={() =>
          toggleFavorite.mutate(placeId, {
            onError: (error) => toast.error((error as Error).message),
          })
        }
        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${
          loved ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
        }`}
      >
        <Heart className={`size-3.5 ${loved ? "fill-primary" : ""}`} />
        {loved ? "Aimé" : "J'aime"}
      </button>

      <button
        type="button"
        aria-pressed={done}
        disabled={toggleVisited.isPending}
        onClick={() =>
          toggleVisited.mutate(placeId, {
            onError: (error) => toast.error((error as Error).message),
          })
        }
        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${
          done ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
        }`}
      >
        <Check className="size-3.5" />
        {done ? "Déjà fait" : "Marquer comme fait"}
      </button>
    </div>
  );
}
