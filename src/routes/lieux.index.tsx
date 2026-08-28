import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { countriesQuery } from "@/lib/catalog";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/lieux/")({
  component: CountriesPage,
  head: () => ({
    meta: [
      { title: "Lieux à visiter par pays — Carnets" },
      {
        name: "description",
        content:
          "Choisissez un pays pour découvrir ses villes et les lieux à visiter : Corée du Sud, France, Espagne, Portugal, Italie, Maroc.",
      },
      { property: "og:title", content: "Lieux à visiter par pays — Carnets" },
      {
        property: "og:description",
        content: "Un pays, puis une ville, puis les activités : le catalogue de lieux des Carnets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function CountriesPage() {
  const { t } = useI18n();
  const { data: countries, isLoading } = useQuery(countriesQuery());

  return (
    <AppShell kicker={t("discover.catalog")} title="Pays">
      <main className="px-6 pb-6">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : (
          <ul className="space-y-3">
            {(countries ?? []).map((country) => (
              <li key={country.name}>
                <Link
                  to="/lieux/$country"
                  params={{ country: country.name }}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-card"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-serif text-xl">{country.name}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {country.cities} {country.cities > 1 ? "villes" : "ville"} · {country.count}{" "}
                      lieux
                    </span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </AppShell>
  );
}
