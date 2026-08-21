import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bell, Plus } from "lucide-react";
import type { ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useI18n, type Lang } from "@/lib/i18n";

const LANGS: Lang[] = ["fr", "en", "es"];

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-card px-1 py-0.5">
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={l === lang}
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight transition-colors ${
            l === lang ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function NotificationsBell() {
  const { t } = useI18n();
  const { user } = useSession();

  const { data: unread } = useQuery({
    queryKey: ["notifications-unread"],
    enabled: Boolean(user),
    queryFn: async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .is("read_at", null);
      if (error) throw error;
      return count ?? 0;
    },
  });

  if (!user) return null;

  return (
    <Link
      to="/notifications"
      aria-label={t("notif.title")}
      className="relative rounded-full border border-border bg-card p-2"
    >
      <Bell className="size-4" />
      {unread ? (
        <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Link>
  );
}

export function AppShell({
  kicker,
  title,
  right,
  children,
  showNav = true,
}: {
  kicker: string;
  title: string;
  right?: ReactNode;
  children: ReactNode;
  showNav?: boolean;
}) {
  const { t } = useI18n();

  return (
    <div className={`min-h-screen bg-background text-foreground ${showNav ? "pb-24" : "pb-10"}`}>
      <header className="flex items-end justify-between px-6 pt-8 pb-6">
        <div className="min-w-0">
          <p className="kicker mb-1">{kicker}</p>
          <h1 className="truncate font-serif text-3xl italic">{title}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">{right ?? <LanguageSwitcher />}</div>
      </header>

      {children}

      {showNav ? (
        <nav className="fixed inset-x-0 bottom-0 flex h-16 items-center justify-around border-t border-border bg-card px-6">
          <Link
            to="/"
            className="flex flex-col items-center gap-1"
            activeProps={{ className: "text-primary" }}
          >
            <span className="text-[10px] font-bold tracking-tight uppercase">
              {t("nav.notebooks")}
            </span>
          </Link>
          <Link
            to="/favoris"
            className="flex flex-col items-center gap-1"
            activeProps={{ className: "text-primary" }}
          >
            <span className="text-[10px] font-bold tracking-tight uppercase">
              {t("nav.favorites")}
            </span>
          </Link>
          <Link
            to="/"
            hash="nouveau"
            aria-label={t("nav.new")}
            className="-mt-10 flex size-12 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-card"
          >
            <Plus className="size-5" />
          </Link>
          <Link
            to="/corrections"
            className="flex flex-col items-center gap-1"
            activeProps={{ className: "text-primary" }}
          >
            <span className="text-[10px] font-bold tracking-tight uppercase">
              {t("nav.corrections")}
            </span>
          </Link>
          <Link to="/compte" className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold tracking-tight uppercase">
              {t("nav.account")}
            </span>
          </Link>
        </nav>
      ) : null}
    </div>
  );
}
