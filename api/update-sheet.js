import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { csvData } = req.body;
  const spreadsheetId = '1gLxTk9bfXxP5jnvo73ua7S4VdABDV7-gA-011-W15wk';

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Logic to handle both comma and tab separated values
    const rows = csvData.trim().split('\n').map(row => {
        // If it looks like tab-separated, split by tab, else comma
        return row.includes('\t') ? row.split('\t') : row.split(',');
    });

    // 1. Clear the old data
    await sheets.spreadsheets.values.clear({ spreadsheetId, range: 'Sheet1!A:Z' });

    // 2. Add the new data
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'USER_ENTERED',
      resource: { values: rows },
    });

    res.status(200).json({ message: 'Success' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
