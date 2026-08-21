export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: Request) {
  try {
    const { stats } = await req.json();

    if (!GEMINI_API_KEY) {
      return Response.json({ error: 'Clé API Gemini non configurée (GEMINI_API_KEY)' }, { status: 500 });
    }

    const prompt = `
Tu es un expert en restauration collective et conformité EGALIM.
Rédige un "Rapport Officiel de Cuisine" professionnel et bien formaté en Markdown basé sur les statistiques suivantes.
Ce rapport sera présenté à la direction.

Statistiques :
- Total des achats (HT) : ${stats.totalPurchases.toFixed(2)} €
- Total achats EGALIM (HT) : ${stats.totalEgalim.toFixed(2)} € (${stats.egalimPercent.toFixed(1)}%)
- Total achats BIO (HT) : ${stats.totalBio.toFixed(2)} € (${stats.bioPercent.toFixed(1)}%)
- Détails par label : ${JSON.stringify(stats.labelBreakdown)}

Le rapport doit contenir :
1. Un titre officiel.
2. Un résumé de la situation actuelle (avec les chiffres clés).
3. Une évaluation de la conformité EGALIM (Rappel : L'objectif légal est de 50% de produits durables/qualité dont 20% de bio).
4. Des recommandations pour s'améliorer si les objectifs ne sont pas atteints, ou des félicitations si c'est le cas.
Reste concis, clair, professionnel et encourageant. Utilise des emojis de manière professionnelle.
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', errorText);
      return Response.json({ error: 'Erreur lors de la génération avec Gemini' }, { status: 500 });
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Erreur de génération du rapport.";

    return Response.json({ report: generatedText });

  } catch (error: any) {
    console.error('Gemini Route Error:', error);
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
