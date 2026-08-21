import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "fr" | "en" | "es";

type Dict = Record<string, string>;

const fr: Dict = {
  "app.name": "Carnets",
  "nav.notebooks": "Carnets",
  "nav.account": "Compte",
  "nav.new": "Nouveau carnet",
  "home.kicker": "Collection personnelle",
  "home.title": "Mes carnets de voyage",
  "home.empty": "Aucun carnet pour le moment. Créez votre premier itinéraire.",
  "home.createTitle": "Nouveau carnet",
  "home.titlePlaceholder": "Titre (ex. Été à Lisbonne)",
  "home.destinationPlaceholder": "Destination (ex. Portugal)",
  "home.create": "Créer le carnet",
  "home.places": "lieux",
  "home.visited": "visités",
  "landing.kicker": "Carnets de voyage partagés",
  "landing.title": "Cochez les lieux, partagez le voyage",
  "landing.lead":
    "Listez les endroits à visiter, cochez-les au fil du voyage, ajoutez vos photos, puis ouvrez le carnet à vos amis ou au monde entier.",
  "landing.traveler": "Je suis voyageur",
  "landing.travelerHint": "Créez vos carnets, vos listes de lieux et votre feed de photos.",
  "landing.visitor": "Je suis visiteur",
  "landing.visitorHint": "Collez le lien reçu pour découvrir le carnet d'un proche.",
  "landing.linkPlaceholder": "Lien ou code de partage",
  "landing.open": "Ouvrir le carnet",
  "auth.signIn": "Se connecter",
  "auth.signUp": "Créer un compte",
  "auth.email": "Adresse e-mail",
  "auth.password": "Mot de passe",
  "auth.google": "Continuer avec Google",
  "auth.toSignUp": "Pas encore de compte ? Créer un compte",
  "auth.toSignIn": "Déjà un compte ? Se connecter",
  "auth.checkEmail": "Compte créé. Vérifiez votre boîte mail si une confirmation est demandée.",
  "auth.signOut": "Se déconnecter",
  "trip.checklist": "Check-list",
  "trip.addPlace": "Ajouter un lieu",
  "trip.placeName": "Nom du lieu",
  "trip.area": "Quartier",
  "trip.note": "Note perso",
  "trip.category": "Catégorie",
  "trip.photo": "Photo",
  "trip.add": "Ajouter",
  "trip.markVisited": "Marquer comme visité",
  "trip.visitedStamp": "Visité",
  "trip.emptyPlaces": "Aucun lieu dans ce carnet.",
  "trip.delete": "Supprimer le carnet",
  "trip.deleteConfirm": "Supprimer ce carnet et tous ses lieux ?",
  "share.title": "Invitez vos amis",
  "share.lead": "Partagez ce carnet avec vos proches avant de le rendre public.",
  "share.emailPlaceholder": "E-mail d'un ami",
  "share.invite": "Inviter",
  "share.copy": "Copier le lien de partage",
  "share.copied": "Lien copié",
  "share.visibility": "Visibilité",
  "share.remove": "Retirer",
  "public.kicker": "Carnet partagé",
  "public.byTraveler": "Partagé par un voyageur",
  "public.notFound": "Ce carnet n'existe pas ou n'est plus partagé.",
  "public.backHome": "Retour à l'accueil",
  "common.loading": "Chargement…",
  "common.cancel": "Annuler",
  "common.saved": "Enregistré",
  "common.error": "Une erreur est survenue",
};

