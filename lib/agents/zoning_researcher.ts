import { getBrowser, closeBrowser } from './browser';

export async function researchZoningInfo(city: string, district: string, island: string, parcel: string) {
    let browser;
    try {
        browser = await getBrowser();
        const page = await browser.newPage();

        // Search for "Emsal" and "Imar Durumu"
        const query = `${city} ${district} Ada ${island} Parsel ${parcel} imar durumu emsal`;
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

        await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

        // Scrape search results (titles and snippets)
        const results = await page.evaluate(() => {
            const items = document.querySelectorAll('.g');
            const data = [];
            for (let i = 0; i < 5 && i < items.length; i++) {
                const title = items[i].querySelector('h3')?.textContent || '';
                const snippet = items[i].querySelector('.VwiC3b')?.textContent || ''; // Common class for snippets, might change
                data.push({ title, snippet });
            }
            return data;
        });

        // Simple heuristic analysis of snippets
        let kaks = null;
        let taks = null;
        const notesArray = [];

        // Regex for Kaks/Emsal: e.g., "Emsal: 1.5", "Kaks=2.0"
        // Regex for Taks: e.g., "Taks: 0.35"

        const combinedText = results.map(r => r.snippet + " " + r.title).join(" ");

        const emsalMatch = combinedText.match(/(?:emsal|kaks)\s*(?:=|:)?\s*(\d+[.,]\d+)/i);
        if (emsalMatch) {
            kaks = parseFloat(emsalMatch[1].replace(',', '.'));
        }

        const taksMatch = combinedText.match(/taks\s*(?:=|:)?\s*(\d+[.,]\d+)/i);
        if (taksMatch) {
            taks = parseFloat(taksMatch[1].replace(',', '.'));
        }

        notesArray.push(`Found ${results.length} search results.`);
        if (kaks) notesArray.push(`Potansiyel Emsal (Kaks): ${kaks}`);
        if (taks) notesArray.push(`Potansiyel Taks: ${taks}`);

        return {
            ks: kaks,
            taks: taks,
            notes: notesArray.join('\n'),
            sourceUrl: searchUrl
        };

    } catch (error) {
        console.error("Zoning research failed:", error);
        return null;
    } finally {
        await closeBrowser(browser);
    }
}
