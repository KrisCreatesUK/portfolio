import { useEffect, useRef } from "react";

const CODE_SOURCE = `
const data = await fetch('/api');
function render() { return <div /> }
useEffect(() => {}, []);
if (true) return;
export default App;
let state = useState(null);
`;

export default function MatrixCursor() {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  if (isMobile) return null; // 🚀 kill cursor on mobile
  const canvasRef = useRef(null);

  const glyphs = useRef([]);
  const mouse = useRef({ x: 0, y: 0 });
  const last = useRef({ x: 0, y: 0, t: Date.now() });

  const pointer = useRef({ x: 0, y: 0 });
  const active = useRef(false);

  const chars = CODE_SOURCE.replace(/\s+/g, "").split("");

  const ANGLE = 30 * Math.PI / 180;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    /* =========================
       INPUT
    ========================= */

    const move = (x, y) => {
      const now = Date.now();

      const dx = x - last.current.x;
      const dy = y - last.current.y;

      const dist = Math.sqrt(dx * dx + dy * dy);

      mouse.current.x = x;
      mouse.current.y = y;

      if (active.current && dist > 2) {
        spawnLine(last.current.x, last.current.y, x, y);
      }

      last.current = { x, y, t: now };
    };

    const onMouseMove = (e) => {
      active.current = true;
      move(e.clientX, e.clientY);
    };

    const onTouchStart = (e) => {
      active.current = true;
      const t = e.touches[0];
      move(t.clientX, t.clientY);
    };

    const onTouchMove = (e) => {
      const t = e.touches[0];
      move(t.clientX, t.clientY);
    };

    const onTouchEnd = () => {
      active.current = false;
      glyphs.current = [];
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchstart", onTouchStart);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);

    /* =========================
       SPAWN ALONG PATH
    ========================= */

    const spawnLine = (x1, y1, x2, y2) => {
      const dx = x2 - x1;
      const dy = y2 - y1;

      const distance = Math.sqrt(dx * dx + dy * dy);

      const steps = Math.floor(distance / 8); // 👈 controls density

      for (let i = 0; i < steps; i++) {
        const t = i / steps;

        const x = x1 + dx * t;
        const y = y1 + dy * t;

        glyphs.current.push({
          x,
          y,
          char: chars[Math.floor(Math.random() * chars.length)],
          life: 1,
          size: 18 + Math.random() * 4,

          vx: 0,
          vy: 0,
          delay: 10 + Math.random() * 15
        });
      }
    };

    /* =========================
       LOOP
    ========================= */

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      glyphs.current.forEach((g, i) => {
        if (g.delay > 0) {
          g.delay--;
        } else {
          g.vy += 0.06;
        }

        g.y += g.vy;

        g.life -= 0.03;

        if (g.life <= 0) {
          glyphs.current.splice(i, 1);
          return;
        }

        ctx.globalAlpha = g.life;

        ctx.fillStyle = "#7aa2ff";
        ctx.font = `${g.size}px monospace`;

        ctx.fillText(g.char, g.x, g.y);
      });

      ctx.globalAlpha = 1;

      /* POINTER */
      if (active.current) {
        pointer.current.x += (mouse.current.x - pointer.current.x) * 0.2;
        pointer.current.y += (mouse.current.y - pointer.current.y) * 0.2;

        ctx.save();

        ctx.translate(pointer.current.x, pointer.current.y);
        ctx.rotate(ANGLE);

        ctx.fillStyle = "#7aa2ff";
        ctx.font = "42px monospace";

        ctx.fillText("<", -14, 14);

        ctx.restore();
      }

      requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 9999
      }}
    />
  );
}