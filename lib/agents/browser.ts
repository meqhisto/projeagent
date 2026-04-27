import puppeteer from 'puppeteer';

export async function getBrowser() {
    const browser = await puppeteer.launch({
        headless: true, // Set to false to see what's happening
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    return browser;
}

export async function closeBrowser(browser: any) {
    if (browser) {
        await browser.close();
    }
}
