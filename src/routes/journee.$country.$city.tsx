import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  MapPin,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/useSession";
import { cityPlacesQuery } from "@/lib/catalog";
import {
  addDayPlanItem,
  cityDayPlansQuery,
  createDayPlan,
  curatedPlansFor,
  type DayPlanWithItems,
  deleteDayPlan,
  formatPlanDate,
  indexById,
  indexBySheetKey,
  removeDayPlanItem,
  slotRank,
  SLOTS,
  updateDayPlan,
} from "@/lib/dayPlans";
import { placeTitle } from "@/lib/travel";


export const Route = createFileRoute("/journee/$country/$city")({
  component: DayPlanPage,
  head: ({ params }) => ({
    meta: [
      { title: `Une journée à ${params.city} — Carnets` },
      {
        name: "description",
        content: `Programmes d'une journée à ${params.city} : itinéraires prêts à suivre et création de sa propre fiche en choisissant ses activités.`,
      },
      { property: "og:title", content: `Une journée à ${params.city} — Carnets` },
      {
        property: "og:description",
        content: `Idées d'itinéraires heure par heure à ${params.city}, et fiche personnalisée à composer soi-même.`,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function DayPlanPage() {
  const { country, city } = Route.useParams();
  const { user } = useSession();
  const queryClient = useQueryClient();

  const { data: places, isLoading } = useQuery(cityPlacesQuery(country, city));
  const plansQuery = myDayPlansQuery(country, city, Boolean(user));
  const { data: myPlans } = useQuery(plansQuery);

  const [openPlan, setOpenPlan] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [showBuilder, setShowBuilder] = useState(false);

  const curated = curatedPlansFor(city);
  const bySheet = useMemo(() => indexBySheetKey(places ?? []), [places]);
  const byId = useMemo(() => indexById(places ?? []), [places]);

  const selected = useMemo(
    () =>
      Object.entries(selection)
        .map(([placeId, slot]) => ({ placeId, slot }))
        .sort((a, b) => slotRank(a.slot) - slotRank(b.slot)),
    [selection],
  );

  const save = useMutation({
    mutationFn: () =>
      createDayPlan({
        country,
        city,
        title: title.trim() || `Ma journée à ${city}`,
        note: note.trim() || null,
        selection: selected,
      }),
    onSuccess: () => {
      toast.success("Fiche enregistrée");
      setTitle("");
      setNote("");
      setSelection({});
      setShowBuilder(false);
      queryClient.invalidateQueries({ queryKey: plansQuery.queryKey });
    },
    onError: () => toast.error("Impossible d'enregistrer la fiche"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteDayPlan(id),
    onSuccess: () => {
      toast.success("Fiche supprimée");
      queryClient.invalidateQueries({ queryKey: plansQuery.queryKey });
    },
    onError: () => toast.error("Suppression impossible"),
  });

  function toggle(placeId: string) {
    setSelection((prev) => {
      const next = { ...prev };
      if (next[placeId]) delete next[placeId];
      else next[placeId] = "Matin";
      return next;
    });
  }

  return (
    <AppShell kicker={`${country} · ${city}`} title="Une journée">
      <main className="px-6 pb-10">
        <Link
          to="/lieux/$country/$city"
          params={{ country, city }}
          className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-primary"
        >
          <ChevronLeft className="size-4" />
          Les lieux de {city}
        </Link>

        <section>
          <h2 className="font-serif text-sm italic text-foreground">
            Programmes suggérés · {curated.length}
          </h2>
          {isLoading ? (
            <p className="mt-2 text-sm text-muted-foreground">Chargement…</p>
          ) : curated.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Pas encore de programme pour cette étape — composez le vôtre ci-dessous.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {curated.map((plan) => {
                const open = openPlan === plan.key;
                return (
                  <li
                    key={plan.key}
                    className="overflow-hidden rounded-xl border border-border/70 bg-muted/40"
                  >
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenPlan(open ? null : plan.key)}
                      className="flex w-full items-start gap-3 px-3 py-3 text-left"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{plan.title}</span>
                        <span className="block font-serif text-xs italic text-muted-foreground">
                          {plan.summary}
                        </span>
                      </span>
                      <ChevronDown
                        className={`mt-1 size-4 shrink-0 text-muted-foreground transition-transform ${
                          open ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {open ? (
                      <ol className="space-y-3 border-t border-border/70 px-3 py-3">
                        {plan.steps.map((step, index) => {
                          const place = bySheet.get(step.sheetKey);
                          const heading = place ? placeTitle(place) : null;
                          return (
                            <li key={`${step.sheetKey}-${index}`} className="flex gap-3">
                              <span className="mt-0.5 w-24 shrink-0 text-[11px] font-medium uppercase tracking-wide text-primary">
                                {step.slot}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-medium">
                                  {heading?.name ?? step.sheetKey}
                                </span>
                                {heading?.ko ? (
                                  <span className="block text-xs text-muted-foreground">
                                    {heading.ko}
                                  </span>
                                ) : null}
                                {place?.area ? (
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <MapPin className="size-3" />
                                    {place.area}
                                  </span>
                                ) : null}
                                {step.tip ? (
                                  <span className="mt-1 block font-serif text-xs italic text-muted-foreground">
                                    {step.tip}
                                  </span>
                                ) : null}
                              </span>
                            </li>
                          );
                        })}
                      </ol>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-sm italic text-foreground">Ma fiche</h2>
            {user ? (
              <Button size="sm" variant="secondary" onClick={() => setShowBuilder((v) => !v)}>
                <Plus className="mr-1 size-4" />
                {showBuilder ? "Fermer" : "Créer"}
              </Button>
            ) : null}
          </div>

          {!user ? (
            <p className="mt-2 text-sm text-muted-foreground">
              <Link to="/auth" className="font-medium text-primary underline">
                Connectez-vous
              </Link>{" "}
              pour composer et enregistrer vos propres journées.
            </p>
          ) : null}

          {user && showBuilder ? (
            <div className="mt-3 space-y-4 rounded-xl border border-border/70 bg-muted/40 p-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`Ma journée à ${city}`}
              />
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note (transport, réservation, repas…)"
                rows={2}
              />

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Choisir les activités ({selected.length})
                </p>
                <ul className="mt-2 max-h-80 space-y-1 overflow-y-auto pr-1">
                  {(places ?? []).map((place) => {
                    const heading = placeTitle(place);
                    const chosen = selection[place.id];
                    return (
                      <li
                        key={place.id}
                        className="rounded-lg border border-border/60 bg-background/70 px-2 py-2"
                      >
                        <label className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={Boolean(chosen)}
                            onChange={() => toggle(place.id)}
                            className="mt-1 size-4 accent-primary"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium">{heading.name}</span>
                            {place.category || place.area ? (
                              <span className="block truncate text-xs text-muted-foreground">
                                {[place.category, place.area].filter(Boolean).join(" · ")}
                              </span>
                            ) : null}
                          </span>
                        </label>
                        {chosen ? (
                          <div className="mt-2 flex flex-wrap gap-1 pl-6">
                            {SLOTS.map((slot) => (
                              <button
                                key={slot}
                                type="button"
                                onClick={() =>
                                  setSelection((prev) => ({ ...prev, [place.id]: slot }))
                                }
                                className={`rounded-full border px-2 py-0.5 text-[11px] ${
                                  chosen === slot
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border text-muted-foreground"
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>

              <Button
                className="w-full"
                disabled={selected.length === 0 || save.isPending}
                onClick={() => save.mutate()}
              >
                {save.isPending ? "Enregistrement…" : "Enregistrer ma fiche"}
              </Button>
            </div>
          ) : null}

          {user && (myPlans?.length ?? 0) > 0 ? (
            <ul className="mt-4 space-y-3">
              {myPlans!.map((plan) => (
                <li key={plan.id} className="rounded-xl border border-border/70 bg-muted/40 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{plan.title}</p>
                      {plan.note ? (
                        <p className="font-serif text-xs italic text-muted-foreground">
                          {plan.note}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      aria-label="Supprimer la fiche"
                      onClick={() => remove.mutate(plan.id)}
                      className="text-muted-foreground"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <ol className="mt-2 space-y-1">
                    {[...plan.items]
                      .sort((a, b) => slotRank(a.slot) - slotRank(b.slot) || a.position - b.position)
                      .map((item) => {
                        const place = byId.get(item.catalog_place_id);
                        return (
                          <li key={item.id} className="flex gap-3 text-sm">
                            <span className="w-24 shrink-0 text-[11px] font-medium uppercase tracking-wide text-primary">
                              {item.slot ?? "—"}
                            </span>
                            <span className="min-w-0 flex-1">
                              {place ? placeTitle(place).name : "Lieu retiré du catalogue"}
                            </span>
                          </li>
                        );
                      })}
                  </ol>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </main>
    </AppShell>
  );
}
