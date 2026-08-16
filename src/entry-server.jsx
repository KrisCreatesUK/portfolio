/* =========================================================
   SSR ENTRY — build-time prerender only
   ---------------------------------------------------------
   This never runs in the browser. `scripts/prerender.mjs`
   imports it after the SSR build and injects the result into
   dist/index.html, so crawlers that don't execute JavaScript
   (Bingbot, GPTBot, PerplexityBot, ClaudeBot) get the real
   page copy and the real outbound links.

   Stage (three.js) is lazy() behind <Suspense fallback={null}>,
   so it resolves to nothing here — no WebGL needed on the server.
   ========================================================= */

import { renderToStaticMarkup } from "react-dom/server";
import App from "./App.jsx";

export function render() {
  return renderToStaticMarkup(<App />);
}
