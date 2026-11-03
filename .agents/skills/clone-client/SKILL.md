---
name: clone-factures-egalim-client
description: Guide et procédure pas à pas pour cloner, configurer et déployer une nouvelle instance étanche de Factures Egalim pour un nouveau client ou établissement scolaire / cuisine centrale.
---

# Guide de duplication : Factures Egalim pour un nouveau client

Ce guide fournit la procédure complète étape par étape pour déployer une instance autonome et indépendante de l'application **Factures Egalim** pour un nouveau client (école, cuisine centrale, restaurant collectif, EHPAD, etc.).

Chaque client dispose :
- De son propre classeur Google Sheets (données 100% isolées)
- De sa propre URL Vercel (ex: `https://egalim-ecole-montessori.vercel.app`)
- De son nom d'établissement préconfiguré
- De sa synchronisation PC ↔ Smartphone

---

## Vue d'ensemble du processus (10 minutes)

```mermaid
graph TD
    A[1. Créer le Google Sheet du client] --> B[2. Partager avec le Service Account]
    B --> C[3. Cloner le dépôt GitHub ou nouveau projet]
    C --> D[4. Configurer les variables .env.local]
    D --> E[5. Déployer sur Vercel]
    E --> F[6. Initialiser le profil client & Synchroniser]
```

---

## Étape 1 : Créer le classeur Google Sheets du client

1. Ouvrez votre compte Google Drive : [drive.google.com](https://drive.google.com)
2. Créez une nouvelle feuille de calcul : **Nouveau > Google Sheets**.
3. Nommez le document au nom du client (ex: `EGALIM - Cuisine Centrale Dupont`).
4. **Récupérez l'ID du classeur** dans la barre d'adresse du navigateur :
   - URL : `https://docs.google.com/spreadsheets/d/1hPDlmz0lA0H_bn6vguQ8H68EQemwwM5EXxbCFONnHgA/edit`
   - L'ID est la partie entre `/d/` et `/edit` :
     👉 `1hPDlmz0lA0H_bn6vguQ8H68EQemwwM5EXxbCFONnHgA`
5. **Donnez les droits d'écriture au robot Google** :
   - Cliquez sur le bouton bleu **Partager** en haut à droite.
   - Ajoutez l'adresse email du Service Account :
     👉 `antigravity-sheets-bot@gestion-factures-486610.iam.gserviceaccount.com`
   - Rôle : **Éditeur** (décochez "Envoyer une notification").
   - Cliquez sur **Partager**.

---

## Étape 2 : Préparer le code pour le nouveau client

### Option A : Déploiement direct sans toucher au code (Recommandé)
Le code source est déjà prêt pour le multi-client. Vous pouvez déployer le même dépôt GitHub (`santiagoelrey/factures-egalim-app`) plusieurs fois sur Vercel, en changeant simplement les variables d'environnement pour chaque client !

### Option B : Créer un dépôt GitHub dédié pour le client
Si le client veut son propre code personnalisé :
```bash
# 1. Cloner le projet modèle
git clone https://github.com/santiagoelrey/factures-egalim-app.git factures-egalim-client-nom

# 2. Entrer dans le dossier
cd factures-egalim-client-nom

# 3. Réinitialiser git pour le nouveau client
rm -rf .git
git init
git add .
git commit -m "feat: initial commit client NomClient"

# 4. Créer un nouveau dépôt sur GitHub et pousser
git remote add origin https://github.com/votre-compte/factures-egalim-client-nom.git
git branch -M main
git push -u origin main
```

---

## Étape 3 : Fichier de configuration `.env.local`

Créez le fichier `.env.local` avec les informations du client :

```env
# Clé OpenAI pour l'analyse OCR GPT-4o des factures/BL
OPENAI_API_KEY=sk-proj-VOTRE_CLE_OPENAI

# ID du classeur Google Sheets créé à l'Étape 1 pour ce client
SPREADSHEET_ID=1hPDlmz0lA0H_bn6vguQ8H68EQemwwM5EXxbCFONnHgA

# Identifiants du Service Account Google (commun ou dédié)
GOOGLE_SERVICE_ACCOUNT_EMAIL=antigravity-sheets-bot@gestion-factures-486610.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCuHZgyqmNh7BUG\n...VOTRE_CLE_PRIVEE...\n-----END PRIVATE KEY-----\n"
```

---

## Étape 4 : Déploiement sur Vercel (URL Cloud pour le client)

1. Rendez-vous sur [vercel.com](https://vercel.com) avec votre compte GitHub.
2. Cliquez sur **Add New... > Project**.
3. Sélectionnez le dépôt `factures-egalim-app` (ou le dépôt spécifique au client).
4. Nommez le projet au nom du client (ex: `egalim-ecole-montessori`).
5. Dans la section **Environment Variables**, ajoutez les 4 variables :
   - `OPENAI_API_KEY`
   - `SPREADSHEET_ID` *(l'ID spécifique au client)*
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
6. Cliquez sur **Deploy**.
7. En moins de 2 minutes, Vercel vous donne l'URL définitive (ex: `https://egalim-ecole-montessori.vercel.app`).

---

## Étape 5 : Première initialisation du client

1. Ouvrez l'URL du client sur votre navigateur.
2. Allez dans l'onglet **Paramètres** :
   - Renseignez le **Nom de l'établissement** (ex: *École Montessori de Meudon*).
   - Renseignez le **Nom du responsable**.
   - Le champ **Spreadsheet ID** est pré-rempli.
   - Cliquez sur **Sauvegarder les paramètres**.
3. Cliquez sur le bouton bleu **« Synchroniser »** en haut à droite :
   - Le système va créer automatiquement les onglets de données dans le Google Sheet du client (`SYNC_STOCK`, `SYNC_SETTINGS`, `SYNC_INVOICE_HISTORY`, `SYNC_EFFECTIFS`).
4. C'est prêt !

---

## Étape 6 : Installation sur les smartphones de l'équipe du client

Transmettez l'adresse URL au client (ex: par SMS ou email) :
1. Sur **iPhone (Safari)** : Ouvrir l'URL > appuyer sur l'icône Partager > **« Sur l'écran d'accueil »**.
2. Sur **Android (Chrome)** : Ouvrir l'URL > menu (3 points) > **« Installer l'application »** ou **« Ajouter à l'écran d'accueil »**.

L'application s'ouvre alors en plein écran comme une véritable application native. Dès qu'un cuisinier clique sur **« Synchroniser »**, les stocks et menus sont instantanément à jour entre le téléphone et l'ordinateur de la direction.
