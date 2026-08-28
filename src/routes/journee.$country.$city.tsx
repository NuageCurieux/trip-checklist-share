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
  const plansQuery = cityDayPlansQuery(country, city, Boolean(user));
  const { data: plans } = useQuery(plansQuery);

  const [openPlan, setOpenPlan] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [showBuilder, setShowBuilder] = useState(false);
  const [addingTo, setAddingTo] = useState<string | null>(null);

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

  const todo = (plans ?? []).filter((plan) => !plan.done);
  const finished = (plans ?? []).filter((plan) => plan.done);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: plansQuery.queryKey });
    queryClient.invalidateQueries({ queryKey: ["day-plans-all"] });
  }

  const save = useMutation({
    mutationFn: () =>
      createDayPlan({
        country,
        city,
        title: title.trim() || `Ma journée à ${city}`,
        note: note.trim() || null,
        plannedDate: date || null,
        shared: true,
        selection: selected,
      }),
    onSuccess: () => {
      toast.success("Liste enregistrée et partagée");
      setTitle("");
      setNote("");
      setDate("");
      setSelection({});
      setShowBuilder(false);
      refresh();
    },
    onError: () => toast.error("Impossible d'enregistrer la liste"),
  });

  const patch = useMutation({
    mutationFn: (input: {
      id: string;
      patch: { planned_date?: string | null; done?: boolean; title?: string };
    }) => updateDayPlan(input.id, input.patch),
    onSuccess: refresh,
    onError: () => toast.error("Modification impossible"),
  });

  const addStep = useMutation({
    mutationFn: (input: { planId: string; placeId: string }) =>
      addDayPlanItem(input.planId, input.placeId, "Matin"),
    onSuccess: () => {
      toast.success("Activité ajoutée");
      refresh();
    },
    onError: () => toast.error("Ajout impossible"),
  });

  const removeStep = useMutation({
    mutationFn: (itemId: string) => removeDayPlanItem(itemId),
    onSuccess: refresh,
    onError: () => toast.error("Suppression impossible"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteDayPlan(id),
    onSuccess: () => {
      toast.success("Liste supprimée");
      refresh();
    },
    onError: () => toast.error("Seule la créatrice peut supprimer cette liste"),
  });

  function toggle(placeId: string) {
    setSelection((prev) => {
      const next = { ...prev };
      if (next[placeId]) delete next[placeId];
      else next[placeId] = "Matin";
      return next;
    });
  }

  function renderPlan(plan: DayPlanWithItems) {
    const mine = plan.owner_id === user?.id;
    const adding = addingTo === plan.id;
    return (
      <li key={plan.id} className="rounded-xl border border-border/70 bg-muted/40 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">{plan.title}</p>
            {plan.note ? (
              <p className="font-serif text-xs italic text-muted-foreground">{plan.note}</p>
            ) : null}
            <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              {plan.shared ? (
                <span className="inline-flex items-center gap-1">
                  <Users className="size-3" />
                  Liste partagée
                </span>
              ) : null}
              {mine ? <span>· la vôtre</span> : null}
            </p>
          </div>
          {mine ? (
            <button
              type="button"
              aria-label="Supprimer la liste"
              onClick={() => remove.mutate(plan.id)}
              className="text-muted-foreground"
            >
              <Trash2 className="size-4" />
            </button>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <CalendarDays className="size-3" />
            <input
              type="date"
              value={plan.planned_date ?? ""}
              onChange={(e) =>
                patch.mutate({ id: plan.id, patch: { planned_date: e.target.value || null } })
              }
              className="rounded-md border border-border bg-background px-2 py-1 text-xs"
            />
          </label>
          {plan.planned_date ? (
            <span className="text-[11px] text-muted-foreground">
              {formatPlanDate(plan.planned_date)}
            </span>
          ) : null}
          <Button
            size="sm"
            variant={plan.done ? "default" : "secondary"}
            onClick={() => patch.mutate({ id: plan.id, patch: { done: !plan.done } })}
          >
            <Check className="mr-1 size-4" />
            {plan.done ? "Déjà fait" : "Marquer comme fait"}
          </Button>
        </div>

        <ol className="mt-3 space-y-1">
          {[...plan.items]
            .sort((a, b) => slotRank(a.slot) - slotRank(b.slot) || a.position - b.position)
            .map((item) => {
              const place = byId.get(item.catalog_place_id);
              return (
                <li key={item.id} className="flex items-start gap-3 text-sm">
                  <span className="w-24 shrink-0 text-[11px] font-medium uppercase tracking-wide text-primary">
                    {item.slot ?? "—"}
                  </span>
                  <span className="min-w-0 flex-1">
                    {place ? placeTitle(place).name : "Lieu retiré du catalogue"}
                  </span>
                  <button
                    type="button"
                    aria-label="Retirer l'activité"
                    onClick={() => removeStep.mutate(item.id)}
                    className="text-muted-foreground"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              );
            })}
        </ol>

        <button
          type="button"
          onClick={() => setAddingTo(adding ? null : plan.id)}
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary"
        >
          <Plus className="size-3.5" />
          {adding ? "Fermer" : "Ajouter une activité"}
        </button>

        {adding ? (
          <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto pr-1">
            {(places ?? []).map((place) => (
              <li key={place.id}>
                <button
                  type="button"
                  onClick={() => addStep.mutate({ planId: plan.id, placeId: place.id })}
                  className="w-full rounded-lg border border-border/60 bg-background/70 px-2 py-2 text-left text-sm"
                >
                  {placeTitle(place).name}
                  {place.area ? (
                    <span className="block text-xs text-muted-foreground">{place.area}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </li>
    );
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
            <h2 className="font-serif text-sm italic text-foreground">Listes à faire</h2>
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
              pour voir et composer les listes partagées.
            </p>
          ) : null}

          {user && showBuilder ? (
            <div className="mt-3 space-y-4 rounded-xl border border-border/70 bg-muted/40 p-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`Ma journée à ${city}`}
              />
              <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Date prévue
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm normal-case tracking-normal text-foreground"
                />
              </label>
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

              <p className="text-xs text-muted-foreground">
                Cette liste sera visible et modifiable par les autres voyageurs connectés.
              </p>

              <Button
                className="w-full"
                disabled={selected.length === 0 || save.isPending}
                onClick={() => save.mutate()}
              >
                {save.isPending ? "Enregistrement…" : "Enregistrer et partager"}
              </Button>
            </div>
          ) : null}

          {user ? (
            todo.length > 0 ? (
              <ul className="mt-4 space-y-3">{todo.map(renderPlan)}</ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Aucune liste en cours pour {city}.
              </p>
            )
          ) : null}
        </section>

        {user && finished.length > 0 ? (
          <section className="mt-8">
            <h2 className="font-serif text-sm italic text-foreground">
              Déjà fait · visité ({finished.length})
            </h2>
            <ul className="mt-3 space-y-3 opacity-80">{finished.map(renderPlan)}</ul>
          </section>
        ) : null}
      </main>
    </AppShell>
  );
}

