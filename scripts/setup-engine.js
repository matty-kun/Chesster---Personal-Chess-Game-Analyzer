/**
 * setup-engine.js
 *
 * Copies Stockfish 18 WASM engine files from node_modules into public/engine/
 * so they are served statically by Next.js.
 *
 * Run after `npm install`:
 *   npm run setup:engine
 */

const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "node_modules", "stockfish", "bin");
const DEST = path.join(__dirname, "..", "public", "engine");

const FILES = [
  "stockfish-18-single.js",
  "stockfish-18-single.wasm",
];

if (!fs.existsSync(DEST)) {
  fs.mkdirSync(DEST, { recursive: true });
  console.log(`Created ${DEST}`);
}

for (const file of FILES) {
  const src = path.join(SRC, file);
  const dest = path.join(DEST, file);

  if (!fs.existsSync(src)) {
    console.error(`ERROR: ${src} not found. Run 'npm install' first.`);
    process.exit(1);
  }

  fs.copyFileSync(src, dest);
  const size = (fs.statSync(dest).size / 1024 / 1024).toFixed(1);
  console.log(`Copied ${file} (${size} MB)`);
}

// Also create the WASM alias the worker expects
const wasmSrc  = path.join(DEST, "stockfish-18-single.wasm");
const wasmDest = path.join(DEST, "stockfish-worker.wasm");
fs.copyFileSync(wasmSrc, wasmDest);
console.log("Created stockfish-worker.wasm alias");

console.log("\nEngine setup complete. You can now run `npm run dev`.");
