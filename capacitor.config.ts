import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Configuration de l'application Android (Play Store).
 *
 * L'app Carnets utilise le rendu serveur : l'app native charge donc
 * directement le site publié (comme une app Play Store classique),
 * plutôt qu'un paquet de fichiers statiques.
 *
 * Remplacez `server.url` par votre domaine définitif avant la publication.
 */
const config: CapacitorConfig = {
  appId: "app.lovable.carnets",
  appName: "Carnets",
  webDir: "dist",
  server: {
    url: "https://project--cf0fbee3-253a-415f-85ae-1f5fdaa6cc30.lovable.app",
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    backgroundColor: "#F7F3EF",
  },
  plugins: {
    SplashScreen: {
      backgroundColor: "#F7F3EF",
      launchAutoHide: true,
      showSpinner: false,
    },
  },
};

export default config;
