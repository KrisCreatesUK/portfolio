/* =========================================================
   SITE DATA
   Single source of truth for every string on the site.
   ========================================================= */

export const profile = {
  name: "Kris Sull",
  handle: "KrisCreates",
  role: "Full-Stack Developer",
  location: "United Kingdom",
  email: "hello@kriscreates.co.uk",
  yearsBuilding: 15,
  tagline:
    "I build and ship complete products — the data pipeline, the API, the interface, the licensing, the deploy.",
  intro:
    "Four systems, four different runtimes. A commercial WordPress plugin suite with its own licence server, two native Android apps built on real data — one for lorry drivers, one for card collectors — and a Python video pipeline that turns long podcasts into published shorts. Same person on the schema, the game canvas, the OCR parser and the CSS.",
};

/* ---------------------------------------------------------
   CREDENTIAL COUNTER — every figure here is verifiable in
   the projects below. Nothing invented.
--------------------------------------------------------- */
export const counters = [
  { value: profile.yearsBuilding, suffix: "+", label: "Years coding", sub: "Self-taught" },
  { value: 4, suffix: "", label: "Runtimes shipped", sub: "PHP · Python · Native" },
  { value: 8, suffix: "", label: "Game modules live", sub: "CompKit premium" },
  { value: 11, suffix: "", label: "Products shipped", sub: "All still in service" },
];

export const readout = [
  "SYS :: KRISCREATES // FULL-STACK",
  "NODE :: UK / GMT+0",
  "STATE :: AVAILABLE FOR WORK",
  "LOAD :: 4 SYSTEMS IN SERVICE",
];

