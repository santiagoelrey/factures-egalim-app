import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

export const dynamic = 'force-dynamic';

export async function GET() {
    const results = {
        sheets: { status: 'pending', message: '' },
        ai: { status: 'pending', message: '' },
        env: {
            openAiKey: !!process.env.OPENAI_API_KEY,
            serviceEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            privateKey: !!process.env.GOOGLE_PRIVATE_KEY,
            sheetId: !!process.env.SPREADSHEET_ID,
        }
    };

    // 1. Verify Google Sheets
    try {
        if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
            throw new Error("Variables GOOGLE_SERVICE_ACCOUNT_EMAIL ou GOOGLE_PRIVATE_KEY manquantes");
        }

        const auth = new JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
        });

        results.sheets.status = 'success';
        results.sheets.message = 'Connexion Google Sheets réussie ✅';

    } catch (error: any) {
        results.sheets.status = 'error';
        results.sheets.message = error.message;
    }

    // 2. Verify OpenAI
    try {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("Variable OPENAI_API_KEY manquante");
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: 'Réponds uniquement "OK"' }],
                max_tokens: 5,
            }),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err?.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const reply = data?.choices?.[0]?.message?.content?.trim();

        results.ai.status = 'success';
        results.ai.message = `OpenAI GPT-4o opérationnel ✅ — Réponse: "${reply}"`;

    } catch (error: any) {
        results.ai.status = 'error';
        results.ai.message = error.message;
    }

    return Response.json(results);
}
