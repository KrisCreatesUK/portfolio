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
| VOL_02 | Farmazon | Next.js 16 · Prisma · PostgreSQL |
| VOL_03 | Truck Access Finder | React Native · Expo |

## Layout

```
src/
  data.js                 every string on the site — projects, counters, links
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

## Commands

```bash
npm install
npm run dev      # http://localhost:5188
npm run build
npm run lint
```
