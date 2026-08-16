import { useEffect, useRef, useState } from "react";
import { counters, readout } from "../data";

/* Count up once the element is on screen */
function useCountUp(target, run) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!run) return;
    let raf;
    const start = performance.now();
    const dur = 1100;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run]);

  return n;
}

function useOnScreen() {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return [ref, seen];
}

function Stat({ item, run }) {
  const n = useCountUp(item.value, run);
  return (
    <div className="stat">
      <div className="stat-num">
        {n}
        <span className="stat-suffix">{item.suffix}</span>
      </div>
      <div className="stat-label">{item.label}</div>
      <div className="stat-sub">{item.sub}</div>
    </div>
  );
}

export default function Counter() {
  const [ref, seen] = useOnScreen();
  const [line, setLine] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setLine((i) => (i + 1) % readout.length), 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <aside className="counter" ref={ref}>
      <header className="counter-head">
        <span className="counter-title">CREDENTIALS</span>
        <span className="counter-line" key={line}>{readout[line]}</span>
      </header>

      <div className="counter-grid">
        {counters.map((c) => (
          <Stat key={c.label} item={c} run={seen} />
        ))}
      </div>
    </aside>
  );
}