const en: Dict = {
  "app.name": "Notebooks",
  "nav.notebooks": "Notebooks",
  "nav.account": "Account",
  "nav.new": "New notebook",
  "home.kicker": "Personal collection",
  "home.title": "My travel notebooks",
  "home.empty": "No notebook yet. Create your first itinerary.",
  "home.createTitle": "New notebook",
  "home.titlePlaceholder": "Title (e.g. Summer in Lisbon)",
  "home.destinationPlaceholder": "Destination (e.g. Portugal)",
  "home.create": "Create notebook",
  "home.places": "places",
  "home.visited": "visited",
  "landing.kicker": "Shared travel notebooks",
  "landing.title": "Tick off the places, share the trip",
  "landing.lead":
    "List the places you want to see, tick them off as you go, add your photos, then open the notebook to your friends or to everyone.",
  "landing.traveler": "I'm a traveller",
  "landing.travelerHint": "Build your notebooks, place lists and photo feed.",
  "landing.visitor": "I'm a visitor",
  "landing.visitorHint": "Paste the link you received to browse someone's notebook.",
  "landing.linkPlaceholder": "Share link or code",
  "landing.open": "Open notebook",
  "auth.signIn": "Sign in",
  "auth.signUp": "Create account",
  "auth.email": "Email address",
  "auth.password": "Password",
  "auth.google": "Continue with Google",
  "auth.toSignUp": "No account yet? Create one",
  "auth.toSignIn": "Already registered? Sign in",
  "auth.checkEmail": "Account created. Check your inbox if a confirmation is required.",
  "auth.signOut": "Sign out",
  "trip.checklist": "Checklist",
  "trip.addPlace": "Add a place",
  "trip.placeName": "Place name",
  "trip.area": "Area",
  "trip.note": "Personal note",
  "trip.category": "Category",
  "trip.photo": "Photo",
  "trip.add": "Add",
  "trip.markVisited": "Mark as visited",
  "trip.visitedStamp": "Visited",
  "trip.emptyPlaces": "No place in this notebook yet.",
  "trip.delete": "Delete notebook",
  "trip.deleteConfirm": "Delete this notebook and all its places?",
  "share.title": "Invite your friends",
  "share.lead": "Share this notebook with friends before making it public.",
  "share.emailPlaceholder": "Friend's email",
  "share.invite": "Invite",
  "share.copy": "Copy share link",
  "share.copied": "Link copied",
  "share.visibility": "Visibility",
  "share.remove": "Remove",
  "public.kicker": "Shared notebook",
  "public.byTraveler": "Shared by a traveller",
  "public.notFound": "This notebook doesn't exist or is no longer shared.",
  "public.backHome": "Back home",
  "common.loading": "Loading…",
  "common.cancel": "Cancel",
  "common.saved": "Saved",
  "common.error": "Something went wrong",
};

const es: Dict = {
  ...en,
  "app.name": "Cuadernos",
  "nav.notebooks": "Cuadernos",
  "nav.account": "Cuenta",
  "nav.new": "Nuevo cuaderno",
  "home.kicker": "Colección personal",
  "home.title": "Mis cuadernos de viaje",
  "home.empty": "Todavía no hay cuadernos. Crea tu primer itinerario.",
  "home.createTitle": "Nuevo cuaderno",
  "home.titlePlaceholder": "Título (p. ej. Verano en Lisboa)",
  "home.destinationPlaceholder": "Destino (p. ej. Portugal)",
  "home.create": "Crear cuaderno",
  "home.places": "lugares",
  "home.visited": "visitados",
  "landing.kicker": "Cuadernos de viaje compartidos",
  "landing.title": "Marca los lugares, comparte el viaje",
  "landing.lead":
    "Apunta los lugares que quieres ver, márcalos durante el viaje, añade tus fotos y abre el cuaderno a tus amigos o a todo el mundo.",
  "landing.traveler": "Soy viajero",
  "landing.travelerHint": "Crea tus cuadernos, listas de lugares y tu feed de fotos.",
  "landing.visitor": "Soy visitante",
  "landing.visitorHint": "Pega el enlace recibido para ver el cuaderno de alguien.",
  "landing.linkPlaceholder": "Enlace o código para compartir",
  "landing.open": "Abrir cuaderno",
  "auth.signIn": "Iniciar sesión",
  "auth.signUp": "Crear cuenta",
  "auth.email": "Correo electrónico",
  "auth.password": "Contraseña",
  "auth.google": "Continuar con Google",
  "auth.signOut": "Cerrar sesión",
  "trip.checklist": "Lista",
  "trip.addPlace": "Añadir un lugar",
  "trip.visitedStamp": "Visitado",
  "share.title": "Invita a tus amigos",
  "share.copy": "Copiar enlace",
  "share.copied": "Enlace copiado",
  "public.kicker": "Cuaderno compartido",
  "common.loading": "Cargando…",
};

const DICTS: Record<Lang, Dict> = { fr, en, es };

function detect(): Lang {
  if (typeof navigator === "undefined") return "fr";
  const codes = [navigator.language, ...(navigator.languages ?? [])];
  for (const code of codes) {
    const short = code.slice(0, 2).toLowerCase();
    if (short === "fr" || short === "en" || short === "es") return short;
  }
  return "en";
}

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (key: string) => string };

const LangContext = createContext<Ctx>({ lang: "fr", setLang: () => {}, t: (k) => fr[k] ?? k });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("fr");

  useEffect(() => {
    const stored = window.localStorage.getItem("carnets.lang") as Lang | null;
    setLang(stored ?? detect());
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang: (l) => {
        window.localStorage.setItem("carnets.lang", l);
        setLang(l);
      },
      t: (key) => DICTS[lang][key] ?? fr[key] ?? key,
    }),
    [lang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useI18n() {
  return useContext(LangContext);
}
