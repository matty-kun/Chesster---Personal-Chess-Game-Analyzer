/**
 * stockfish-worker.js
 *
 * Loaded as a Web Worker from /public/engine/stockfish-worker.js.
 * Bootstraps the Stockfish 18 single-threaded WASM module and
 * forwards all UCI messages bidirectionally between the main thread
 * and the engine.
 */

// importScripts is available in Web Worker scope
importScripts("/engine/stockfish-18-single.js");

// Stockfish 18 exposes a global `Stockfish` factory via importScripts
Stockfish().then(function (sf) {
  // Forward engine output → main thread
  sf.addMessageListener(function (line) {
    postMessage(line);
  });

  // Forward main thread commands → engine
  self.onmessage = function (e) {
    sf.postMessage(e.data);
  };
});
