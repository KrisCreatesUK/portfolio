/* =========================================================
   PRERENDER — inject static markup into dist/index.html
   ---------------------------------------------------------
   Run by `npm run build`, after both the client and SSR
   builds. Reads dist-ssr/entry-server.js, renders <App /> to
   static markup and drops it inside #root.

   Why: kriscreates.co.uk is a Vite SPA, so the shipped
   index.html body was just <div id="root"></div>. Googlebot
   renders JS and coped, but Bing and the AI crawlers largely
   don't — which meant the outbound "CompKit Game Engine"
   links and the whole project write-up were invisible to
   them. This closes that.

   The markup is renderToStaticMarkup, NOT hydration markup:
   main.jsx still uses createRoot, which discards these
   children and mounts fresh. Identical output, no mismatch
   warnings, no hydration constraints on the source.
   ========================================================= */

import { readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = path.join(root, "dist", "index.html");
const ssrDir = path.join(root, "dist-ssr");
const ssrEntry = path.join(ssrDir, "entry-server.js");

const PLACEHOLDER = '<div id="root"></div>';

/* Framer Motion serialises `initial` as inline style, so the hero h1,
   the lede and the mounted project panel would ship as opacity:0 —
   text a crawler may treat as hidden. The browser animates them to
   visible on mount; the static copy has to start visible instead. */
function unhide(html) {
  return html
    .replace(/opacity:\s*0(?=\s*[;"])/g, "opacity:1")
    .replace(/transform:\s*translate[XYZ3d]*\([^)]*\)\s*;?/g, "");
}

if (!existsSync(ssrEntry)) {
  throw new Error(`Missing SSR bundle at ${ssrEntry} — run the --ssr build first.`);
}

const { render } = await import(pathToFileURL(ssrEntry).href);
const markup = unhide(render());

if (!markup.includes("compkit.kriscreates.co.uk")) {
  throw new Error("Prerendered markup has no CompKit link — the build would ship the very gap this exists to close.");
}

const index = readFileSync(indexPath, "utf8");
if (!index.includes(PLACEHOLDER)) {
  throw new Error(`Could not find ${PLACEHOLDER} in dist/index.html — did the template change?`);
}

writeFileSync(indexPath, index.replace(PLACEHOLDER, `<div id="root">${markup}</div>`), "utf8");
rmSync(ssrDir, { recursive: true, force: true });

const links = (markup.match(/compkit\.kriscreates\.co\.uk/g) || []).length;
console.log(`prerender: ${markup.length.toLocaleString()} chars into #root, ${links} CompKit links`);
