import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Copy, FileText, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useI18n } from "@/lib/i18n";
import {
  CATEGORIES,
  progress,
  shareUrl,
  signPaths,
  uploadPhoto,
  VISIBILITY_LABEL,
  type Place,
  type Trip,
  type Visibility,
} from "@/lib/travel";

export const Route = createFileRoute("/carnet/$id")({
  head: () => ({
    meta: [
      { title: "Carnet de voyage — check-list des lieux" },
      {
        name: "description",
        content:
          "Cochez les lieux visités, ajoutez vos photos et documents de mise en page, puis invitez vos amis à suivre le carnet.",
      },
      { property: "og:title", content: "Carnet de voyage — check-list des lieux" },
      {
        property: "og:description",
        content: "Votre itinéraire en check-list, avec photos, documents et partage aux amis.",
      },
    ],
  }),
  component: TripPage,
});

type TripDocument = {
  id: string;
  trip_id: string;
  name: string;
  file_path: string;
  mime_type: string | null;
  created_at: string;
};

type Member = { id: string; trip_id: string; email: string };

function TripPage() {
  const { id } = Route.useParams();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user } = useSession();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [friendEmail, setFriendEmail] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["trip", id] });

  const { data, isLoading } = useQuery({
    queryKey: ["trip", id],
    queryFn: async () => {
      const [tripRes, placesRes, docsRes, membersRes] = await Promise.all([
        supabase.from("trips").select("*").eq("id", id).maybeSingle(),
        supabase.from("places").select("*").eq("trip_id", id).order("position"),
        supabase.from("trip_documents").select("*").eq("trip_id", id).order("created_at"),
        supabase.from("trip_members").select("id, trip_id, email").eq("trip_id", id),
      ]);
      if (tripRes.error) throw tripRes.error;
      const trip = tripRes.data as Trip | null;
      const places = (placesRes.data ?? []) as Place[];
      const documents = (docsRes.data ?? []) as TripDocument[];
      const members = (membersRes.data ?? []) as Member[];
      const files = await signPaths([
        ...places.map((p) => p.photo_path),
        ...documents.map((d) => d.file_path),
      ]);
      return { trip, places, documents, members, files };
    },
  });

  const addPlace = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("places").insert({
        trip_id: id,
        name: name.trim(),
        area: area.trim() || null,
        note: note.trim() || null,
        category,
        position: (data?.places.length ?? 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setName("");
      setArea("");
      setNote("");
      void invalidate();
    },
    onError: () => toast.error(t("common.error")),
  });

  const toggle = useMutation({
    mutationFn: async (place: Place) => {
      const { error } = await supabase
        .from("places")
        .update({ visited: !place.visited })
        .eq("id", place.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const removePlace = useMutation({
    mutationFn: async (placeId: string) => {
      const { error } = await supabase.from("places").delete().eq("id", placeId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const setVisibility = useMutation({
    mutationFn: async (visibility: Visibility) => {
      const { error } = await supabase.from("trips").update({ visibility }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("common.saved"));
      void invalidate();
    },
  });

  const invite = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("trip_members")
        .insert({ trip_id: id, email: friendEmail.trim().toLowerCase() });
      if (error) throw error;
    },
    onSuccess: () => {
      setFriendEmail("");
      toast.success(t("common.saved"));
      void invalidate();
    },
    onError: () => toast.error(t("common.error")),
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from("trip_members").delete().eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const uploadPlacePhoto = useMutation({
    mutationFn: async ({ place, file }: { place: Place; file: File }) => {
      if (!user) throw new Error("no session");
      const path = await uploadPhoto(file, user.id);
      const { error } = await supabase.from("places").update({ photo_path: path }).eq("id", place.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: () => toast.error(t("common.error")),
  });

  const uploadDoc = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("no session");
      const path = await uploadPhoto(file, user.id);
      const { error } = await supabase.from("trip_documents").insert({
        trip_id: id,
        name: file.name,
        file_path: path,
        mime_type: file.type || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("common.saved"));
      void invalidate();
    },
    onError: () => toast.error(t("common.error")),
  });

  const deleteTrip = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("trips").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void navigate({ to: "/" }),
  });

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  const trip = data?.trip;
  if (!trip) {
    return (
      <div className="grid min-h-screen place-items-center px-8 text-center">
        <div>
          <p className="text-sm text-muted-foreground">{t("public.notFound")}</p>
          <Link to="/" className="mt-4 inline-block text-sm font-semibold text-primary">
            {t("public.backHome")}
          </Link>
        </div>
      </div>
    );
  }

  const places = data.places;
  const isOwner = user?.id === trip.owner_id;
  const done = places.filter((p) => p.visited).length;

  return (
    <AppShell kicker={trip.destination ?? t("home.kicker")} title={trip.title}>
      <section className="px-6">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-baseline justify-between">
            <p className="text-sm text-muted-foreground">
              {done}/{places.length} {t("home.visited")}
            </p>
            <p className="font-serif text-2xl">{progress(places)}%</p>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress(places)}%` }}
            />
          </div>
        </div>
      </section>

      <section className="mt-8 px-6">
        <h2 className="mb-4 text-sm font-semibold tracking-widest uppercase">
          {t("trip.checklist")}
        </h2>
        {places.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("trip.emptyPlaces")}</p>
        ) : (
          <ul className="space-y-3">
            {places.map((place) => (
              <li
                key={place.id}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-card"
              >
                <button
                  type="button"
                  disabled={!isOwner}
                  aria-label={t("trip.markVisited")}
                  onClick={() => toggle.mutate(place)}
                  className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 ${
                    place.visited
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-transparent"
                  }`}
                >
                  <Check className="size-3.5" />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`text-sm font-medium ${place.visited ? "line-through opacity-60" : ""}`}
                    >
                      {place.name}
                    </h3>
                    {place.visited ? <span className="stamp">{t("trip.visitedStamp")}</span> : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {[place.category, place.area].filter(Boolean).join(" · ") || "—"}
                  </p>
                  {place.note ? (
                    <p className="mt-1 font-serif text-sm italic text-muted-foreground">
                      {place.note}
                    </p>
                  ) : null}
                  {place.photo_path && data.files[place.photo_path] ? (
                    <img
                      src={data.files[place.photo_path]}
                      alt={place.name}
                      loading="lazy"
                      className="mt-3 aspect-3/2 w-full rounded-lg object-cover"
                    />
                  ) : null}
                  {isOwner ? (
                    <label className="mt-2 inline-block text-[11px] font-semibold text-primary">
                      {t("trip.photo")}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadPlacePhoto.mutate({ place, file });
                        }}
                      />
                    </label>
                  ) : null}
                </div>

                {isOwner ? (
                  <button
                    type="button"
                    aria-label={t("share.remove")}
                    onClick={() => removePlace.mutate(place.id)}
                    className="text-muted-foreground"
                  >
                    <Trash2 className="size-4" />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {isOwner ? (
        <>
          <section className="mt-8 px-6">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <h2 className="mb-3 font-serif text-lg">{t("trip.addPlace")}</h2>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("trip.placeName")}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
              />
              <input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder={t("trip.area")}
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
              />
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("trip.note")}
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      c === category
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={!name.trim() || addPlace.isPending}
                onClick={() => addPlace.mutate()}
                className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {t("trip.add")}
              </button>
            </div>
          </section>

          <section className="mt-8 px-6">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <h2 className="font-serif text-lg">{t("docs.title")}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{t("docs.hint")}</p>
              {data.documents.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">{t("docs.empty")}</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {data.documents.map((doc) => (
                    <li key={doc.id} className="flex items-center gap-3 text-sm">
                      <FileText className="size-4 text-primary" />
                      <a
                        href={data.files[doc.file_path] ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate underline"
                      >
                        {doc.name}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              <label className="mt-4 block w-full rounded-xl border border-dashed border-border py-3 text-center text-sm font-semibold text-primary">
                {t("docs.import")}
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadDoc.mutate(file);
                  }}
                />
              </label>
            </div>
          </section>

          <section className="mt-8 px-6">
            <div className="rounded-2xl bg-secondary p-6 text-secondary-foreground">
              <h2 className="font-serif text-lg">{t("share.title")}</h2>
              <p className="mt-1 text-sm opacity-80">{t("share.lead")}</p>

              <p className="mt-4 text-[11px] font-semibold tracking-widest uppercase opacity-70">
                {t("share.visibility")}
              </p>
              <div className="mt-2 flex gap-2">
                {(["private", "friends", "public"] as Visibility[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVisibility.mutate(v)}
                    className={`flex-1 rounded-xl px-2 py-2 text-xs font-semibold ${
                      trip.visibility === v ? "bg-card text-secondary" : "bg-card/20"
                    }`}
                  >
                    {VISIBILITY_LABEL[v]}
                  </button>
                ))}
              </div>

              <input
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                placeholder={t("share.emailPlaceholder")}
                className="mt-4 w-full rounded-xl bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground"
              />
              <button
                type="button"
                disabled={!friendEmail.trim() || invite.isPending}
                onClick={() => invite.mutate()}
                className="mt-2 w-full rounded-xl bg-card py-3 text-sm font-semibold text-secondary disabled:opacity-50"
              >
                {t("share.invite")}
              </button>

              {data.members.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {data.members.map((member) => (
                    <li key={member.id} className="flex items-center justify-between text-sm">
                      <span className="truncate">{member.email}</span>
                      <button
                        type="button"
                        onClick={() => removeMember.mutate(member.id)}
                        className="text-xs font-semibold underline"
                      >
                        {t("share.remove")}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(shareUrl(trip.share_slug));
                  toast.success(t("share.copied"));
                }}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-card/40 py-3 text-sm font-semibold"
              >
                <Copy className="size-4" />
                {t("share.copy")}
              </button>
            </div>
          </section>

          <section className="mt-8 px-6">
            <button
              type="button"
              onClick={() => {
                if (window.confirm(t("trip.deleteConfirm"))) deleteTrip.mutate();
              }}
              className="w-full rounded-xl border border-destructive/30 py-3 text-sm font-semibold text-destructive"
            >
              {t("trip.delete")}
            </button>
          </section>
        </>
      ) : null}
    </AppShell>
  );
}
