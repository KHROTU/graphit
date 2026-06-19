import { glob } from 'glob';
import { readFileSync, writeFileSync } from 'fs';

const dirs = ['graphit-app/src/app', 'graphit-app/src/components', 'graphit-app/src/lib', 'graphit-app/src/content'];
const extGlob = '**/*.{ts,tsx,js,css}';

function processFile(filePath) {
  const original = readFileSync(filePath, 'utf-8');
  const lines = original.split('\n');
  let inTemplate = false;
  let inSingleString = false;
  let inDoubleString = false;
  let inRegex = false;
  let inBlockComment = false;
  const outputLines = [];
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const wasInTemplate = inTemplate;
    let inSingleLineComment = false;
    let escapeNext = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (inSingleLineComment) {
        break;
      }
      if (inRegex) {
        if (ch === '\\') { escapeNext = true; continue; }
        if (ch === '/') { inRegex = false; }
        continue;
      }
      if (inBlockComment) {
        if (ch === '*' && line[i + 1] === '/') {
          inBlockComment = false;
          i++;
        }
        continue;
      }
      const insideCode = inTemplate || inSingleString || inDoubleString;
      if (ch === '/' && line[i + 1] === '/' && !insideCode) {
        inSingleLineComment = true;
        i++;
        continue;
      }
      if (ch === '/' && line[i + 1] === '*' && !insideCode) {
        inBlockComment = true;
        i++;
        continue;
      }
      if (ch === '/' && line[i + 1] !== '/' && line[i + 1] !== '*' && !insideCode) {
        let k = i - 1;
        while (k >= 0 && (line[k] === ' ' || line[k] === '\t')) k--;
        if (k >= 0) {
          const prev = line[k];
          if ('(=,!?:|&[~{+-;'.includes(prev) || prev === '<' || prev === '>') {
            inRegex = true;
            continue;
          }
        }
      }
      if (ch === '\\') {
        escapeNext = true;
        continue;
      }
      if (ch === "'" && !inDoubleString && !inTemplate) {
        inSingleString = !inSingleString;
        continue;
      }
      if (ch === '"' && !inSingleString && !inTemplate) {
        inDoubleString = !inDoubleString;
        continue;
      }
      if (ch === '`' && !inSingleString && !inDoubleString) {
        inTemplate = !inTemplate;
      }
    }
    const trimmed = line.trim();
    if (trimmed.length > 0 || wasInTemplate) {
      outputLines.push(line);
    }
  }
  const result = outputLines.join('\n');
  if (result !== original) {
    writeFileSync(filePath, result, 'utf-8');
    console.log(`  cleaned: ${filePath}`);
  }
}

async function main() {
  let totalCount = 0;
  for (const dir of dirs) {
    const pattern = `${dir}/${extGlob}`;
    const files = await glob(pattern, { nodir: true, dot: true });
    console.log(`\n${dir}/ (${files.length} files)`);
    for (const file of files) {
      processFile(file);
      totalCount++;
    }
  }
  console.log(`\nDone. Processed ${totalCount} files.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
