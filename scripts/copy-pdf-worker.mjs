import { existsSync, mkdirSync, copyFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

// Ensure public directory exists
const publicDir = join(projectRoot, "public");
if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
}

// Candidate paths for the worker file
const candidatePaths = [
  "node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
  "node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs",
  "node_modules/pdfjs-dist/build/pdf.worker.min.js",
  "node_modules/pdfjs-dist/legacy/build/pdf.worker.min.js",
];

let sourcePath = null;
let targetFileName = null;

// Find the first existing candidate
for (const candidate of candidatePaths) {
  const fullPath = join(projectRoot, candidate);
  if (existsSync(fullPath)) {
    sourcePath = fullPath;
    // Determine target filename based on source extension
    if (candidate.endsWith(".mjs")) {
      targetFileName = "pdf.worker.min.mjs";
    } else {
      targetFileName = "pdf.worker.min.js";
    }
    break;
  }
}

if (!sourcePath) {
  console.error("❌ PDF.js worker file not found in any candidate location:");
  candidatePaths.forEach((p) => console.error(`   - ${p}`));
  process.exit(1);
}

const targetPath = join(publicDir, targetFileName);

try {
  copyFileSync(sourcePath, targetPath);
  console.log(`✅ Copied PDF.js worker: ${sourcePath} -> ${targetPath}`);
} catch (error) {
  console.error(`❌ Failed to copy PDF.js worker: ${error.message}`);
  process.exit(1);
}

