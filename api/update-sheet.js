import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { csvData } = req.body;
  const spreadsheetId = '1gLxTk9bfXxP5jnvo73ua7S4VdABDV7-gA-011-W15wk';

  // --- SAFETY CHECK ---
  if (!process.env.GOOGLE_CREDENTIALS) {
    return res.status(500).json({ 
      error: "Vercel Environment Variable 'GOOGLE_CREDENTIALS' is missing or empty." 
    });
  }

  try {
    // Parse credentials securely
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Convert text to 2D Array (Handles tabs or commas)
    const rows = csvData.trim().split('\n').map(row => {
      return row.includes('\t') ? row.split('\t') : row.split(',');
    });

    // Clear Sheet1 from Column A to Z
    await sheets.spreadsheets.values.clear({ 
      spreadsheetId, 
      range: 'Sheet1!A:Z' 
    });

    // Write new data
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'USER_ENTERED',
      resource: { values: rows },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Server Error: " + error.message });
  }
}
