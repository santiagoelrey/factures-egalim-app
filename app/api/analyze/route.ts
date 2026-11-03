export const maxDuration = 60;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const PROMPT = `
Tu es un expert comptable et gestionnaire de cuisine centrale spécialisé dans l'extraction de factures et bons de livraison (BL) de restauration collective française (loi EGALIM).

Analyse minutieusement cette image de facture ou de bon de livraison.

### RÈGLES D'EXTRACTION CRITIQUES :

1. **IDENTIFICATION BIO & LABELS DE QUALITÉ (EGALIM)** : 
   - Détecte activement les mentions et sigles de qualité : "BIO", "AB", "Agriculture Biologique", "LABEL ROUGE", "HVE" (Haute Valeur Environnementale), "IGP", "STG", "AOP", "AOC", "FERMIER", "PECHE DURABLE" / "MSC".
   - Si le produit est BIO :
     * "est_bio": true
     * "label": "BIO"
     * Ajoute impérativement le préfixe "[BIO] " au tout début du nom du produit (ex: "[BIO] Carottes vrac").
   - Si le produit a un autre label :
     * "est_bio": false
     * "label": renseigne le code exact : "AOP", "IGP", "LABEL_ROUGE", "HVE", "STG", "AOG", "FERMIER", "PECHE_DURABLE".
   - Si aucun label officiel n'apparaît :
     * "est_bio": false
     * "label": "STANDARD".

2. **STRUCTURE TEMPORELLE ET DATES** :
   - Cherche en priorité la date de livraison, la date du bon ou les jours de livraison (ex: "Lundi 03/11", "Mercredi 05 Novembre").
   - Si plusieurs dates/jours apparaissent pour différents groupes de produits, sépare-les en objets distincts dans le tableau "data".
   - Si une seule date globale figure sur le document, utilise cette date (ex: "Bon de livraison du 03/11/2026").
   - À défaut absolu, utilise "Livraison".

3. **PRÉCISION DES QUANTITÉS ET DISTINCTION DES COLONNES** :
   - **QUANTITÉ LIVRÉE** : Sur les bons de livraison, il y a souvent "Quantité commandée" et "Quantité livrée / facturée". Prends TOUJOURS la **quantité réellement livrée/facturée**.
   - Si une unité est indiquée (ex: 5.500 kg, 12 btes, 3 colis de 5kg), extrait le poids ou volume net facturé (ex: 15 si 3 colis de 5kg facturés au kg, ou le nombre total d'unités). Le champ "quantite" doit être un NOMBRE positif.
   - Ignore les codes articles ou numéros de lot dans la quantité.

4. **PRIX UNITAIRE ET TOTAUX (COHÉRENCE ARITHMÉTIQUE OBLIGATOIRE)** :
   - **PRIX UNITAIRE HT** : Conserve toutes les décimales imprimées (ex: 1.4850 €/kg).
   - **TOTAL HT** : Lis en priorité le montant total de la ligne imprimé sur le document.
     * Vérifie la cohérence : Total HT doit être très proche de Quantité × Prix Unitaire.
     * Si le prix unitaire est manquant mais que le Total HT et la Quantité sont présents : déduis Prix Unitaire = Total HT / Quantité.
     * Si le Total HT est manquant : calcule Quantité × Prix Unitaire.
     * Si aucun prix ne figure sur le BL (certains BL n'ont que des quantités) : indique 0 pour le prix unitaire et total HT, l'utilisateur pourra le compléter.
   - **TVA** : Si le taux de TVA figure sur la ligne (5.5%, 10%, 20%), calcule le montant de TVA correspondant. Sinon, applique 5.5% (0.055) par défaut pour les produits alimentaires.
   - **TTC** : Total HT + TVA.

5. **NETTOYAGE DU NOM PRODUIT** :
   - Extrait le libellé commercial clair en enlevant les codes barres ou références fournisseurs inutiles (ex: "004321 POMMES GOLDEN CAT 1 CAL 115-130" -> "Pommes Golden Cat 1").
   - Garde le conditionnement pertinent (ex: "Vrac", "Plateau 6kg", "Surgelé") si cela aide le cuisinier.

6. **EXHAUSTIVITÉ** :
   - Extrait **TOUTES les lignes d'articles**, sans en oublier aucune. Ne résume pas et n'arrête pas la liste au milieu.

### FORMAT DE SORTIE :
Tu dois répondre STRICTEMENT par un objet JSON valide (aucun texte d'introduction ni de conclusion) :
{
  "data": [
    {
      "jour": "Lundi 03 Novembre 2026",
      "ligne_facture": [
        {
          "produit": "[BIO] Pommes Gala Vrac",
          "quantite": 14.5,
          "prix_unitaire": 2.15,
          "total_ht": 31.18,
          "tva": 1.71,
          "ttc": 32.89,
          "est_bio": true,
          "label": "BIO"
        }
      ]
    }
  ]
}
`;

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    if (!image) {
      return Response.json({ error: 'Aucune image fournie' }, { status: 400 });
    }

    if (!OPENAI_API_KEY) {
      return Response.json({ error: 'Clé API OpenAI non configurée' }, { status: 500 });
    }

    // Call OpenAI GPT-4o with high visual detail
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Passé de gpt-4o-mini à gpt-4o pour une précision maximale d'OCR
        messages: [
          {
            role: 'system',
            content: 'Tu es un système de reconnaissance optique et comptable ultra-précis pour les pièces justificatives de cuisine collective.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: PROMPT,
              },
              {
                type: 'image_url',
                image_url: {
                  url: image,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 4096,
        temperature: 0.05,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return Response.json({
        error: 'Erreur API OpenAI',
        details: errorData?.error?.message,
      }, { status: response.status });
    }

    const result = await response.json();
    const rawText = result?.choices?.[0]?.message?.content || '{}';

    const parsed = JSON.parse(rawText);
    const data = parsed.data || parsed;

    return Response.json({ data, model_used: 'gpt-4o' });

  } catch (error: any) {
    console.error('Analysis error:', error);
    return Response.json({
      error: 'Erreur lors de l\'analyse de l\'image',
      details: error?.message,
    }, { status: 500 });
  }
}
