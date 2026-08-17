import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { DayData } from '../../lib/types';

export async function POST(req: Request) {
    try {
        const { data } = await req.json() as { data: DayData[] };

        if (!process.env.SPREADSHEET_ID || process.env.SPREADSHEET_ID === 'REMPLACER_PAR_VOTRE_ID_DE_TABLEAU') {
            throw new Error("L'ID du tableau Google Sheets n'est pas configuré dans .env.local");
        }

        const auth = new JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Fix newlines for key
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // Prepare rows to insert
        // Columns: DATE | PRODUIT | QUANTITE | PRIX U | TOTAL HT | TVA | TTC | BIO
        const rows: (string | number | boolean)[][] = [];

        data.forEach(day => {
            day.ligne_facture.forEach(line => {
                rows.push([
                    day.jour,
                    line.produit,
                    line.quantite,
                    line.prix_unitaire,
                    line.total_ht,
                    line.tva,
                    line.ttc,
                    line.est_bio ? 'OUI' : 'NON'
                ]);
            });
        });

        // Append to "Feuille 1" (or make this configurable)
        // Warning: The User must ensure "Feuille 1" exists or change this name.
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Feuille 1!A:H',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: rows,
            },
        });

        return new Response(JSON.stringify({ success: true, updatedCells: response.data.updates?.updatedCells }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Sheets Sync Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
