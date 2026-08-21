import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { LanguageSwitcher } from "@/components/AppShell";
import { PublicPageEditor } from "@/components/travel/PublicPageEditor";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useI18n } from "@/lib/i18n";
import { defaultCoverFor } from "@/lib/defaultCover";
import { signPaths, type Trip } from "@/lib/travel";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [
      { title: "Mon profil voyageur — Carnets" },
      {
        name: "description",
        content:
          "Créez votre profil voyageur : surnom, photo, profil public ou privé, et retrouvez tous vos carnets de voyage.",
      },
      { property: "og:title", content: "Mon profil voyageur — Carnets" },
      {
        property: "og:description",
        content: "Surnom, photo de profil et liste de vos carnets de voyage à partager.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyProfilePage,
});

function MyProfilePage() {
  const { t } = useI18n();
  const { user, loading } = useSession();

  const { data } = useQuery({
    queryKey: ["my-trips", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data: trips, error } = await supabase
        .from("trips")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const list = (trips ?? []) as unknown as Trip[];
      const covers = await signPaths(list.map((trip) => trip.cover_path));
      return { list, covers };
    },
  });

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-14 text-foreground">
      <header className="flex items-end justify-between px-6 pt-8 pb-6">
        <div className="min-w-0">
          <p className="kicker mb-1">{t("me.kicker")}</p>
          <h1 className="truncate font-serif text-3xl italic">{t("me.title")}</h1>
        </div>
        <LanguageSwitcher />
      </header>

      <p className="px-6 text-sm text-muted-foreground">{t("me.lead")}</p>

      {!user ? (
        <div className="mt-8 px-6">
          <p className="text-sm text-muted-foreground">{t("me.needAccount")}</p>
          <Link
            to="/auth"
            className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            {t("auth.signUp")}
          </Link>
        </div>
      ) : (
        <>
          <section className="mt-6 px-6">
            <PublicPageEditor userId={user.id} />
          </section>

          <section className="mt-8 px-6">
            <h2 className="mb-4 text-sm font-semibold tracking-widest uppercase">
              {t("me.myNotebooks")}
            </h2>
            {(data?.list.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">{t("me.emptyNotebooks")}</p>
            ) : (
              <ul className="space-y-4">
                {data?.list.map((trip) => (
                  <li
                    key={trip.id}
                    className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
                  >
                    <img
                      src={
                        (trip.cover_path ? data.covers[trip.cover_path] : trip.cover_url) ??
                        defaultCoverFor(trip.destination)
                      }
                      alt={trip.title}
                      loading="lazy"
                      className="aspect-3/2 w-full object-cover"
                    />
                    <div className="flex items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <h3 className="truncate font-serif text-lg italic">{trip.title}</h3>
                        {trip.destination ? (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {trip.destination}
                          </p>
                        ) : null}
                      </div>
                      <Link
                        to="/carnet/$id"
                        params={{ id: trip.id }}
                        className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-semibold"
                      >
                        {t("profile.open")}
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-8 space-y-3 px-6">
            <Link
              to="/unlock"
              className="block rounded-full bg-primary py-3 text-center text-sm font-semibold text-primary-foreground"
            >
              {t("me.continue")}
            </Link>
          </section>
        </>
      )}
    </div>
  );
}
