import { useState } from "react";
import { createFileRoute, useRouter, redirect, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Lock, MapPin, Instagram } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { unlockSite, checkGate, getGatePreview } from "@/lib/gate.functions";
import { useI18n } from "@/lib/i18n";
import { signAvatar, signPaths } from "@/lib/travel";
import coverKorea from "@/assets/cover-korea.jpg";

export const Route = createFileRoute("/unlock")({
  head: () => ({
    meta: [
      { title: "Accès privé — Carnets" },
      {
        name: "description",
        content: "Cette application est réservée aux personnes invitées. Saisissez le mot de passe pour entrer.",
      },
      { property: "og:title", content: "Accès privé — Carnets" },
      {
        property: "og:description",
        content: "Cette application est réservée aux personnes invitées. Saisissez le mot de passe pour entrer.",
      },
    ],
  }),
  beforeLoad: async () => {
    const { unlocked } = await checkGate();
    if (unlocked) {
      throw redirect({ to: "/" });
    }
  },
  component: UnlockPage,
});

type Preview = {
  id: string;
  title: string;
  destination: string | null;
  cover_path: string | null;
  cover_url: string | null;
  share_slug: string;
  place_count: number;
  owner_handle: string;
  owner_name: string;
};

function UnlockPage() {
  const { t } = useI18n();
  const router = useRouter();
  const unlock = useServerFn(unlockSite);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: preview } = useQuery({
    queryKey: ["gate-preview"],
    queryFn: async () => {
      const { featured, previews } = await getGatePreview({ data: undefined });
      const avatarUrl = await signAvatar(featured?.avatar_path ?? null);
      const files = await signPaths(previews.map((p: Preview) => p.cover_path));
      return { featured, previews, files, avatarUrl };
    },
  });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Read the DOM value: browser autofill / paste can set the input without
    // firing React's onChange, which used to leave the password state empty.
    const formValue = String(new FormData(e.currentTarget).get("password") ?? "");
    const candidate = (formValue || password).trim();
    if (!candidate) {
      setError(true);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const { ok } = await unlock({ data: { password: candidate } });
      if (ok) {
        await router.invalidate();
        await router.navigate({ to: "/" });
        return;
      }
    } catch {
      // Network hiccup or server reload: show the generic error instead of crashing.
    }
    setError(true);
    setLoading(false);
  }

  const featured = preview?.featured;
  const previews = preview?.previews ?? [];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* Background hero with Korea image and soft pastel overlays */}
      <div className="absolute inset-0 z-0">
        <img
          src={coverKorea}
          alt="Corée du Sud"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/60 to-background/95" />
        <div className="absolute inset-0 bg-gradient-to-br from-rose-100/30 via-transparent to-sky-100/20" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-md flex-col px-6 pb-12 pt-10">
        {/* Top lock icon + title */}
        <div className="flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-white/70 shadow-card backdrop-blur-md text-primary">
            <Lock className="size-6" />
          </div>
          <h1 className="mt-4 font-serif text-3xl italic">{t("gate.welcome")}</h1>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {t("gate.tagline")}
          </p>
        </div>

        {/* Password form */}
        {/* method="post" so a pre-hydration submit never puts the password in the URL */}
        <form method="post" onSubmit={onSubmit} className="mt-6 space-y-3 rounded-2xl border border-border/60 bg-white/80 p-5 shadow-card backdrop-blur-xl">
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("gate.placeholder")}
            className="w-full rounded-xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {error ? (
            <p className="text-center text-sm text-destructive">{t("gate.error")}</p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? t("common.loading") : t("gate.cta")}
          </button>
        </form>

        {/* Featured profile card */}
        <section className="mt-6 rounded-2xl border border-border/60 bg-white/85 p-5 shadow-card backdrop-blur-xl">
          {featured ? (
            <div className="flex items-start gap-4">
              <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-background">
                {preview?.avatarUrl ? (
                  <img
                    src={preview.avatarUrl}
                    alt={featured.display_name}
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="font-serif text-2xl italic text-muted-foreground">
                    {featured.display_name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="kicker">{t("profile.kicker")}</p>
                <h2 className="mt-0.5 font-serif text-xl italic">{featured.display_name}</h2>
                <p className="truncate text-sm text-muted-foreground">@{featured.handle}</p>
                {featured.bio ? (
                  <p className="mt-2 text-sm leading-relaxed text-foreground/80">{featured.bio}</p>
                ) : null}
                {featured.instagram ? (
                  <a
                    href={`https://instagram.com/${featured.instagram}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
                  >
                    <Instagram className="size-4" />@{featured.instagram}
                  </a>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="kicker">{t("profile.kicker")}</p>
              <h2 className="mt-1 font-serif text-xl italic">Carnets</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t("gate.tagline")}</p>
            </div>
          )}
        </section>

        {/* Feed preview of public notebooks */}
        <section className="mt-6">
          <h2 className="mb-3 text-center font-serif text-xl italic">{t("gate.feedTitle")}</h2>
          {previews.length === 0 ? (
            <p className="rounded-2xl border border-border/60 bg-white/70 p-5 text-center text-sm text-muted-foreground backdrop-blur-xl">
              {t("gate.emptyFeed")}
            </p>
          ) : (
            <ul className="space-y-4">
              {previews.map((trip: Preview) => {
                const cover = trip.cover_path
                  ? preview?.files[trip.cover_path]
                  : trip.cover_url ?? coverKorea;
                return (
                  <li
                    key={trip.id}
                    className="overflow-hidden rounded-2xl border border-border/60 bg-white/85 shadow-card backdrop-blur-xl"
                  >
                    {cover ? (
                      <img
                        src={cover}
                        alt={trip.title}
                        loading="lazy"
                        className="aspect-3/2 w-full object-cover"
                      />
                    ) : null}
                    <div className="p-4">
                      <h3 className="font-serif text-lg italic">{trip.title}</h3>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" />
                        {[trip.destination, `${trip.place_count} ${t("home.places")}`]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {t("gate.by")} {trip.owner_name || trip.owner_handle}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Account actions */}
        <div className="mt-6 rounded-2xl border border-border/60 bg-white/80 p-5 text-center shadow-card backdrop-blur-xl">
          <p className="text-sm text-muted-foreground">{t("gate.orCreate")}</p>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="mt-3 block w-full rounded-xl bg-secondary py-3 text-sm font-semibold text-secondary-foreground"
          >
            {t("gate.createAccount")}
          </Link>
          <Link to="/auth" className="mt-3 block text-xs font-semibold text-primary">
            {t("gate.signIn")}
          </Link>
        </div>
      </div>
    </div>
  );
}
