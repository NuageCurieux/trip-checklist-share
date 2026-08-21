# Publier Carnets sur le Play Store

L'application web est prête à être emballée dans une application Android
(Capacitor). L'app native affiche votre site publié : vos mises à jour de
contenu et de design arrivent donc sans repasser par le Play Store.

## 1. Publier le site
Cliquez sur **Publish** dans Lovable. Notez l'URL obtenue et remplacez
`server.url` dans `capacitor.config.ts` si vous utilisez un domaine perso.

## 2. Générer le projet Android (sur votre ordinateur)
Prérequis : Node.js, Java 21 et [Android Studio](https://developer.android.com/studio).

```bash
git clone <votre-repo-github>
cd <votre-repo>
npm install
npx cap add android
npx cap sync android
npx cap open android
```

## 3. Icône et nom
- Dans Android Studio : clic droit sur `app` → *New* → *Image Asset*, puis
  choisissez `public/app-icon-512.png`.
- Le nom affiché est `Carnets` (modifiable dans `capacitor.config.ts`).

## 4. Créer le fichier à envoyer au Play Store
Dans Android Studio : **Build → Generate Signed Bundle / APK → Android App Bundle**.
Créez (et conservez précieusement) votre clé de signature. Vous obtenez un
fichier `.aab`.

## 5. Play Console
1. Compte développeur Google Play (25 $ une fois).
2. Créez l'application, remplissez la fiche (description, captures d'écran,
   icône 512x512, bannière 1024x500).
3. Ajoutez la politique de confidentialité (obligatoire : l'app gère comptes,
   photos et partage de localisation).
4. Déclarez dans le formulaire *Sécurité des données* : e-mail, photos,
   localisation approximative partagée volontairement entre amis.
5. Envoyez le `.aab` en test interne, puis en production.

Délai de validation : quelques jours en général.

## iOS (App Store), plus tard
Même principe avec `npx cap add ios`, mais un Mac avec Xcode et un compte
Apple Developer (99 $/an) sont nécessaires.
