import { exec } from 'child_process';
import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;
const PREVIEW_DIR = 'graphit-app/public/previews';
const CONCURRENCY = 4;

async function getAllDiagramUrls() {
  const structurePath = path.resolve('graphit-app/src/content/structure.json');
  const fileContent = await fs.readFile(structurePath, 'utf-8');
  const structure = JSON.parse(fileContent);
  const urls = [];

  for (const level of structure) {
    for (const subject of level.subjects) {
      for (const topic of subject.topics) {
        for (const diagram of topic.diagrams) {
          if (!diagram.previewImage) continue;
          
          const diagramId = path.basename(diagram.previewImage, '.png');
          urls.push({
            url: `/${level.levelId}/${subject.subjectId}/${diagram.diagramId}`,
            id: diagramId,
          });
        }
      }
    }
  }
  const uniqueUrls = Array.from(new Map(urls.map(item => [item.id, item])).values());
  return uniqueUrls;
}

async function waitForServerReady() {
    console.log('Waiting for Next.js dev server...');
    const timeout = 60000;
    const interval = 2000;
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
        try {
            const response = await fetch(BASE_URL, { signal: AbortSignal.timeout(1000) });
            if (response.ok) {
                console.log('Dev server is ready!');
                return true;
            }
        } catch (error) {
        }
        await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error('Server did not become ready in time.');
}

async function takeScreenshot(browser, { url, id }) {
  const screenshotPath = path.join(PREVIEW_DIR, `${id}.png`);
  
  try {
    await fs.access(screenshotPath);
    console.log(`- Skipping ${id}, preview already exists.`);
    return;
  } catch (e) {
  }

  const page = await browser.newPage({ deviceScaleFactor: 1.5 });
  try {
    const fullUrl = `${BASE_URL}${url}`;
    console.log(`+ Navigating to ${fullUrl}...`);
    
    await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForSelector('[data-testid="diagram-container"]', { state: 'visible', timeout: 30000 });
    await page.waitForTimeout(2000);

    const element = page.locator('[data-testid="diagram-container"]');
    
    console.log(`  > Taking screenshot of ${id}...`);
    await element.screenshot({ path: screenshotPath, animations: 'disabled' });
    console.log(`  ✔ Saved preview to ${screenshotPath}`);
  } catch (error) {
    console.error(`  ❌ Failed to generate preview for ${url}:`, error.message);
  } finally {
    await page.close();
  }
}

async function generatePreviews() {
  console.log('Starting preview generation...');
  
  await fs.mkdir(PREVIEW_DIR, { recursive: true });

  console.log('Starting Next.js dev server...');
  const devServer = exec('npm run dev', { cwd: 'graphit-app' });
  
  devServer.stdout?.on('data', (data) => console.log(`[SERVER]: ${data.toString().trim()}`));
  devServer.stderr?.on('data', (data) => console.error(`[SERVER ERR]: ${data.toString().trim()}`));

  try {
    await waitForServerReady();

    const browser = await chromium.launch();
    const urls = await getAllDiagramUrls();
    console.log(`Found ${urls.length} unique diagrams to process.`);

    for (let i = 0; i < urls.length; i += CONCURRENCY) {
        const batch = urls.slice(i, i + CONCURRENCY);
        await Promise.all(batch.map(item => takeScreenshot(browser, item)));
    }

    await browser.close();
    console.log('Preview generation complete!');
  } catch (error) {
    console.error('An error occurred during preview generation:', error);
  } finally {
    console.log('Stopping Next.js dev server...');
    devServer.kill('SIGINT');
  }
}

generatePreviews();