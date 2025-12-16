import { getBrowser, closeBrowser } from './browser';

export async function fetchVisualData(city: string, district: string, island: string, parcel: string) {
    let browser;
    try {
        browser = await getBrowser();
        const page = await browser.newPage();

        // Construct a search query for Google Maps
        // Note: Pinpointing exact Ada/Parsel on generic Google Maps is hard without specific GIS data.
        // We will try to search for the neighborhood + block info if possible, or just the location status.
        // For specific parsel query, TKGM is needed but it has CAPTCHA.
        // Best effort: Search for the neighborhood and take a screenshot.

        const query = `${city} ${district} Ada ${island} Parsel ${parcel}`;
        const encodedQuery = encodeURIComponent(query);
        const googleMapsUrl = `https://www.google.com/maps/search/${encodedQuery}`;

        await page.setViewport({ width: 800, height: 600 });
        await page.goto(googleMapsUrl, { waitUntil: 'networkidle2' });

        // Accept cookies if needed (simple check)
        try {
            const buttons = await page.$$('button');
            // Simple heuristic to click "Accept all" or similar if it appears
            // This is fragile and depends on locale
        } catch (e) {
            // Ignore
        }

        // Wait for map to load
        await new Promise(r => setTimeout(r, 2000));

        // Take screenshot
        const screenshot = await page.screenshot({ encoding: 'base64' });
        const dataUrl = `data:image/png;base64,${screenshot}`;

        return {
            imageUrl: dataUrl,
            mapUrl: googleMapsUrl
        };

    } catch (error) {
        console.error("Visual fetch failed:", error);
        return null;
    } finally {
        await closeBrowser(browser);
    }
}
