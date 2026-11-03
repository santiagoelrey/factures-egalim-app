export const maxDuration = 60;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const PROMPT = `
Tu es un expert comptable et gestionnaire de cuisine centrale spécialisé dans l'extraction de factures et bons de livraison (BL) de fournisseurs de restauration collective française (ex: EpiSaveurs - Groupe Pomona, Transgourmet, Sysco, Brake, Metro, etc.).

Analyse l'image du document fourni (bordereau de livraison ou facture).

### RÈGLES D'EXTRACTION IMPÉRATIVES :

1. **FIDÉLITÉ ABSOLUE AUX LIBELLÉS IMPRIMÉS** :
   - Recopie EXACTEMENT le libellé commercial imprimé dans la colonne "Désignation" / "Article" (ex: "Macaroni QS sac 5KG Panzani", "Riz lg basmati sac 5KG VPaille", "Curry rge EDC sac 500Gx10 Terre Exo").
   - N'invente JAMAIS un nom de produit différent (ne remplace PAS "Macaroni" par "Moutarde", ni "Couscous" par "Compote", ni "Terre Exo" par "Toqueuila").
   - Conserve les marques réelles (Panzani, Lustucru, Terre Exotique, Toquella, etc.) et le conditionnement ("sac 5KG", "bid 5Lx3", etc.).

2. **DÉTECTION DES LABELS DE QUALITÉ (EGALIM)** :
   - Analyse méticuleusement chaque mot du libellé pour repérer les labels officiels :
     * "BIO" / "Bio" / "AB" : mets "est_bio": true et "label": "BIO". Ajoute le préfixe "[BIO] " au tout début du nom (ex: "[BIO] Couscous moyen Bio sac 5KG Panz").
     * "HVE" (Haute Valeur Environnementale) : "est_bio": false, "label": "HVE". (ex: "Torsade QS HVE sac 5KG Lustucru" -> label: "HVE").
     * "IGP" : "est_bio": false, "label": "IGP".
     * Si un produit est à la fois BIO et IGP (ex: "Riz lg etuve Camarg IGP Bio sac5KG Heriz") : donne la priorité à "BIO" ("est_bio": true, "label": "BIO", nom: "[BIO] Riz lg etuve Camarg IGP Bio sac5KG Heriz").
     * "AOP", "AOC", "LABEL_ROUGE", "STG", "FERMIER", "PECHE_DURABLE".
     * Sinon : "est_bio": false, "label": "STANDARD".
   - Note : "QS" signifie "Qualité Supérieure" chez les grossistes de pâtes, ce n'est pas un label officiel EGALIM, sauf s'il est accompagné de HVE ou Label Rouge.

3. **COLONNES NUMÉRIQUES ET FORMAT GROSSISTE** :
   Les bordereaux EpiSaveurs / Pomona comportent souvent :
   \`Ligne/Article | Désignation | Qté livrée | Qté fact. UF | PU | TVA | MT HT\`
   - **QUANTITÉ** : Extrait le nombre de la colonne "Qté livrée" ou "Qté fact. UF" (ex: "14,000 COL" ou "14,000 SAC" -> 14 ; "2,000 BID" -> 2 ; "3,000 COL" -> 3).
     * En France la virgule est le séparateur décimal ("14,000" = 14 unités, "2,000" = 2 unités). Ne confonds PAS "14,000" avec quatorze mille !
   - **PRIX UNITAIRE (PU)** : Recopie fidèlement le chiffre imprimé dans la colonne "PU" (ex: "20,687" -> 20.687 ; "8,632" -> 8.632 ; "13,572" -> 13.572 ; "20,282" -> 20.282).
   - **MONTANT TOTAL HT (MT HT) - RÈGLE FONDAMENTALE** :
     * Recopie STRICTEMENT le montant imprimé dans la colonne "MT HT" (ex: 289.62, 120.85, 40.72, 283.95, 245.66).
     * N'INVENTE PAS de faux totaux et ne divise pas les prix.
     * Si PU = 20.687 et Qté = 14, MT HT = 289.62 € (14 x 20.687).
   - **TVA** : Si un code TVA comme "E 1" ou "5,50 %" est présent, calcule ou extrait la TVA correspondante. Si 5.5% : TVA = MT HT x 0.055.
   - **TTC** : MT HT + TVA.

4. **CONTRÔLE DE TOTALISATION DU DOCUMENT (VÉRIFICATION D'EXHAUSTIVITÉ)** :
   - Regarde le pied de page du document :
     * Repère le "Montant HT" global imprimé (ex: "Montant HT : 1187,38").
     * Toutes les lignes d'articles doivent être extraites, SANS AUCUN OUBLI.
     * La somme des "total_ht" de toutes tes lignes extraites DOIT être égale (à quelques centimes près d'arrondi) au Montant HT total imprimé en bas du document.

5. **DATE DU DOCUMENT** :
   - Extrait la date figurant sur le document (ex: "23.10.2026" ou "23/10/2026").
   - Utilise cette date comme valeur du champ "jour" (ex: "23/10/2026").

### FORMAT DE SORTIE JSON STRICT :
Réponds UNIQUEMENT avec un objet JSON valide conforme au schéma suivant :
{
  "data": [
    {
      "jour": "23/10/2026",
      "ligne_facture": [
        {
          "produit": "Ketchup bid 5KGx4 Toquelia",
          "quantite": 2,
          "prix_unitaire": 6.456,
          "total_ht": 12.91,
          "tva": 0.71,
          "ttc": 13.62,
          "est_bio": false,
          "label": "STANDARD"
        },
        {
          "produit": "Macaroni QS sac 5KG Panzani",
          "quantite": 14,
          "prix_unitaire": 20.687,
          "total_ht": 289.62,
          "tva": 15.93,
          "ttc": 305.55,
          "est_bio": false,
          "label": "STANDARD"
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
        model: 'gpt-4o',
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
        temperature: 0.0, // 0 strict pour éliminer toute hallucination ou approximation
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
