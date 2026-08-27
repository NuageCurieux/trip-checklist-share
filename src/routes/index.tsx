import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import coverDefault from "@/assets/cover-calanques.jpg";
import { AppShell, LanguageSwitcher } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useTranslation } from "@/lib/i18n";
import { defaultCoverFor } from "@/lib/defaultCover";
import { progress, VISIBILITY_LABEL, Type Place, Type Trip } from "@/lib/travel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Carnets - check-lists de voyage à partager" },
      { name: "description", content: "Listez les lieux à visiter, cochez-les pendant le voyage, ajoutez vos photos et partagez le carnet avec vos amis ou au public." }
    ]
  }),
  component: Home,
});

type TripWithPlaces = Trip & { places: Place[] };

function Home() {
  const { user, loading } = useSession();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-am text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  return user ? <TravelerFeed /> : <Landing />;
}

function Landing() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  function openShared() {
    const slug = code.trim().split("/").pop();
    if (slug) {
      navigate({ to: "/partage/$slug", params: { slug } });
    }
  }

  return (
    <div className="min-h-screen bg-background pb-12 text-foreground">
      <header className="flex items-center justify-between px-6 pt-6">
        <span className="font-serif text-lg">{t("landing.kicker")}</span>
        <LanguageSwitcher />
      </header>

      <div className="px-6 pt-6">
        <div className="relative block">
          <img src={coverDefault} alt="Crique méditerranéenne aux eaux turquoise" className="aspect-4/3 w-full rounded-2xl object-cover" />
          <div className="absolute inset-x-4 bottom-4 rounded-xl bg-card/90 p-4 shadow-card backdrop-blur-md">
            <h1 className="font-serif text-2xl leading-tight">{t("landing.title")}</h1>
            <p className="text-sm text-un leading-relaxed text-muted-foreground">{t("landing.lead")}</p>
          </div>
        </div>
      </div>

      <section className="mt-8 space-y-3 px-6">
        <Link to="/auth" className="block rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-serif text-lg text-lg">{t("landing.traveler")}</h2>
          <p className="text-wt-1 text-sm text-muted-foreground">{t("landing.travelerHint")}</p>
        </Link>

        <div className="rounded-2xl bg-secondary p-6 text-secondary-foreground">
          <h2 className="font-serif text-lg">{t("landing.visitor")}</h2>
          <p className="text-sm text-un opacity-80">{t("landing.visitorHint")}</p>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t("landing.linkPlaceholder")} className="mt-4 w-full rounded-xl bg-card px-4 py-3 text-sm" />
          <button onClick={openShared} className="mt-3 w-full rounded-xl bg-card py-3 text-sm font-semibold text-secondary">
            {t("landing.open")}
          </button>
        </div>
      </section>
    </div>
  );
}