/* ---------------------------------------------------------
   PROJECTS — one per drive bay, top to bottom
--------------------------------------------------------- */
export const projects = [
  {
    id: "compkit",
    index: "01",
    code: "VOL_01",
    name: "CompKit Game Engine",
    kind: "Commercial WordPress product",
    status: "Live",
    statusTone: "live",
    year: "2025 — present",
    version: "v3.0.71",
    blurb:
      "A WooCommerce plugin suite that turns the instant-win result on an order confirmation page into a game the customer plays — scratch, spin, slots, claw, darts, race, balloon pop or shootout.",
    body: [
      "The free core is a full plugin in its own right: it hooks WooCommerce order completion, renders the reveal on the confirmation page, and holds back the confirmation email until every ticket has been played — otherwise the inbox spoils the result before the customer even lands on the page.",
      "On top sit eight premium game modules, each an HTML5 canvas engine licensed separately at £9.99 a month. Every module has its own admin settings page with a live device-emulating preview, global defaults with per-product overrides and a 'Use Global' fallback, and theme files — one JSON that re-skins a game from Galaxy Grab to Candy Catcher, importable at either level. Artwork is uploadable down to the trackside advertising boards inside the race track.",
      "The commercial side is mine too. A licence server validates subscriptions and serves every game engine remotely — nothing ships in the zip, so a stripped licence check leaves a plugin with no games in it. It builds white-label cores on demand for agencies, drives in-dashboard auto-updates, and stages every release to the demo sites first: customers only see a version once it's been played through and published from the vault.",
    ],
    highlights: [
      "8 premium canvas game engines, every one re-skinnable",
      "Licence API with remote engine delivery — no code in the zip",
      "Smart Email Delay Handler stops spoiler emails",
      "Live admin preview with device emulation",
      "Global defaults, per-product overrides, theme import/export",
      "White-label builds, staged releases, auto-update channel",
    ],
    stack: ["PHP 8", "WordPress", "WooCommerce", "JavaScript", "HTML5 Canvas", "MySQL", "REST API", "HMAC-signed delivery", "Licence server"],
    links: [
      { label: "compkit.kriscreates.co.uk", href: "https://compkit.kriscreates.co.uk", primary: true },
      { label: "Play a live demo", href: "https://demos.kriscreates.co.uk/compkit/" },
    ],
    accent: "#93F025",
    shot: "/shots/hero-compkit.webp",
    shotFit: "landscape",
    images: [
      { src: "/shots/compkit-scratchcard-play-black-gold.webp", caption: "Scratch Card — Black Gold theme, symbols game, sums game and prize vault" },
      { src: "/shots/compkit-slots-play-pharaohs-fortune.webp", caption: "Slot Machine — Pharaoh's Fortune, one ticket per spin" },
      { src: "/shots/compkit-grabclaw-play-candy-catcher.webp", caption: "Prize Grab Claw — Candy Catcher, results rail on the right" },
      { src: "/shots/compkit-racecar-play-rival-rush.webp", caption: "Race Car — Rival Rush, with a ticket per race and sponsor boards trackside" },
      { src: "/shots/compkit-darts-play-treasure-target.webp", caption: "Darts — Treasure Target, thrown from a pirate ship" },
      { src: "/shots/compkit-football-play-ocean-cup.webp", caption: "Penalty Shootout — Ocean Cup, aim, power and a keeper who dives" },
      { src: "/shots/compkit-balloonpop-play-pop-busters.webp", caption: "Balloon Pop — Pop Busters, auto-play or quick-play for big ticket counts" },
      { src: "/shots/compkit-spin-play-sunset-surprise.webp", caption: "Spin the Wheel — Sunset Surprise, reveal-all for the impatient" },
      { src: "/shots/compkit-admin.webp", caption: "Every game has this: the settings page with a live, device-emulating preview beside it" },
    ],
  },
  {
    id: "truck-it",
    index: "02",
    code: "VOL_02",
    name: "Truck It Lets Park",
    kind: "Native mobile app + data pipeline",
    status: "Closed testing",
    statusTone: "build",
    year: "2026",
    version: "Expo SDK 57",
    blurb:
      "A map app for HGV drivers that answers the question no sat-nav does at 8pm: where can I legally stop for the night without paying for it?",
    body: [
      "There is no national dataset of UK lay-bys or lorry parking — I checked data.gov.uk, the DfT lorry-parking surveys and the devolved studies, and every one is aggregate only. So the dataset is built from OpenStreetMap: Geofabrik extracts for Great Britain and Northern Ireland processed locally in Python, filtered to features with an explicit HGV, lay-by or rest-area signal, deduplicated, then enriched with nearby roads, rail, land use and administrative geography. 4,581 stops ship in the app, alongside 1,847 low bridges and weight limits, 2,514 forecourt shops a lorry can pull in to, and every service area with its showers, fuel brand and overnight price scraped from the operators' own pages.",
      "Honesty is the product. Nothing in OSM says a site permits overnight parking, so every location carries a classification that says exactly how much is known, and 'nobody has said' is shown as exactly that. Drivers fill the gaps: one-tap I've Been reports (parked OK, no room, moved on, not free), spaces left, photos of the way in, artic-OK and canopy-height reports on forecourts, and spots the map never had — all shared through a PHP/MySQL service with a trust dial from desk research to well used. Position is used once to sort by distance and never leaves the phone.",
      "The planning kit is the Pro tier at £1.99 a month: type two towns and every stop within two or five miles of the corridor is listed in the order you reach it with an arrival time, the driving-hours ring fades out anything you can't legally get to, offline map regions, fuel forecourts filtered to the brand your card runs on, and cab mode that dims the whole screen for a lay-by at 11pm. The map, the sites and reporting stay free for everyone — the shared data is the product, and nobody should be priced out of contributing to it.",
    ],
    highlights: [
      "4,581 free stops built from OSM extracts in Python",
      "Confidence-graded: 'nobody has said' is never dressed up",
      "Route planning: stops along the corridor, in order, with arrival times",
      "Driver reports, photos, spaces left and added spots, synced offline-first",
      "Low bridges, services, forecourt shops and fuel-card brands as layers",
      "Driving-hours ring, cab mode, offline map regions",
      "No ads, no accounts, no tracking",
    ],
    stack: ["React Native", "Expo", "TypeScript", "MapLibre", "OSRM", "Python", "pyosmium", "OpenStreetMap", "PHP", "MySQL", "Google Play Billing"],
    links: [
      { label: "hgvparking.kriscreates.co.uk", href: "https://hgvparking.kriscreates.co.uk", primary: true },
    ],
    accent: "#A78BFA",
    shot: "/shots/hero-truckit.webp",
    shotFit: "landscape",
    images: [
      { src: "/shots/truckit-route-map.webp", caption: "Birmingham to Carlisle — 192 free stops within five miles of the route, in the order you reach them" },
      { src: "/shots/truckit-filters.webp", caption: "Filters: artic OK, overnight OK, quiet, toilets, plus fuel brands and services on the map" },
      { src: "/shots/truckit-route-stops.webp", caption: "Route stops with distance off-route and the honest 'unknown' where nothing confirms overnight status" },
      { src: "/shots/truckit-splash.webp", caption: "Plan your night before your hours run out" },
    ],
  },
  {
    id: "pokellectr",
    index: "03",
    code: "VOL_03",
    name: "Pokellectr",
    kind: "Native mobile app",
    status: "Play Store soon",
    statusTone: "build",
    year: "2026",
    version: "Expo SDK 57",
    blurb:
      "Point your phone at a Pokémon card. In about a second it's identified to the exact printing, priced, and in your binder — built for the night you rip a whole box.",
    body: [
      "The whole card database — 20,479 cards — ships inside the app as a 7 MB binary, so identification is instant and needs no signal. Reading is ML Kit text recognition, but OCR of a card is a mess: attack names read like card names, collector numbers arrive as 'GOBno35/ 197', promos print a different set code than the data stores. The parser picks the name by layout (the tallest line above the collector number), matches word by word, sanity-checks the number against the printed set size, and needs two agreeing reads before it auto-files. When text fails — foil glare, a full-art name — a 128-bit difference hash of the illustration alone finds the card by its picture instead.",
      "The grade checker is honest about what a phone can measure. Mark the four corners, a homography straightens the card, and centring is measured as pure geometry from the border widths — reported as the grade centring allows, a ceiling not a prediction. Corners and edges are measured as whitening against the border colour, a repeatable number rather than an opinion. Surface it refuses to guess at, and says so.",
      "Around that: pack sessions that count every pull against what the box cost, per pack and running; sets as checklists; a price history the app records itself because neither source keeps one; and an eBay export that writes complete listings with every item specific eBay demands, priced off today's market. Prices come from a daily mirror of TCGplayer's export, baked in at build and topped up at runtime, always the plain print so an estimate is never optimistic, in GBP, USD or EUR at live ECB rates. Pro sells monthly, yearly or once for good through RevenueCat — and scanning is never gated, because a cap on the one night someone is most excited would make the app useless.",
    ],
    highlights: [
      "20,479-card database on the phone, fully offline",
      "Hands-free auto-scan, two reads must agree",
      "Art matching by illustration hash when OCR fails",
      "Grade checker: measured centring, corner and edge wear",
      "Pack sessions: am I up or down on this box?",
      "eBay bulk-listing export with item specifics filled in",
      "Free, no adverts, no tracking; Pro never gates scanning",
    ],
    stack: ["React Native", "Expo", "TypeScript", "ML Kit OCR", "expo-camera", "RevenueCat", "TCGplayer data", "Node build tooling"],
    links: [],
    accent: "#FFD84D",
    shot: "/shots/hero-pokellectr.webp",
    shotFit: "landscape",
    images: [
      { src: "/shots/pokellectr-scan.webp", caption: "Point, scan, it's in your binder — name, set, number and price in about a second" },
      { src: "/shots/pokellectr-packs.webp", caption: "Pack sessions — every pull counted against what the box cost" },
      { src: "/shots/pokellectr-grade.webp", caption: "Grade checker — mark the corners, it measures centring and wear" },
      { src: "/shots/pokellectr-sell.webp", caption: "Sell on eBay — tick the cards, it writes the listings priced off the market" },
      { src: "/shots/pokellectr-card.webp", caption: "Every printing, every price — raw, and what it would be graded" },
    ],
  },
  {
    id: "clippd",
    index: "04",
    code: "VOL_04",
    name: "ClippD",
    kind: "Video pipeline + publishing tool",
    status: "In use",
    statusTone: "live",
    year: "2026",
    version: "Python · FastAPI",
    blurb:
      "Give it a long YouTube video and it finds the best moments, cuts them vertical with word-by-word captions, and posts them across every YouTube and TikTok account you own on a calendar you can fill months ahead.",
    body: [
      "Every candidate window is snapped to sentence boundaries and scored on five axes — hook, emotion, payoff, clarity and whether a stranger could follow it cold — then overlapping cuts are suppressed so you get distinct moments, not ten versions of one. Claude re-ranks the shortlist and writes the titles and captions; without a key the local scorer carries everything, nothing hard-depends on the API.",
      "Rendering is ffmpeg with ASS captions burned in one word per dialogue event, five caption presets, three framing modes including a speaker-follow crop. When the shorts data showed a median of zero views with four clips carrying 99 % of the total, I added Compilations: ten-minute 16:9 highlight videos cut from the source, with cold open, chapter cards and a thumbnail, rendered in about two minutes on NVENC.",
      "It's also a business tool. A rights gate blocks any clip without a recorded basis for reuse and appends attribution at commit so it can't drift. Campaigns encode the rules of paid clipping briefs — must-say keywords, banned topics, length limits, logo overlays, per-account caps — and a headless browser files each submission to the marketplace after the post goes up.",
    ],
    highlights: [
      "Five-axis clip scoring with overlap suppression",
      "Claude re-ranks and writes hooks and captions",
      "Word-timed ASS captions, five presets",
      "Long-form compilations with chapters and thumbnails",
      "Multi-account YouTube + TikTok scheduling",
      "Rights gate, attribution and campaign rules enforced",
    ],
    stack: ["Python", "FastAPI", "ffmpeg", "yt-dlp", "SQLite", "Claude API", "YouTube Data API", "Playwright", "Vanilla JS"],
    links: [],
    accent: "#FF5C8A",
    shot: "/shots/hero-clippd.webp",
    shotFit: "landscape",
    images: [
      { src: "/shots/clippd-clips.webp", caption: "The clip library — every cut scored on hook, emotion and payoff, captioned, queued or live" },
      { src: "/shots/clippd-dashboard.webp", caption: "Dashboard — 764 clips found, 336 scheduled across four accounts, 137 published" },
      { src: "/shots/clippd-studio.webp", caption: "Caption studio — five presets, three framing modes, live preview of the burn-in" },
    ],
  },
];

