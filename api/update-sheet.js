import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { csvData } = req.body;
  const spreadsheetId = '1gLxTk9bfXxP5jnvo73ua7S4VdABDV7-gA-011-W15wk';

  if (!process.env.GOOGLE_CREDENTIALS) {
    return res.status(500).json({ error: "Secret Key (GOOGLE_CREDENTIALS) not found in Vercel settings." });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // This Regex handles commas inside quotes correctly
    const parseCSVLine = (line) => {
      const result = [];
      let cur = '';
      let inQuotes = false;
      for (let char of line) {
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else cur += char;
      }
      result.push(cur.trim());
      return result;
    };

    const rows = csvData.trim().split('\n').map(parseCSVLine);

    // 1. Clear existing data
    await sheets.spreadsheets.values.clear({ spreadsheetId, range: 'Sheet1!A:Z' });

    // 2. Upload new data
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'USER_ENTERED',
      resource: { values: rows },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Sync Failed: " + error.message });
  }
}