function TravelerFeed() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  
  // États pour gérer les activités et musées sélectionnés
  const [selectedMuseums, setSelectedMuseums] = useState<string[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

  // NOUVEAU : États pour la gestion du budget et des conversions € / ₩
  const [budgetEuro, setBudgetEuro] = useState("");
  const [budgetWon, setBudgetWon] = useState("");
  const TAUX_CHANGE = 1500; // 1 Euro = 1500 Wons

  const handleEuroChange = (val: string) => {
    setBudgetEuro(val);
    if (val === "" || isNaN(Number(val))) {
      setBudgetWon("");
    } else {
      setBudgetWon(Math.round(Number(val) * TAUX_CHANGE).toString());
    }
  };

  const handleWonChange = (val: string) => {
    setBudgetWon(val);
    if (val === "" || isNaN(Number(val))) {
      setBudgetEuro("");
    } else {
      setBudgetEuro((Number(val) / TAUX_CHANGE).toFixed(2));
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const { data: trips, error } = await supabase
        .from("trips")
        .select("*, places(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return { list: trips, covers: trips.map(() => coverDefault) };
    },
  });

  const { mutate = () => {}, isPending } = useMutation({
    mutationFn: async () => {
      // Intègre les informations de budget dans la description ou le titre si votre bdd n'a pas de colonne dédiée
      const budgetTexte = budgetEuro ? ` (Budget: ${budgetEuro}€ / ${Number(budgetWon).toLocaleString()}₩)` : "";
      
      const { data: trip, error } = await supabase
        .from("trips")
        .insert([{ 
          title: (title.trim() + budgetTexte), 
          destination: destination.trim() || null 
        }])
        .select()
        .single();
      if (error) throw error;

      if (trip) {
        const allItems = [...selectedMuseums, ...selectedActivities];
        if (allItems.length > 0) {
          const placesToInsert = allItems.map((item, index) => ({
            trip_id: trip.id,
            title: item,
            description: "Ajouté automatiquement depuis les suggestions d'activités !",
            order_index: index
          }));
          await supabase.from("places").insert(placesToInsert);
        }
      }
      return trip;
    },
    onSuccess: () => {
      setTitle("");
      setDestination("");
      setSelectedMuseums([]);
      setSelectedActivities([]);
      setBudgetEuro("");
      setBudgetWon("");
      toast.success(t("common.saved"));
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
    onError: () => toast.error(t("common.error")),
  });

  const trips = data?.list ?? [];
  const featured = trips;

  const museumsList = ["Musée d'art historique", "Musée des sciences", "Galerie d'art locale", "Monument & Château historique"];
  const activitiesList = ["Randonnée & Nature", "Restaurants locaux à tester", "Plage & Détente", "Shopping de souvenirs", "Visite guidée de la ville"];

  const toggleMuseum = (item: string) => {
    setSelectedMuseums(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const toggleActivity = (item: string) => {
    setSelectedActivities(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  return (
    <AppShell kicker={t("home.kicker")} title={t("home.title")}>
      {featured && (
        <div className="px-6">
          <Link to="/carnet/$id" params={{ id: featured.id }} className="relative block">
            <img src={coverDefault} alt={featured.title} className="aspect-4/3 w-full rounded-2xl object-cover" />
            <div className="absolute inset-x-4 bottom-4 rounded-xl bg-card/90 p-4 shadow-card">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl">{featured.title}</h2>
                <span className="rounded-full bg-secondary/10 px-2 py-1 text-xs font-semibold">
                  {VISIBILITY_LABEL[featured.visibility]}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{featured.destination ?? "-"}</p>
              <div className="mt-2 text-xs text-primary font-bold">
                {progress(featured.places)}% ({featured.places.filter(p => p.visited).length}/{featured.places.length} {t("home.places")})
              </div>
            </div>
          </Link>
        </div>
      )}

      <section className="mt-8 px-6">
        <h3 className="mb-4 text-xs font-semibold tracking-uppercase text-muted-foreground">
          {t("nav.notebooks")}
        </h3>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : trips.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("home.empty")}</p>
        ) : (
          <div className="space-y-3">
            {trips.slice(1).map((trip) => (
              <Link key={trip.id} to="/carnet/$id" params={{ id: trip.id }} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex-1">
                  <h4 className="text-sm font-medium">{trip.title}</h4>
                  <p className="text-xs text-muted-foreground">{trip.destination ?? "-"}</p>
                </div>
                <div className="text-xs font-bold text-primary">
                  {progress(trip.places)}%
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Formulaire de création modifié */}
      <section id="nouveau" className="mt-8 px-6 pb-12">
        <div className="rounded-xl bg-secondary p-6 text-secondary-foreground">
          <h3 className="mb-4 font-serif text-lg">{t("home.createTitle")}</h3>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("home.titlePlaceholder")} className="w-full rounded-xl bg-card px-4 py-3 text-sm mb-3" />
          <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder={t("home.destinationPlaceholder")} className="w-full rounded-xl bg-card px-4 py-3 text-sm mb-4" />
          
