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
    name: "Pokéllectr",
    kind: "Native Android app",
    status: "Live on Google Play",
    statusTone: "live",
    year: "2026",
    version: "v1.0.1",
    blurb:
      "Scanning a card is the easy bit. Selling it is what takes all night — so Pokéllectr identifies the card in about a second, then writes the listing for you and puts it on eBay.",
    body: [
      "Every card ever printed ships inside the app as a binary, so identification is instant and works with no signal at a fair or in the car. Reading is ML Kit OCR, but OCR of a card is a mess: attack names read like card names, collector numbers arrive as 'GOBno35/ 197', promos print a different set code than the data stores. The parser picks the name by layout — the tallest line above the collector number — matches word by word, sanity-checks the number against the printed set size, and needs two agreeing reads before it auto-files. When text fails on foil glare or a full-art name, a difference hash of the illustration finds the card by its picture instead.",
      "Selling is the half that makes it worth having. Link an eBay account through my own OAuth server — the app never holds the token — tick fifty cards and it writes every listing: title, set, number, rarity, finish, condition, photo and each item specific eBay demands for trading cards, priced off today's market with a floor you set. Sold cards leave the binder on their own. For the marketplaces with no usable API it writes the file their own tooling takes: Cardmarket's bulk-import CSV, TCGplayer, Whatnot. Nothing ever lists without the seller seeing the price first.",
      "Around that: a grade checker that straightens the card with a homography and measures centring as geometry — reported as a ceiling, with corners and edges as whitening and an explicit refusal to guess at surface; pack sessions that count every pull against what the box cost; sets as checklists; price history the app records itself; and Google sign-in backup to my own server, which holds exactly three things — who you are, your binder, and the last few versions of it. Pro sells monthly, yearly or once for good, and scanning is never gated.",
    ],
    highlights: [
      "Whole card catalogue on the phone — identification works offline",
      "Hands-free auto-scan, two reads must agree, art-hash fallback",
      "List straight to eBay with every item specific filled in",
      "Sold on eBay? It leaves the binder on its own",
      "Export files for Cardmarket, TCGplayer and Whatnot",
      "Grade checker: measured centring, corner and edge wear",
      "Pack sessions, set checklists, price history, Google backup",
    ],
    stack: ["React Native", "Expo", "TypeScript", "ML Kit OCR", "eBay Sell API", "OAuth server", "RevenueCat", "TCGplayer data", "Google Sign-In"],
    links: [
      { label: "Get it on Google Play", href: "https://play.google.com/store/apps/details?id=com.sailscards.trg", primary: true },
    ],
    accent: "#FFD84D",
    shot: "/shots/hero-pokellectr.webp",
    shotFit: "landscape",
    images: [
      { src: "/shots/pokellectr-scan.webp", caption: "Point, scan, it's in your binder — name, set, number and price in about a second" },
      { src: "/shots/pokellectr-sell.webp", caption: "Sell on eBay — tick the cards, it writes every listing priced off today's market" },
      { src: "/shots/pokellectr-grade.webp", caption: "Grade checker — mark the corners, it measures centring and wear" },
      { src: "/shots/pokellectr-packs.webp", caption: "Pack sessions — every pull counted against what the box cost" },
      { src: "/shots/pokellectr-collection.webp", caption: "The binder — every printing, every price, sorted your way" },
    ],
  },
  {
    id: "clippd",
    index: "04",
    code: "VOL_04",
    name: "ClippD",
    kind: "Clipping and publishing software — licensed, runs on your machine",
    status: "Licensing",
    statusTone: "live",
    year: "2026",
    version: "Python · FastAPI",
    blurb:
      "Give it a long YouTube video and it finds the best moments, cuts them vertical with word-by-word captions, posts them across every YouTube and TikTok account you own — and, if you clip for paid campaigns, it finds the briefs, follows their rules and files the submissions for you.",
    body: [
      "Every candidate window is snapped to sentence boundaries and scored on five axes — hook, emotion, payoff, clarity and whether a stranger could follow it cold — then overlapping cuts are suppressed so you get distinct moments, not ten versions of one. Claude re-ranks the shortlist and writes the titles and captions; without a key the local scorer carries everything. Rendering is ffmpeg with ASS captions burned in one word per dialogue event, five caption presets, three framing modes including a speaker-follow crop, and ten-minute 16:9 compilations with cold open, chapter cards and a thumbnail, rendered in about two minutes on NVENC.",
      "The Whop side is what makes it a business tool. Whop Content Rewards pays per thousand views for clipping footage a brand has licensed, under rules the brand sets and a submission window of thirty minutes after a clip goes live. ClippD connects to your Whop account, searches the marketplace from inside the app, and a marketplace autopilot scans every six hours: it refreshes each campaign's remaining budget and burn rate, pauses the ones about to run dry, adds the best new listings and starts cutting their footage unattended. Each brief's rules — must-say keywords, banned topics, length limits, logo overlay, required tags and mentions, posts per account — travel with every clip, so nothing gets rejected for a rule somebody forgot.",
      "Posting is scheduled to each account's own slots with jitter, caps and minimum gaps. The moment a campaign clip goes live, a headless browser drives Whop's submission form inside the window, reads the verdict back, and a sync mirrors Whop's review status, view counts and payouts onto the post — so the Growth page shows what each clip actually earned, not an estimate. A rights gate blocks any clip without a recorded basis for reuse and appends attribution at commit. ClippD runs locally on your own machine — your accounts, your browser profile, your footage never leave it. I licence copies; get in touch below.",
    ],
    highlights: [
      "Five-axis clip scoring, Claude re-ranking, word-timed captions",
      "Whop marketplace search and connection inside the app",
      "Marketplace autopilot: scout, forecast budget, auto-add, auto-pause",
      "Campaign rules enforced on every clip, caption and post",
      "Headless submitter files each clip within Whop's 30-minute window",
      "Whop sync: verdicts, view counts and payouts mirrored onto posts",
      "Multi-account YouTube + TikTok scheduling, compilations, rights gate",
      "Runs on your own machine — nothing leaves it",
    ],
    stack: ["Python", "FastAPI", "ffmpeg", "yt-dlp", "SQLite", "Claude API", "YouTube Data API", "Playwright", "Whop Content Rewards", "Vanilla JS"],
    links: [
      { label: "Enquire about a licence", href: "mailto:hello@kriscreates.co.uk?subject=ClippD%20licence%20enquiry", primary: true },
    ],
    accent: "#FF5C8A",
    shot: "/shots/hero-clippd.webp",
    shotFit: "landscape",
    images: [
      { src: "/shots/clippd-campaigns.webp", caption: "Campaigns — Whop connected, marketplace autopilot on, every brief's budget, burn rate and rules in one place" },
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
