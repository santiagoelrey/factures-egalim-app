export const maxDuration = 60;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const PROMPT = `
Tu es un expert en extraction de factures de restauration française (EGALIM).
Analyse cette image de facture ou de bon de livraison.

### RÈGLES D'EXTRACTION CRITIQUES :

1.  **IDENTIFICATION BIO & LABELS DE QUALITÉ** : 
    - Détecte si le produit possède l'un des labels de qualité suivants : "BIO", "LABEL_ROUGE", "HVE", "IGP", "STG", "AOP", "AOG", "FERMIER", "PECHE_DURABLE".
    - Si le produit est BIO (présence de "BIO", "AB", "Agriculture Biologique", ou logo AB), met "est_bio" à true et renseigne "label" à "BIO".
    - Si le produit possède un autre label, renseigne "label" avec le code exact du label détecté (ex: "AOP", "IGP", "LABEL_ROUGE", "HVE", "STG", "AOG", "FERMIER", "PECHE_DURABLE").
    - S'il n'y a pas de label spécifique, utilise "STANDARD".
    - Si le produit est BIO, ajoute impérativement "[BIO] " au début du nom du produit.

2.  **STRUCTURE TEMPORELLE** :
    - Cherche des en-têtes de colonnes comme "Lundi", "Mardi", etc.
    - Si les produits sont listés sous une date, extrait cette date.
    - Si aucune date n'est visible, utilise la date du document ou "Commande" par défaut.

3.  **PRÉCISION DES DONNÉES NUMÉRIQUES** :
    - **NOM PRODUIT** : Doit être fidèle au libellé exact.
    - **QUANTITÉ** : Extrait la valeur numérique. Ignore les unités (ex: "kg", "colis") dans le champ numérique, mais garde-les si nécessaire dans le nom.
    - **PRIX UNITAIRE** : TRÈS IMPORTANT. Garde toutes les décimales (ex: 1.2345 €). 
    - **TOTAL HT** : Doit correspondre à Quantité x Prix Unitaire.
    - **TVA** : Si non spécifiée par ligne, applique 5.5% (0.055).
    - **TTC** : Total HT + TVA.

4.  **FORMAT DE SORTIE** :
    Tu dois répondre avec un objet JSON valide contenant une clé "data" qui est un tableau d'objets DayData.

Exemple de structure attendue :
{
  "data": [
    {
      "jour": "Lundi 24 Février",
      "ligne_facture": [
        {
          "produit": "[BIO] Pommes Galas",
          "quantite": 15.5,
          "prix_unitaire": 2.10,
          "total_ht": 32.55,
          "tva": 1.79,
          "ttc": 34.34,
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

    // Call OpenAI GPT-4o with vision
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',  // gpt-4o has best vision quality; gpt-4o-mini is cheaper
        messages: [
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
        response_format: { type: "json_object" }, // Force JSON mode
        max_tokens: 4096,
        temperature: 0, // Even lower temperature for consistency
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
    const data = parsed.data || parsed; // Handle both direct array or wrapped object

    return Response.json({ data, model_used: 'gpt-4o' });

  } catch (error: any) {
    console.error('Analysis error:', error);
    return Response.json({
      error: 'Erreur lors de l\'analyse de l\'image',
      details: error?.message,
    }, { status: 500 });
  }
}
