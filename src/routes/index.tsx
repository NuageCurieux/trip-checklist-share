import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import coverDefault from "@/assets/cover-calanques.jpg";
import { AppShell, LanguageSwitcher } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useI18n } from "@/lib/i18n";
import { defaultCoverFor } from "@/lib/defaultCover";
import { progress, signPaths, VISIBILITY_LABEL, type Place, type Trip } from "@/lib/travel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Carnets — check-lists de voyage à partager" },
      {
        name: "description",
        content:
          "Listez les lieux à visiter, cochez-les pendant le voyage, ajoutez vos photos et partagez le carnet avec vos amis ou en public.",
      },
      { property: "og:title", content: "Carnets — check-lists de voyage à partager" },
      {
        property: "og:description",
        content:
          "Vos lieux à visiter en check-list, avec photos, partagés par lien privé à vos amis ou publiés pour tous.",
      },
    ],
  }),
  component: Home,
});

type TripWithPlaces = Trip & { places: Place[] };

function defaultCoverFor(destination?: string | null) {
  const d = (destination ?? "").toLowerCase();
  if (["corée du sud", "south korea", "korea", "corée", "korean", "séoul", "seoul"].some((k) => d.includes(k))) {
    return coverKorea;
  }
  return coverDefault;
}

function Home() {
  const { user, loading } = useSession();
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  return user ? <TravellerFeed /> : <Landing />;
}

function Landing() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  function openShared() {
    const slug = code.trim().split("/").pop();
    if (!slug) return;
    navigate({ to: "/partage/$slug", params: { slug } });
  }

  return (
    <div className="min-h-screen bg-background pb-12 text-foreground">
      <header className="flex items-start justify-between px-6 pt-8">
        <p className="kicker">{t("landing.kicker")}</p>
        <LanguageSwitcher />
      </header>

      <div className="px-6 pt-6">
        <div className="relative">
          <img
            src={coverDefault}
            alt="Crique méditerranéenne aux eaux turquoise"
            width={800}
            height={1008}
            className="aspect-4/5 w-full rounded-2xl object-cover outline outline-offset-[-1px] outline-foreground/5"
          />
          <div className="absolute inset-x-4 bottom-4 rounded-xl bg-card/90 p-4 shadow-card backdrop-blur-md">
            <h1 className="font-serif text-2xl leading-tight">{t("landing.title")}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("landing.lead")}
            </p>
          </div>
        </div>
      </div>

      <section className="mt-8 space-y-3 px-6">
        <Link
          to="/auth"
          className="block rounded-xl border border-border bg-card p-5 shadow-card"
        >
          <h2 className="font-serif text-lg">{t("landing.traveler")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("landing.travelerHint")}</p>
        </Link>

        <div className="rounded-2xl bg-secondary p-6 text-secondary-foreground">
          <h2 className="font-serif text-lg">{t("landing.visitor")}</h2>
          <p className="mt-1 text-sm opacity-80">{t("landing.visitorHint")}</p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t("landing.linkPlaceholder")}
            className="mt-4 w-full rounded-xl bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={openShared}
            className="mt-3 w-full rounded-xl bg-card py-3 text-sm font-semibold text-secondary"
          >
            {t("landing.open")}
          </button>
        </div>
      </section>
    </div>
  );
}

function TravellerFeed() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const { data: trips, error } = await supabase
        .from("trips")
        .select("*, places(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const list = (trips ?? []) as unknown as TripWithPlaces[];
      const covers = await signPaths(list.map((tr) => tr.cover_path));
      return { list, covers };
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("trips")
        .insert({ title: title.trim(), destination: destination.trim() || null });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle("");
      setDestination("");
      toast.success(t("common.saved"));
      void queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
    onError: () => toast.error(t("common.error")),
  });

  const trips = data?.list ?? [];
  const featured = trips[0];

  return (
    <AppShell kicker={t("home.kicker")} title={t("home.title")}>
      {featured ? (
        <div className="px-6">
          <Link
            to="/carnet/$id"
            params={{ id: featured.id }}
            className="relative block"
          >
            <img
              src={data?.covers[featured.cover_path ?? ""] ?? defaultCoverFor(featured.destination)}
              alt={featured.title}
              width={800}
              height={1008}
              className="aspect-4/5 w-full rounded-2xl object-cover outline outline-offset-[-1px] outline-foreground/5"
            />
            <div className="absolute inset-x-4 bottom-4 rounded-xl bg-card/90 p-4 shadow-card backdrop-blur-md">
              <div className="mb-2 flex items-start justify-between gap-3">
                <h2 className="font-serif text-xl">{featured.title}</h2>
                <span className="rounded-full bg-secondary/10 px-2 py-1 text-[10px] font-semibold uppercase text-secondary">
                  {VISIBILITY_LABEL[featured.visibility]}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {featured.destination ?? "—"} · {featured.places.length} {t("home.places")} ·{" "}
                {progress(featured.places)}% {t("home.visited")}
              </p>
            </div>
          </Link>
        </div>
      ) : null}

      <section className="mt-8 px-6">
        <h3 className="mb-4 text-sm font-semibold tracking-widest uppercase">
          {t("nav.notebooks")}
        </h3>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : trips.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("home.empty")}</p>
        ) : (
          <div className="space-y-3">
            {trips.map((trip) => (
              <Link
                key={trip.id}
                to="/carnet/$id"
                params={{ id: trip.id }}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card"
              >
                <div className="flex-1">
                  <h4 className="text-sm font-medium">{trip.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {trip.destination ?? "—"} · {trip.places.length} {t("home.places")}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-primary">
                  {progress(trip.places)}%
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section id="nouveau" className="mt-8 px-6">
        <div className="rounded-2xl bg-secondary p-6 text-secondary-foreground">
          <h3 className="mb-3 font-serif text-lg">{t("home.createTitle")}</h3>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("home.titlePlaceholder")}
            className="w-full rounded-xl bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground"
          />
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder={t("home.destinationPlaceholder")}
            className="mt-2 w-full rounded-xl bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground"
          />
          <button
            type="button"
            disabled={!title.trim() || create.isPending}
            onClick={() => create.mutate()}
            className="mt-3 w-full rounded-xl bg-card py-3 text-sm font-semibold text-secondary disabled:opacity-50"
          >
            {t("home.create")}
          </button>
        </div>
      </section>
    </AppShell>
  );
}
