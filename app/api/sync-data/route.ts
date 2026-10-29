import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { NextRequest } from 'next/server';

// Map of sync data types to their Google Sheets tab names
const SHEET_NAMES: Record<string, string> = {
  stock: 'SYNC_STOCK',
  settings: 'SYNC_SETTINGS',
  invoice_history: 'SYNC_INVOICE_HISTORY',
  effectifs: 'SYNC_EFFECTIFS',
  menus: 'SYNC_MENUS',
};

function getAuth() {
  return new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function getSpreadsheetId(): string {
  const id = process.env.SPREADSHEET_ID;
  if (!id || id === 'REMPLACER_PAR_VOTRE_ID_DE_TABLEAU') {
    throw new Error("L'ID du tableau Google Sheets n'est pas configuré dans .env.local");
  }
  return id;
}

/**
 * Ensure the target sheet tab exists, create it if not.
 */
async function ensureSheetExists(sheets: any, spreadsheetId: string, sheetName: string) {
  try {
    const resp = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheets = resp.data.sheets?.map((s: any) => s.properties?.title) || [];
    
    if (!existingSheets.includes(sheetName)) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: { title: sheetName }
            }
          }]
        }
      });
    }
  } catch (error: any) {
    // If we can't check/create, we'll let the subsequent read/write fail with a clearer error
    console.error(`Erreur lors de la vérification/création de l'onglet "${sheetName}":`, error.message);
  }
}

/**
 * GET /api/sync-data?type=stock
 * Reads the full JSON blob from the specified sheet tab.
 * The data is stored as a single JSON string in cell A1.
 */
export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get('type');
    if (!type || !SHEET_NAMES[type]) {
      return Response.json(
        { error: `Type invalide. Types supportés: ${Object.keys(SHEET_NAMES).join(', ')}` },
        { status: 400 }
      );
    }

    const sheetName = SHEET_NAMES[type];
    const spreadsheetId = getSpreadsheetId();
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    await ensureSheetExists(sheets, spreadsheetId, sheetName);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1`,
    });

    const rawValue = response.data.values?.[0]?.[0];

    if (!rawValue) {
      return Response.json({ data: null, timestamp: null });
    }

    // The cell contains a JSON object with { data, timestamp }
    try {
      const parsed = JSON.parse(rawValue);
      return Response.json({
        data: parsed.data ?? null,
        timestamp: parsed.timestamp ?? null,
      });
    } catch {
      // Fallback: raw data without timestamp wrapper
      return Response.json({ data: JSON.parse(rawValue), timestamp: null });
    }
  } catch (error: any) {
    console.error('Sync Read Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/sync-data
 * Writes the full JSON blob to the specified sheet tab.
 * Body: { type: "stock", data: [...], timestamp: "ISO string" }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data, timestamp } = body;

    if (!type || !SHEET_NAMES[type]) {
      return Response.json(
        { error: `Type invalide. Types supportés: ${Object.keys(SHEET_NAMES).join(', ')}` },
        { status: 400 }
      );
    }

    const sheetName = SHEET_NAMES[type];
    const spreadsheetId = getSpreadsheetId();
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    await ensureSheetExists(sheets, spreadsheetId, sheetName);

    // Store as a single JSON blob in A1 with a timestamp wrapper
    const payload = JSON.stringify({
      data,
      timestamp: timestamp || new Date().toISOString(),
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[payload]],
      },
    });

    return Response.json({ success: true, timestamp: timestamp || new Date().toISOString() });
  } catch (error: any) {
    console.error('Sync Write Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
