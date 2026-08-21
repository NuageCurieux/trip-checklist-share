import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";

import { LanguageSwitcher } from "@/components/AppShell";
import { AccessRequest } from "@/components/travel/AccessRequest";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { signAvatar, signPaths } from "@/lib/travel";

export const Route = createFileRoute("/voyageur/$handle")({
  head: () => ({
    meta: [
      { title: "Espace voyageur — carnets de voyage partagés" },
      {
        name: "description",
        content:
          "La page publique d'un voyageur : ses carnets de voyage partagés, accessibles après validation de sa part.",
      },
      { property: "og:title", content: "Espace voyageur — carnets de voyage partagés" },
      {
        property: "og:description",
        content: "Découvrez les carnets de voyage d'un voyageur et demandez l'accès à ses lieux.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TravellerProfile,
});

type Preview = {
  id: string;
  title: string;
  destination: string | null;
  cover_path: string | null;
  cover_url: string | null;
  share_slug: string | null;
  place_count: number;
  unlocked: boolean;
};

function TravellerProfile() {
  const { handle } = Route.useParams();
  const { t } = useI18n();

  const { data, isLoading } = useQuery({
    queryKey: ["traveller", handle],
    queryFn: async () => {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, handle, display_name, bio, instagram, avatar_path, is_public")
        .ilike("handle", handle)
        .maybeSingle();
      if (error) throw error;
      if (!profile)
        return {
          profile: null,
          previews: [] as Preview[],
          files: {} as Record<string, string>,
          avatarUrl: null as string | null,
        };
      const avatarUrl = await signAvatar((profile as { avatar_path: string | null }).avatar_path);

      const { data: previews, error: previewError } = await supabase.rpc("profile_trip_previews", {
        _handle: handle,
      });
      if (previewError) throw previewError;
      const list = (previews ?? []) as Preview[];
      const files = await signPaths(list.map((p) => p.cover_path));
      return { profile, previews: list, files, avatarUrl };
    },
  });

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  const profile = data?.profile;
  if (!profile) {
    return (
      <div className="grid min-h-screen place-items-center px-8 text-center">
        <div>
          <p className="text-sm text-muted-foreground">{t("profile.notFound")}</p>
          <Link to="/" className="mt-4 inline-block text-sm font-semibold text-primary">
            {t("public.backHome")}
          </Link>
        </div>
      </div>
    );
  }

  const previews = data.previews;

  return (
    <div className="min-h-screen bg-background pb-14 text-foreground">
      <header className="flex items-start justify-between px-6 pt-8">
        <div className="flex min-w-0 items-center gap-3">
          {data.avatarUrl ? (
            <img
              src={data.avatarUrl}
              alt={profile.display_name}
              className="size-14 shrink-0 rounded-full border border-border object-cover"
            />
          ) : null}
          <div className="min-w-0">
          <p className="kicker">{t("profile.kicker")}</p>
          <h1 className="mt-1 font-serif text-3xl italic">{profile.display_name}</h1>
          {profile.instagram ? (
            <p className="mt-1 text-sm text-muted-foreground">@{profile.instagram}</p>
          ) : null}
          </div>
        </div>
        <LanguageSwitcher />
      </header>

      {profile.bio ? (
        <p className="mt-4 px-6 font-serif text-base italic text-muted-foreground">{profile.bio}</p>
      ) : null}

      <section className="mt-8 px-6">
        <h2 className="mb-4 text-sm font-semibold tracking-widest uppercase">
          {t("profile.notebooks")}
        </h2>
        {previews.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("profile.emptyNotebooks")}</p>
        ) : (
          <ul className="space-y-4">
            {previews.map((preview) => {
              const cover = preview.cover_path
                ? data.files[preview.cover_path]
                : preview.cover_url;
              return (
                <li
                  key={preview.id}
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
                >
                  {cover ? (
                    <img
                      src={cover}
                      alt={preview.title}
                      loading="lazy"
                      className={`aspect-3/2 w-full object-cover ${preview.unlocked ? "" : "blur-[2px] saturate-50"}`}
                    />
                  ) : null}
                  <div className="p-4">
                    <h3 className="font-serif text-lg italic">{preview.title}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {[preview.destination, `${preview.place_count} ${t("home.places")}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {preview.unlocked && preview.share_slug ? (
                      <Link
                        to="/partage/$slug"
                        params={{ slug: preview.share_slug }}
                        className="mt-3 inline-flex rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
                      >
                        {t("profile.open")}
                      </Link>
                    ) : (
                      <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground">
                        <Lock className="size-3" />
                        {t("profile.locked")}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-8 px-6">
        <AccessRequest ownerId={profile.id} />
      </section>

      <footer className="mt-10 px-6 text-center">
        <Link to="/" className="text-sm font-semibold text-primary">
          {t("public.backHome")}
        </Link>
      </footer>
    </div>
  );
}
