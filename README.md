# KrisCreates — portfolio

Personal portfolio for [kriscreates.co.uk](https://kriscreates.co.uk). React 19 + Vite,
deployed on Vercel.

The site is one place rather than a page. It boots like a screen coming on,
drops you into a cyberspace you fly around with the mouse, and opening a
project glitches its own page in over that world — the array keeps turning
behind the glass, and how far you have read drives the camera.

## Projects on the site

| Volume | Project | Runtime |
| ------ | ------- | ------- |
| VOL_01 | [CompKit Game Engine](https://compkit.kriscreates.co.uk) | WordPress / WooCommerce / PHP |
| VOL_02 | Truck It Lets Park | React Native · Expo · MapLibre, dataset built in Python from OSM |
| VOL_03 | Pokellectr | React Native · Expo · ML Kit OCR |
| VOL_04 | ClippD | Python · FastAPI · ffmpeg |

## Layout

```
src/
  data.js                 every string on the site — projects, counters, links
  entry-server.jsx        build-time SSR entry (prerender only, never shipped)
  App.jsx                 the state machine: boot -> array -> a volume / a page
  styles.css              tokens + all styling, including the boot and the glitch
  components/
    Counter.jsx           credential counter with count-up on scroll
    ProjectView.jsx       a volume's page: title card, numbered walkthrough, facts
  three/
    Stage.jsx             the canvas, fixed behind the whole page
    CameraRig.jsx         drag-to-fly in the array; a guided flight while reading
    Cyberspace.jsx        floor, skyline, data streams, horizon — the world
    Rack.jsx              the array and its drive bays
    Panels.jsx            floating project screens, tethered to their bay
    layout.js             shared geometry + a seeded PRNG
    textures.js           canvas-drawn labels and grid (no external assets)
public/shots/             project screenshots and the hero billboards
scripts/
  heroes.py               the billboards on the 3D screens
  og-cover.py             the link-preview cover
  social.py               Facebook profile/cover, LinkedIn banner
  fb-posts.py             the Facebook post cards
```

### The three states

`boot` is pure CSS so it paints on the first frame — which also covers the
three.js chunk still downloading. `space` is the array: the canvas is fixed
and full bleed, `<main>` is `pointer-events: none` so drags reach it, and the
HUD keeps to the left half. `project` flies the camera onto that drive and
opens the write-up over the world.

A deck is `display: none` until it opens, and showing an element restarts its
CSS animation — so the glitch-in needs no JavaScript at all.

## Prerendering

`npm run build` runs three steps: the client build, an SSR build of
`src/entry-server.jsx`, then `scripts/prerender.mjs`, which renders `<App />` to
static markup and injects it into `dist/index.html` inside `#root`.

Without this the shipped body was `<div id="root"></div>`. Googlebot renders JS
and coped, but Bing and the AI crawlers (GPTBot, PerplexityBot, ClaudeBot) mostly
don't — so the outbound **CompKit Game Engine** links and the whole project
write-up were invisible to them. That was the only inbound link CompKit had.

Notes for anyone touching this:

- **Every project's page is in the DOM at all times**, with `hidden` on the
  closed ones. That is deliberate: it is what puts all four write-ups into the
  static markup (~34k characters) rather than only the open one. Don't change
  it to render just the active project.
- It is **static** markup, not hydration markup. `main.jsx` still uses
  `createRoot`, which discards these children and mounts fresh. So the source has
  no hydration constraints — but don't switch to `hydrateRoot` without revisiting
  `unhide()` below.
- `Stage` (three.js) is `lazy()` behind `<Suspense fallback={null}>`, so it
  renders to nothing on the server. No WebGL needed at build time. Keep it that
  way — a direct three.js import in `App.jsx` would break the build.
- `unhide()` in the prerender script rewrites any inline `opacity: 0` to
  visible. Nothing animates with inline styles any more, but it is harmless
  and still guards against it coming back.
- The script **fails the build** if the markup contains no CompKit link, so this
  can't silently regress.

## Commands

```bash
npm install
npm run dev      # http://localhost:5188
npm run build
npm run lint
```
