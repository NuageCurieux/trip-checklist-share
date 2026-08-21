import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Copy, ExternalLink, FileText, Heart, Monitor, Smartphone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PlacesMap } from "@/components/travel/PlacesMap";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useI18n } from "@/lib/i18n";
import { embedMapUrl, externalMapUrl, providerForCountry, providerLabel } from "@/lib/mapProviders";
import {
  progress,
  shareUrl,
  signPaths,
  VISIBILITY_LABEL,
  type Place,
  type Trip,
} from "@/lib/travel";

export const Route = createFileRoute("/apercu/$id")({
  head: () => ({
    meta: [
      { title: "Aperçu du carnet avant partage — Carnets" },
      {
        name: "description",
        content:
          "Visualisez votre carnet complet — lieux, parcs, cartes, photos et documents — exactement comme vos amis le verront avant de partager le lien.",
      },
      { property: "og:title", content: "Aperçu du carnet avant partage" },
      {
        property: "og:description",
        content: "Le rendu final de votre carnet de voyage : check-list, cartes et documents.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PreviewPage,
});

type TripDocument = { id: string; name: string; path: string; kind: string };

function PreviewPage() {
  const { t } = useI18n();
  const [mobile, setMobile] = useState(true);

  return (
    <div className={mobile ? "min-h-screen bg-muted" : "min-h-screen bg-background"}>
      <div className="mx-auto flex max-w-[430px] items-center justify-between gap-3 px-4 pt-4 sm:max-w-none">
        <p className="text-xs text-muted-foreground">{mobile ? t("prev.mobileHint") : ""}</p>
        <button
          type="button"
          onClick={() => setMobile((v) => !v)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold shadow-card"
        >
          {mobile ? <Monitor className="size-3.5" /> : <Smartphone className="size-3.5" />}
          {mobile ? t("prev.fullMode") : t("prev.mobileMode")}
        </button>
      </div>

      {mobile ? (
        <div className="flex justify-center px-2 py-4">
          <div className="h-[844px] w-[390px] max-w-full overflow-y-auto rounded-[2.25rem] border-[6px] border-foreground/80 bg-background shadow-card">
            <PreviewContent />
          </div>
        </div>
      ) : (
        <PreviewContent />
      )}
    </div>
  );
}

function PreviewContent() {
  const { id } = Route.useParams();
  const { t } = useI18n();
  const { user } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ["preview", id],
    queryFn: async () => {
      const [tripRes, placesRes, docsRes, membersRes] = await Promise.all([
        supabase.from("trips").select("*").eq("id", id).maybeSingle(),
        supabase.from("places").select("*").eq("trip_id", id).order("position"),
        supabase.from("trip_documents").select("id, name, path, kind").eq("trip_id", id),
        supabase.from("trip_members").select("id, email").eq("trip_id", id),
      ]);
      if (tripRes.error) throw tripRes.error;
      const trip = tripRes.data as Trip | null;
      const places = (placesRes.data ?? []) as Place[];
      const documents = (docsRes.data ?? []) as TripDocument[];
      const members = (membersRes.data ?? []) as { id: string; email: string }[];
      const files = await signPaths([
        trip?.cover_path ?? null,
        ...places.map((p) => p.photo_path),
        ...documents.map((d) => d.path),
      ]);
      return { trip, places, documents, members, files };
    },
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
  const cover = trip.cover_path ? data.files[trip.cover_path] : trip.cover_url;
  const provider = providerForCountry(trip.destination);
  const isOwner = user?.id === trip.owner_id;
  const done = places.filter((p) => p.visited).length;

  return (
    <div className="min-h-screen bg-background pb-16 text-foreground">
      <header className="px-6 pt-8">
        <p className="kicker">{t("prev.kicker")}</p>
        <h1 className="mt-1 font-serif text-3xl italic">{trip.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {trip.destination ?? "—"} · {VISIBILITY_LABEL[trip.visibility]}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">{t("prev.lead")}</p>
        {!isOwner ? (
          <p className="mt-2 text-xs text-muted-foreground">{t("prev.notOwner")}</p>
        ) : null}
      </header>

      {cover ? (
        <div className="mt-6 px-6">
          <img
            src={cover}
            alt={trip.title}
            loading="lazy"
            className="aspect-4/5 w-full rounded-2xl object-cover outline outline-offset-[-1px] outline-foreground/5"
          />
        </div>
      ) : null}

      <section className="mt-6 px-6">
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
        <h2 className="mb-4 text-sm font-semibold tracking-widest uppercase">{t("map.title")}</h2>
        <PlacesMap
          points={places.map((place) => ({
            id: place.id,
            name: place.name,
            lat: place.lat,
            lng: place.lng,
            visited: place.visited,
            favorite: place.favorite,
          }))}
          country={trip.destination}
          city={trip.destination}
        />
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
                className="rounded-xl border border-border bg-card p-4 shadow-card"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 ${
                      place.visited
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-transparent"
                    }`}
                  >
                    <Check className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm font-medium ${place.visited ? "opacity-70" : ""}`}>
                        {place.name}
                      </h3>
                      {place.favorite ? (
                        <Heart className="size-3.5 fill-primary text-primary" />
                      ) : null}
                      {place.visited ? (
                        <span className="stamp">{t("trip.visitedStamp")}</span>
                      ) : null}
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
                    {place.lat != null && place.lng != null ? (
                      <div className="mt-3">
                        <iframe
                          title={`${t("map.preview")} — ${place.name}`}
                          src={embedMapUrl(place.lat, place.lng)}
                          loading="lazy"
                          className="h-40 w-full rounded-lg border border-border"
                        />
                        <a
                          href={externalMapUrl(provider, {
                            name: place.name,
                            lat: place.lat,
                            lng: place.lng,
                          })}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary"
                        >
                          <ExternalLink className="size-3.5" />
                          {t("map.openIn")} {providerLabel(provider)}
                        </a>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground">{t("map.noCoords")}</p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 px-6">
        <h2 className="mb-4 text-sm font-semibold tracking-widest uppercase">{t("prev.docs")}</h2>
        {data.documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("docs.empty")}</p>
        ) : (
          <ul className="space-y-2">
            {data.documents.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 text-sm">
                <FileText className="size-4 text-primary" />
                <a
                  href={data.files[doc.path] ?? "#"}
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
      </section>

      {isOwner ? (
        <section className="mt-8 px-6">
          <div className="rounded-2xl bg-secondary p-6 text-secondary-foreground">
            <h2 className="font-serif text-lg">{t("prev.friends")}</h2>
            {data.members.length === 0 ? (
              <p className="mt-2 text-sm opacity-80">{t("prev.noFriends")}</p>
            ) : (
              <ul className="mt-3 space-y-1 text-sm">
                {data.members.map((m) => (
                  <li key={m.id} className="truncate">
                    {m.email}
                  </li>
                ))}
              </ul>
            )}
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
      ) : null}

      <footer className="mt-10 px-6 text-center">
        <Link
          to="/carnet/$id"
          params={{ id }}
          className="text-sm font-semibold text-primary underline"
        >
          {t("prev.backToTrip")}
        </Link>
      </footer>
    </div>
  );
}
