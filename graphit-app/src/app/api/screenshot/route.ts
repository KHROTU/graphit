import { NextResponse } from 'next/server';
import playwright from 'playwright-core';
import chromium from '@sparticuz/chromium';

type LaunchOptions = Parameters<typeof playwright.chromium.launch>[0];

export async function POST(request: Request) {
  try {
    const { urlPath, padding } = await request.json();

    if (!urlPath) {
      return new NextResponse('URL path is required', { status: 400 });
    }

    const isProduction = process.env.NODE_ENV === 'production';

    const launchOptions: LaunchOptions = isProduction
      ? { // prod
          args: chromium.args,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
        }
      : { // dev
          headless: true,
        };

    const browser = await playwright.chromium.launch(launchOptions);

    const page = await browser.newPage({
        deviceScaleFactor: 2
    });
    
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const fullUrl = `${baseUrl}${urlPath}`;
    
    await page.goto(fullUrl, { waitUntil: 'load' });
    
    await page.waitForSelector('[data-testid="diagram-container"]', { state: 'visible' });
    await page.waitForTimeout(1500);

    const element = page.locator('[data-testid="diagram-container"]');
    
    const box = await element.boundingBox();
    if (!box) {
        throw new Error("Could not get the bounding box of the diagram element.");
    }
    
    const screenshotBuffer = await page.screenshot({
        animations: 'disabled',
        clip: {
            x: box.x - padding,
            y: box.y - padding,
            width: box.width + padding * 2,
            height: box.height + padding * 2,
        }
    });

    await browser.close();

    return new NextResponse(screenshotBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': screenshotBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Screenshot API Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new NextResponse(JSON.stringify({ error: 'Failed to generate screenshot.', details: errorMessage }), { status: 500 });
  }
}