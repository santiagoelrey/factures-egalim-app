export const maxDuration = 60;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const PROMPT = `
Tu es un expert comptable et gestionnaire de cuisine centrale spécialisé dans l'extraction de pièces justificatives de restauration collective française :
- Factures fournisseurs (EpiSaveurs / Pomona, Transgourmet, Sysco, Brake, Metro, etc.)
- Bons de livraison (BL) chiffrés (avec prix)
- Bons de livraison (BL) NON chiffrés (uniquement quantités livrées, sans prix)
- Bordereaux de maraîchers, bouchers, boulangers locaux.

Analyse minutieusement l'image fournie et extrais fidèlement chaque article livré.

### RÈGLES CRITIQUES D'EXTRACTION :

1. **FIDÉLITÉ ABSOLUE AUX LIBELLÉS DE PRODUITS** :
   - Recopie EXACTEMENT le libellé commercial de l'article (ex: "Macaroni QS sac 5KG Panzani", "Riz lg basmati sac 5KG", "Filet poulet PAC", "Pommes Gala Cat 1").
   - Ne remplace JAMAIS un produit par un autre. Conserve le conditionnement et les marques s'ils sont imprimés.

2. **DÉTECTION DES LABELS OFFICIELS (EGALIM)** :
   - Analyse méticuleusement chaque libellé pour repérer les labels :
     * "BIO" / "Bio" / "AB" : "est_bio": true, "label": "BIO". Ajoute le préfixe "[BIO] " au tout début du nom s'il n'y figure pas déjà.
     * "HVE" (Haute Valeur Environnementale) : "est_bio": false, "label": "HVE".
     * "IGP" : "est_bio": false, "label": "IGP".
     * Si à la fois BIO et IGP : priorité BIO ("est_bio": true, "label": "BIO", nom: "[BIO] ...").
     * "AOP", "AOC", "LABEL_ROUGE", "STG", "FERMIER", "PECHE_DURABLE".
     * Sinon : "est_bio": false, "label": "STANDARD".
   - "QS" = Qualité Supérieure (standard, sauf mention explicite Label Rouge/HVE).

3. **QUANTITÉ RÉELLEMENT LIVRÉE (TRÈS IMPORTANT)** :
   - Les documents comportent souvent plusieurs colonnes de quantités :
     * "Qté Commandée" (Cde) vs "Qté Livrée" (Liv / Livr) vs "Qté Facturée" (Fact / Fact. UF).
     * Prends TOUJOURS la **QUANTITÉ RÉELLEMENT LIVRÉE** (ce qui entre physiquement en cuisine).
     * Si un article a Qté Livrée = 0 (rupture de stock / manquant), IGNORE cette ligne ou mets quantité: 0.
   - **UNITÉ & CONDITIONNEMENT (KG vs COLIS / PIÈCES)** :
     * Si l'article est facturé au POIDS (viande, poisson, fruits et légumes frais en vrac au kg) : prends le POIDS NET LIVRÉ EN KG (ex: si 2 colis pour un total de 10,500 kg facturés au kg -> quantité = 10.5).
     * Si l'article est vendu à l'unité, au carton, à la boîte ou au bidon (ex: conserves, bidons d'huile, condiments) : prends le NOMBRE D'UNITÉS LIVRÉES (ex: 2 bidons -> 2 ; 14 sacs -> 14).
   - En France, la virgule sépare les décimales : "14,000" = 14 ; "2,500" = 2.5 ; "0,750" = 0.75. Ne confonds JAMAIS "14,000" avec quatorze mille !
   - Le champ "quantite" doit être un nombre flottant JSON pur (ex: 14 ou 2.5), JAMAIS une chaîne de caractères.

4. **PRIX UNITAIRE ET TOTAL HT** :
   - **CAS 1 : Bon de livraison SANS PRIX (BL non chiffré)** :
     * C'est très fréquent en restauration collective. N'INVENTE PAS DE FAUX PRIX !
     * Mets simplement: "prix_unitaire": 0, "total_ht": 0, "tva": 0, "ttc": 0.
   - **CAS 2 : Facture ou BL CHIFFRÉ (avec prix)** :
     * "prix_unitaire" : recopie le prix unitaire imprimé (ex: 20.687, 8.632, 1.485).
     * "total_ht" : recopie le montant total HT de la ligne (ex: 289.62, 120.85).
     * Cohérence : total_ht ≈ quantite * prix_unitaire. Si l'un des deux est manquant, déduis-le mathématiquement.
     * TVA : montant de TVA de la ligne (taux alimentaire habituel 5.5% si non spécifié).
     * TTC : total_ht + tva.

5. **DATE DU DOCUMENT** :
   - Recherche la date imprimée (date de livraison ou date de facture, ex: "23/10/2026").
   - Utilise cette date pour le champ "jour" (ex: "23/10/2026"). Si introuvable, utilise la date du jour.

### FORMAT DE SORTIE JSON STRICT :
Réponds UNIQUEMENT avec un objet JSON valide conforme à la structure suivante :
{
  "data": [
    {
      "jour": "23/10/2026",
      "ligne_facture": [
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

function cleanNumber(val: any, fallback = 0): number {
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (!val) return fallback;
  const str = String(val).replace(/\s/g, '').replace(',', '.');
  const num = parseFloat(str);
  return isNaN(num) ? fallback : num;
}

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
            content: 'Tu es un système de reconnaissance optique et comptable expert pour les bons de livraison et factures de restauration collective française.'
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
        temperature: 0.0,
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

    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // In case output contains markdown json fences
      const match = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) {
        parsed = JSON.parse(match[1]);
      } else {
        throw new Error("Impossible de lire le JSON renvoyé par l'IA");
      }
    }

    // Normalize raw parsed into array of days
    let daysArray: any[] = [];
    if (Array.isArray(parsed)) {
      daysArray = parsed;
    } else if (Array.isArray(parsed.data)) {
      daysArray = parsed.data;
    } else if (parsed.ligne_facture || parsed.lines) {
      daysArray = [parsed];
    } else {
      // If object with keys
      daysArray = [parsed];
    }

    // Robust sanitization of extracted data
    const sanitizedData = daysArray.map((dayObj: any) => {
      const jourStr = dayObj.jour || dayObj.date || new Date().toLocaleDateString('fr-FR');
      const linesRaw = dayObj.ligne_facture || dayObj.lines || dayObj.articles || [];

      const cleanLines = (Array.isArray(linesRaw) ? linesRaw : [])
        .map((line: any) => {
          let produit = (line.produit || line.designation || line.nom || '').trim();
          if (!produit) return null;

          const quantite = cleanNumber(line.quantite ?? line.qte ?? line.quantite_livree, 0);
          // If quantity is explicitly 0 and no other info, skip
          if (quantite <= 0) return null;

          let prix_unitaire = cleanNumber(line.prix_unitaire ?? line.pu ?? line.prix_unit, 0);
          let total_ht = cleanNumber(line.total_ht ?? line.montant_ht ?? line.total, 0);

          // Arithmetic reconciliation
          if (total_ht === 0 && quantite > 0 && prix_unitaire > 0) {
            total_ht = Math.round(quantite * prix_unitaire * 100) / 100;
          } else if (prix_unitaire === 0 && quantite > 0 && total_ht > 0) {
            prix_unitaire = Math.round((total_ht / quantite) * 10000) / 10000;
          }

          let est_bio = Boolean(line.est_bio);
          let label = line.label || (estBioCheck(produit) ? 'BIO' : 'STANDARD');
          if (label === 'BIO' || produit.toUpperCase().includes('BIO') || produit.toUpperCase().includes('AGRICULTURE BIOLOGIQUE')) {
            est_bio = true;
            label = 'BIO';
            if (!produit.startsWith('[BIO] ')) {
              produit = `[BIO] ${produit}`;
            }
          }

          const tva = cleanNumber(line.tva, Math.round(total_ht * 0.055 * 100) / 100);
          const ttc = cleanNumber(line.ttc, Math.round((total_ht + tva) * 100) / 100);

          return {
            produit,
            quantite: Math.round(quantite * 1000) / 1000,
            prix_unitaire,
            total_ht: Math.round(total_ht * 100) / 100,
            tva,
            ttc,
            est_bio,
            label,
          };
        })
        .filter(Boolean);

      return {
        jour: jourStr,
        ligne_facture: cleanLines,
      };
    }).filter(d => d.ligne_facture.length > 0);

    return Response.json({ data: sanitizedData, model_used: 'gpt-4o' });

  } catch (error: any) {
    console.error('Analysis error:', error);
    return Response.json({
      error: 'Erreur lors de l\'analyse de l\'image',
      details: error?.message,
    }, { status: 500 });
  }
}

function estBioCheck(name: string): boolean {
  const upper = (name || '').toUpperCase();
  return upper.includes('BIO') || upper.includes('BIOLOGIQUE') || upper.startsWith('AB ') || upper.endsWith(' AB');
}
