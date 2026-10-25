# KrisCreates — portfolio

[kriscreates.co.uk](https://kriscreates.co.uk) — React 19, Vite and three.js, prerendered
at build time and deployed on Vercel.

The site is a place rather than a page. You arrive as a craft dropping out of the sky,
winding twice round head office before levelling out over the road, and from there you fly
a street. Each product has a building on it — a casino, a services, a card shop, a works —
and each is running that product's own footage on its own screens. Drawing level with one
turns the camera onto it; pressing it drives you up to the frontage and opens the write-up
over the world.

Every word of the site is in the markup and prerendered, so it reads with JavaScript off
and is crawlable by anything that asks.

## The products it shows

| Project | What it is | Runtime |
| --- | --- | --- |
| [CompKit Game Engine](https://compkit.kriscreates.co.uk) | Commercial WooCommerce plugin suite, nine game modules, own licence server | PHP 8 · WordPress · WooCommerce · HTML5 canvas |
| Truck It Lets Park | HGV overnight parking, 4,581 stops built from OpenStreetMap | React Native · Expo · MapLibre · Python |
| [Pokéllectr](https://play.google.com/store/apps/details?id=com.sailscards.trg) | Card scanning, grading and eBay listing, 20k-card offline database | React Native · ML Kit OCR |
| ClippD | Long video in, captioned vertical clips out, published automatically | Python · FastAPI · ffmpeg |

## Layout

```
src/
  data.js                 every string on the site — projects, counters, office, links
  entry-server.jsx        build-time SSR entry (prerender only, never shipped)
  App.jsx                 the state machine: boot -> street -> a project / a page
  styles.css              tokens and all styling, including the boot and the glitch
  components/
    Counter.jsx           credential counter, counts up on scroll
    ProjectView.jsx       a project's page: title card, numbered walkthrough, facts
  three/
    Stage.jsx             the canvas, fixed behind the whole page
    layout.js             the road as maths — the block, where each venue stands,
                          which side of the street it is on, where head office is
    CameraRig.jsx         one number (distance along the road) and everything that
                          moves it: throttle, drag, drive-to-frontage, the fly-in
    Venue.jsx             the four buildings, their screens and their signs
    Hq.jsx                head office: a storey per product, and reception
    Ship.jsx              the craft, flying the same road a fixed distance ahead
    Streets.jsx           carriageway, kerbs, lamp standards, slip roads
    Cyberspace.jsx        floor, skyline, horizon
    textures.js           canvas-drawn labels, grid and film (no external assets)
public/
  clips/                  per-product footage, with a smaller cut for phones
  shots/                  screenshots, device mockups, hero billboards
scripts/
  prerender.mjs           renders <App /> to static markup into dist/index.html
```

Because the camera and the craft read the same number, they can never disagree about where
the road went — including through the corners, which the craft rounds before you do.

## Things worth knowing if you touch the 3D

- **The fly-in lands on the craft's own seat.** The arrival spiral is built to end on the
  exact spot the craft occupies in normal flight, rather than being faded out near it. That
  is what makes the hand-off invisible.
- **Timing is off the clock, not accumulated frame deltas.** Deltas are clamped so a stutter
  can't fling the camera, which means on a slow device they stop adding up to real seconds.
  The arrival learned this the hard way.
- **Nothing opaque goes in front of a screen or a sign**, and anything behind one keeps a
  clear tenth of a unit. A screen a hundredth of a unit in front of its own backing panel
  loses the depth test at street distance and renders dead black.
- **One video plays at a time** — the frontage you are coming up on — and nothing is fetched
  until you first draw level with one.
- **Lights are the expensive thing, not meshes.** Every light is evaluated on every lit pixel
  on screen, wherever it stands. Nineteen of them took an integrated-graphics laptop to about
  20 fps; the budget is now 5 point + 2 spot. A venue's own lights (`Lamp` in `Venue.jsx`)
  exist only while it is the featured one, and every venue carries exactly two so the count
  never changes — a change in the count recompiles every material at once. Add a light only
  by taking one away. Render resolution is capped at 1.25 and drops to 1 if fps sags.
- **Scrolling never moves the camera.** Not the wheel, not a vertical swipe, not reading down
  a write-up. Visitors scroll by reflex and the street lurching under them was the most
  confusing thing on the site; the GO and back buttons are how you travel.
- **The loading screen must always be able to leave.** It is in the prerendered markup, so it
  has a CSS timeout and a `<noscript>` rule as well as the script. With no WebGL (school
  laptops with acceleration disabled by policy) the stage is never mounted and the page shows
  at once. The build targets Chrome 87 for school Chromebooks stuck on old versions.

## Prerendering

`npm run build` runs three steps: the client build, an SSR build of `src/entry-server.jsx`,
then `scripts/prerender.mjs`, which renders `<App />` to static markup and injects it into
`dist/index.html` inside `#root`.

Without this the shipped body was `<div id="root"></div>`. Googlebot renders JS and coped,
but Bing and the AI crawlers (GPTBot, PerplexityBot, ClaudeBot) mostly don't — so the
outbound **CompKit Game Engine** links and the whole project write-up were invisible to
them. That was the only inbound link CompKit had.

Notes for anyone touching this:

- **Every project's page is in the DOM at all times**, with `hidden` on the closed ones.
  That is deliberate: it is what puts all four write-ups into the static markup (~36k
  characters) rather than only the open one. Don't change it to render just the active one.
- It is **static** markup, not hydration markup. `main.jsx` still uses `createRoot`, which
  discards these children and mounts fresh. So the source has no hydration constraints — but
  don't switch to `hydrateRoot` without revisiting `unhide()`.
- `Stage` (three.js) is `lazy()` behind `<Suspense fallback={null}>`, so it renders to
  nothing on the server. No WebGL at build time. Keep it that way — a direct three.js import
  in `App.jsx` would break the build.
- The script **fails the build** if the markup contains no CompKit link, so this can't
  silently regress.

## Commands

```bash
npm install
npm run dev      # http://localhost:5188
npm run build
npm run lint
```

---

Built and maintained by Kris Sull — [kriscreates.co.uk](https://kriscreates.co.uk) ·
hello@kriscreates.co.uk
