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
    "I build and ship complete products — the database, the API, the interface, the licensing, the deploy.",
  intro:
    "Three live systems, three different runtimes. A commercial WordPress plugin suite with its own licence server, a multi-vendor marketplace on Next.js and Postgres, and a native mobile app for delivery drivers. Same person on the schema, the game canvas and the CSS.",
};

/* ---------------------------------------------------------
   CREDENTIAL COUNTER — every figure here is verifiable in
   the projects below. Nothing invented.
--------------------------------------------------------- */
export const counters = [
  { value: profile.yearsBuilding, suffix: "+", label: "Years building", sub: "Freelance & agency" },
  { value: 3, suffix: "", label: "Runtimes shipped", sub: "PHP · Node · Native" },
  { value: 8, suffix: "", label: "Game modules live", sub: "CompKit premium" },
  { value: 40, suffix: "+", label: "Data models", sub: "Farmazon schema" },
];

export const readout = [
  "SYS :: KRISCREATES // FULL-STACK",
  "NODE :: UK / GMT+0",
  "STATE :: AVAILABLE FOR WORK",
  "LOAD :: 3 PRODUCTION SYSTEMS",
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
    version: "v3.0.23",
    blurb:
      "A WooCommerce plugin suite that turns the instant-win result on an order confirmation page into a game the customer plays — scratch, spin, slots, claw, darts, race, balloon pop or shootout.",
    body: [
      "The free core is a full plugin in its own right: it hooks WooCommerce order completion, renders the reveal on the confirmation page, and holds back the confirmation email until every ticket has been played — otherwise the inbox spoils the result before the customer even lands on the page.",
      "On top of that sit eight premium game modules, each licensed separately at £9.99/month. Every module has its own admin settings page with a live device-emulating preview, per-product overrides, import/export of configurations, and uploadable artwork down to the trackside advertising boards inside the game canvas.",
      "The commercial side is mine too: a licence server that validates subscriptions, serves each game engine remotely rather than shipping it in the zip, builds white-label cores on demand, and drives in-dashboard auto-updates.",
    ],
    highlights: [
      "8 premium game engines on HTML5 canvas",
      "Licence API with remote engine delivery",
      "Smart Email Delay Handler stops spoiler emails",
      "Live admin preview with device emulation",
      "Per-product setting overrides + import/export",
      "White-label core builds and auto-update channel",
    ],
    stack: ["PHP", "WordPress", "WooCommerce", "JavaScript", "Canvas", "MySQL", "REST API", "Licence server"],
    links: [
      { label: "compkit.kriscreates.co.uk", href: "https://compkit.kriscreates.co.uk", primary: true },
      { label: "Play a live demo", href: "https://compkit.kriscreates.co.uk/games/" },
    ],
    accent: "#93F025",
    shot: "/shots/compkit-scratch.webp",
    shotFit: "landscape",
    images: [
      { src: "/shots/compkit-scratch.webp", caption: "Scratch Card reveal on the order confirmation page" },
      { src: "/shots/compkit-admin.webp", caption: "Race Car settings with the live preview beside them" },
      { src: "/shots/compkit-slots.webp", caption: "Slot Machine — three-reel turbo reveal" },
      { src: "/shots/compkit-claw.webp", caption: "Prize Grab Claw, fully rebranded per campaign" },
    ],
  },
  {
    id: "farmazon",
    index: "02",
    code: "VOL_02",
    name: "Farmazon",
    kind: "Multi-vendor marketplace",
    status: "In build",
    statusTone: "build",
    year: "2026",
    version: "Next.js 16",
    blurb:
      "A farm-to-door marketplace with four sides to it — customers, farm vendors, couriers and platform admin — each with its own dashboard, permissions and workflow.",
    body: [
      "An order placed across three farms doesn't stay one order. It splits into per-farm orders, each of which raises a delivery job, which is offered to couriers who have been approved to carry for that farm at an agreed rate. Every state change writes an order event, so the timeline is reconstructable.",
      "Couriers apply through the platform: vehicle type, documents uploaded and reviewed by admin, approval status gating what they can accept. Vendors onboard their farm, manage catalogue and stock units, set delivery slots and postcode-based pricing. Admin holds commission settings, payouts, issue queues and an audit log.",
      "Built on the current Next.js App Router with server actions throughout, a Prisma schema of forty-plus models, and role-based access enforced server-side rather than hidden in the UI.",
    ],
    highlights: [
      "4 roles: customer, vendor, courier, admin",
      "Orders split per farm, each raising delivery jobs",
      "Courier onboarding with document review",
      "Commission, payouts and VAT treatment",
      "Postcode-based delivery pricing and slots",
      "Server-side RBAC + full audit log",
    ],
    stack: ["Next.js 16", "React 19", "TypeScript", "Prisma", "PostgreSQL", "Auth.js", "Tailwind 4", "Zod", "Stripe"],
    links: [],
    accent: "#57B41A",
    shot: "/shots/farmazon-home.webp",
    shotFit: "landscape",
    images: [
      { src: "/shots/farmazon-home.webp", caption: "Storefront — seasonal hero and category rail" },
      { src: "/shots/farmazon-shop.webp", caption: "Catalogue with farm, category and season filters" },
      { src: "/shots/farmazon-farms.webp", caption: "Farm directory — every product traces back to one" },
    ],
  },
  {
    id: "access-finder",
    index: "03",
    code: "VOL_03",
    name: "Truck Access Finder",
    kind: "Native mobile app",
    status: "In development",
    statusTone: "dev",
    year: "2026",
    version: "Expo SDK 54",
    blurb:
      "A map app for HGV and delivery drivers that answers the question a postcode never does: where does the lorry actually go in?",
    body: [
      "A store's registered address drops you at the shop front. The delivery entrance can be round the back, down a service road, through a security gate, or on a blind side you can't reverse into without knowing it first. This app lets drivers pin the real access point and photograph it.",
      "Each pin carries a photo of the entrance, the approach heading captured from the device compass, free-text notes, and tags — rear access, loading bay, tight access, blind side, security gate, underground. Retailer logos are matched automatically from the place name so the map reads at a glance.",
      "Built offline-first: photos are copied into app storage and pins persist locally, so a driver in a dead-signal industrial estate still has everything, with sync layered on top.",
    ],
    highlights: [
      "Native map with custom access-point pins",
      "Photo capture persisted to device storage",
      "Compass heading records approach direction",
      "Tag system for access types",
      "Places search for finding a site fast",
      "Offline-first, sync when back in signal",
    ],
    stack: ["React Native", "Expo Router", "TypeScript", "React Query", "Supabase", "Google Places", "AsyncStorage"],
    links: [],
    accent: "#ACB7AC",
    shot: "/shots/truck-app.webp",
    shotFit: "portrait",
    images: [
      { src: "/shots/truck-app.webp", caption: "Interface mock — the app is mid-build, so this is the design, not a store screenshot" },
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
    items: ["React 19", "Next.js App Router", "TypeScript", "Framer Motion", "HTML5 Canvas", "Tailwind", "CSS architecture", "Responsive & mobile"],
  },
  {
    title: "Back end",
    line: "Data, auth and money",
    items: ["PHP 8", "Node.js", "PostgreSQL", "MySQL", "Prisma", "REST APIs", "Auth.js / sessions", "Stripe", "RBAC"],
  },
  {
    title: "Platform",
    line: "Shipping and keeping it alive",
    items: ["WordPress & WooCommerce", "Plugin architecture", "Licence servers", "React Native / Expo", "Vercel", "Supabase", "Release tooling", "Auto-updates"],
  },
];

export const links = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/kriscreatesuk/", tag: "in" },
  { label: "Upwork", href: "https://www.upwork.com/freelancers/~015ddc5bd348bef361", tag: "Up" },
  { label: "Fiverr", href: "https://www.fiverr.com/sellers/webbodevvo/", tag: "fi" },
  { label: "PeoplePerHour", href: "https://www.peopleperhour.com/freelancer/design/kris-sull-custom-wordpress-woocommerce-zxymyqwm", tag: "PPH" },
];
