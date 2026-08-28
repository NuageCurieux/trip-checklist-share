import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { citiesQuery } from "@/lib/catalog";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/lieux/$country/")({
  component: CitiesPage,
  head: ({ params }) => ({
    meta: [
      { title: `Villes à visiter en ${params.country} — Carnets` },
      {
        name: "description",
        content: `Les villes recensées en ${params.country} : ouvrez une ville pour voir ses lieux, ses prix et ses cartes.`,
      },
      { property: "og:title", content: `Villes à visiter en ${params.country} — Carnets` },
      {
        property: "og:description",
        content: `Toutes les villes du catalogue pour ${params.country}.`,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function CitiesPage() {
  const { country } = Route.useParams();
  const { t } = useI18n();
  const { data: cities, isLoading } = useQuery(citiesQuery(country));

  return (
    <AppShell kicker={t("discover.catalog")} title={country}>
      <main className="px-6 pb-6">
        <Link
          to="/lieux"
          className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-primary"
        >
          <ChevronLeft className="size-4" />
          Pays
        </Link>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : (
          <ul className="space-y-3">
            {(cities ?? []).map((city) => (
              <li key={city.name}>
                <Link
                  to="/lieux/$country/$city"
                  params={{ country, city: city.name }}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-card"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-serif text-lg">{city.name}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {city.count} lieux
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
