# KrisCreates — portfolio

Personal portfolio for [kriscreates.co.uk](https://kriscreates.co.uk). React 19 + Vite,
deployed on Vercel.

The centrepiece is a live three.js storage array. Each drive bay is one project;
selecting a bay ejects the drive, pulls that project's screen to the front, and
mounts the write-up below.

## Projects on the site

| Volume | Project | Runtime |
| ------ | ------- | ------- |
| VOL_01 | [CompKit Game Engine](https://compkit.kriscreates.co.uk) | WordPress / WooCommerce / PHP |
| VOL_02 | FarmFolk | Next.js 16 · Prisma · PostgreSQL |
| VOL_03 | Truck Access Finder | React Native · Expo |

## Layout

```
src/
  data.js                 every string on the site — projects, counters, links
  entry-server.jsx        build-time SSR entry (prerender only, never shipped)
  App.jsx                 page shell: header, stage, sections, footer
  styles.css              tokens + all styling
  components/
    Counter.jsx           credential counter with count-up on scroll
    ProjectPanel.jsx      the mounted-volume write-up + screenshots
  three/
    Stage.jsx             canvas, lights, camera rig, floor, particles
    Rack.jsx              the array and its drive bays
    Panels.jsx            floating project screens, tethered to their bay
    layout.js             shared geometry + a seeded PRNG
    textures.js           canvas-drawn labels and grid (no external assets)
public/shots/             project screenshots
```

The three.js bundle is lazy-loaded, so the page shell paints before it arrives,
and a WebGL failure falls back to the HUD alone rather than a blank hero.

## Prerendering

`npm run build` runs three steps: the client build, an SSR build of
`src/entry-server.jsx`, then `scripts/prerender.mjs`, which renders `<App />` to
static markup and injects it into `dist/index.html` inside `#root`.

Without this the shipped body was `<div id="root"></div>`. Googlebot renders JS
and coped, but Bing and the AI crawlers (GPTBot, PerplexityBot, ClaudeBot) mostly
don't — so the outbound **CompKit Game Engine** links and the whole project
write-up were invisible to them. That was the only inbound link CompKit had.

Notes for anyone touching this:

- It is **static** markup, not hydration markup. `main.jsx` still uses
  `createRoot`, which discards these children and mounts fresh. So the source has
  no hydration constraints — but don't switch to `hydrateRoot` without revisiting
  `unhide()` below.
- `Stage` (three.js) is `lazy()` behind `<Suspense fallback={null}>`, so it
  renders to nothing on the server. No WebGL needed at build time. Keep it that
  way — a direct three.js import in `App.jsx` would break the build.
- Framer Motion serialises `initial` as an inline style, so the hero and the
  mounted panel would prerender at `opacity: 0`. `unhide()` in the prerender
  script rewrites those to visible; the browser still animates normally.
- The script **fails the build** if the markup contains no CompKit link, so this
  can't silently regress.

## Commands

```bash
npm install
npm run dev      # http://localhost:5188
npm run build
npm run lint
```
