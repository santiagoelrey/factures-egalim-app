# 📋 GUIDE TECHNIQUE & COPIER-COLLER : DÉPLOIEMENT POUR UN NOUVEAU CLIENT

Ce document vous donne toutes les étapes et les blocs de texte prêts à **copier et coller** pour créer et déployer une nouvelle version indépendante de **Factures Egalim** pour n'importe quel nouveau client (école, cuisine centrale, restaurant, EHPAD).

---

## ⚡ En résumé : Ce qui change pour chaque client

Pour chaque nouveau client, vous devez seulement créer :
1. **Un nouveau classeur Google Sheets vide** (pour que ses données restent 100% privées et séparées des autres clients).
2. **Un nouveau projet sur Vercel** avec l'ID de ce nouveau classeur.

Le code de l'application reste le même, vous n'avez pas besoin de réécrire du code !

---

## 📝 ÉTAPE 1 : Créer le classeur Google Sheets du client (2 min)

1. Rendez-vous sur [Google Drive](https://drive.google.com)
2. Cliquez sur **Nouveau > Google Sheets**
3. Nommez la feuille : `EGALIM - [Nom du Client]` (ex: `EGALIM - Ecole Saint-Louis`)
4. **Récupérez le `SPREADSHEET_ID`** :
   Dans la barre d'adresse de votre navigateur, l'URL ressemble à ceci :
   `https://docs.google.com/spreadsheets/d/`**`1hPDlmz0lA0H_bn6vguQ8H68EQemwwM5EXxbCFONnHgA`**`/edit`
   👉 **Copiez la partie en gras** (la longue série de lettres et chiffres). C'est votre `SPREADSHEET_ID`.
5. **Partager avec le robot Google :**
   - Cliquez sur le bouton bleu **Partager** (en haut à droite du tableur)
   - Collez l'adresse email suivante :
     ```text
     antigravity-sheets-bot@gestion-factures-486610.iam.gserviceaccount.com
     ```
   - Donnez-lui le rôle : **Éditeur**
   - Décochez *"Envoyer une notification"* et cliquez sur **Partager**.

*(C'est terminé pour Google Sheets ! Le programme créera tout seul les onglets nécessaires lors de la première synchronisation).*

---

## 🚀 ÉTAPE 2 : Déployer l'application sur Vercel (3 min)

1. Connectez-vous sur [vercel.com](https://vercel.com) avec votre compte GitHub.
2. Cliquez sur le bouton **« Add New... »** puis **« Project »**.
3. En face de votre dépôt `factures-egalim-app`, cliquez sur **« Import »**.
4. Dans **Project Name**, mettez le nom du client (ex: `egalim-ecole-saint-louis`).
5. Déroulez la section **« Environment Variables »** et ajoutez ces 4 variables (copier-coller ci-dessous) :

### Bloc des Variables d'environnement à coller sur Vercel :

#### Variable 1 :
- **Key :** `SPREADSHEET_ID`
- **Value :** *(Collez ici l'ID du Google Sheet du client récupéré à l'étape 1)*

#### Variable 2 :
- **Key :** `OPENAI_API_KEY`
- **Value :** *(Votre clé API OpenAI)*

#### Variable 3 :
- **Key :** `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- **Value :**
  ```text
  antigravity-sheets-bot@gestion-factures-486610.iam.gserviceaccount.com
  ```

#### Variable 4 :
- **Key :** `GOOGLE_PRIVATE_KEY`
- **Value :** *(Votre clé privée Google Service Account issue de votre fichier `.env.local`)*

6. Cliquez sur le bouton **« Deploy »**.
7. En 1 minute, Vercel termine le déploiement et vous donne l'adresse web du client :
   👉 `https://egalim-ecole-saint-louis.vercel.app`

---

## ⚙️ ÉTAPE 3 : Première configuration du client (1 min)

1. Ouvrez l'adresse du client sur votre navigateur (`https://egalim-ecole-saint-louis.vercel.app`).
2. Cliquez sur l'onglet **Paramètres** :
   - **Nom de l'établissement :** Tapez le nom réel (ex: *École Saint-Louis*).
   - **Responsable :** Nom du chef ou de l'économe (ex: *Marc Martin*).
   - Cliquez sur **« Sauvegarder les paramètres »**.
3. Cliquez sur le bouton bleu **« Synchroniser »** en haut à droite :
   - Le bouton affiche une coche verte : le Google Sheet du client est initialisé et prêt à recevoir toutes les factures et stocks !

---

## 📱 ÉTAPE 4 : Message prêt à envoyer au client pour son téléphone

Vous pouvez copier-coller ce message type pour l'envoyer au client (par WhatsApp, SMS ou Email) :

```text
Bonjour,

Voici le lien d'accès à votre application de gestion de factures et stocks EGALIM :
👉 https://[METTRE_L_URL_DU_CLIENT].vercel.app

Astuce pour l'installer sur votre téléphone comme une vraie application :
- Sur iPhone : Ouvrez le lien dans Safari > appuyez sur le bouton Partager (icône avec une flèche vers le haut) > sélectionnez "Sur l'écran d'accueil".
- Sur Android : Ouvrez le lien dans Chrome > appuyez sur les 3 points en haut à droite > sélectionnez "Installer l'application" ou "Ajouter à l'écran d'accueil".

Dès que vous scannez un bon de livraison ou ajustez un stock, cliquez sur le bouton "Synchroniser" en haut à droite pour que tout soit partagé entre vos téléphones et ordinateurs.
```

---

## 💻 ÉTAPE FACULTATIVE : Pour faire tourner le client en local sur un PC dédié

Si le client n'utilise pas le cloud Vercel et veut faire tourner le programme sur un ordinateur dans sa cuisine :

1. Ouvrez un terminal PowerShell sur son PC :
```bash
git clone https://github.com/santiagoelrey/factures-egalim-app.git
cd factures-egalim-app
npm install
```

2. Créez le fichier `.env.local` avec les clés et l'ID de son Google Sheet.

3. Lancez le serveur :
```bash
npm run dev
```

4. Le client accède à l'application sur `http://localhost:3000` depuis le PC, ou `http://[IP_DU_PC]:3000` depuis les téléphones connectés au Wi-Fi.