/* ---------------------------------------------------------
   CAPABILITY — the full-stack proof
--------------------------------------------------------- */
export const capability = [
  {
    title: "Front end",
    line: "Interfaces and game canvases",
    items: ["React 19", "React Native", "TypeScript", "Framer Motion", "HTML5 Canvas", "MapLibre", "CSS architecture", "Responsive & mobile"],
  },
  {
    title: "Back end",
    line: "Data, auth and money",
    items: ["PHP 8", "Python", "FastAPI", "Node.js", "MySQL", "SQLite", "REST APIs", "Data pipelines", "OCR & ML Kit"],
  },
  {
    title: "Platform",
    line: "Shipping and keeping it alive",
    items: ["WordPress & WooCommerce", "Plugin architecture", "Licence servers", "Expo / Android builds", "ffmpeg & NVENC", "Claude API", "Release tooling", "Auto-updates"],
  },
];

export const links = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/kriscreatesuk/", tag: "in" },
  { label: "Upwork", href: "https://www.upwork.com/freelancers/~015ddc5bd348bef361", tag: "Up" },
  { label: "Fiverr", href: "https://www.fiverr.com/sellers/webbodevvo/", tag: "fi" },
  { label: "PeoplePerHour", href: "https://www.peopleperhour.com/freelancer/design/kris-sull-custom-wordpress-woocommerce-zxymyqwm", tag: "PPH" },
];
