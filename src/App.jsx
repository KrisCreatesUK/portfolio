import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";

import Counter from "./components/Counter";
import ProjectView from "./components/ProjectView";
import { profile, projects, capability, links } from "./data";
import "./styles.css";

const Stage = lazy(() => import("./three/Stage"));

/* If WebGL is unavailable the page still stands on its own */
class StageBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/* =========================================================
   BOOT — the screen coming on
   ---------------------------------------------------------
   Pure CSS so it paints on the first frame, long before
   three.js has finished loading: a line strikes across the
   middle, floods the screen, then settles into the scene.
   It removes itself and is ignored by assistive tech.
   ========================================================= */
function Boot() {
  const [gone, setGone] = useState(false);

  /* the animation hides it; this takes it out of the document entirely,
     and means a browser that never runs the animation can't be left
     staring at a black rectangle */
  useEffect(() => {
    const t = setTimeout(() => setGone(true), 1800);
    return () => clearTimeout(t);
  }, []);

  if (gone) return null;

  return (
    <div className="boot" aria-hidden="true">
      <span className="boot-line" />
      <span className="boot-flood" />
      <span className="boot-scan" />
    </div>
  );
}

export default function App() {
  const [activeId, setActiveId] = useState(projects[0].id);
  const [hoverId, setHoverId] = useState(null);
  const [view, setView] = useState({ kind: "space" });

  /* How far through a write-up the reader is. Kept in a ref so scrolling
     never re-renders the scene — the camera reads it inside its own frame
     loop instead. */
  const progress = useRef(0);

  const mode = view.kind === "project" ? "project" : "space";

  /* ---- navigation ---------------------------------------------------- */
  const openProject = useCallback((id) => {
    setActiveId(id);
    setView({ kind: "project", id });
    progress.current = 0;
    window.scrollTo(0, 0);
  }, []);

  const openPage = useCallback((id) => {
    setView({ kind: "page", id });
    window.scrollTo(0, 0);
  }, []);

  const toSpace = useCallback(() => {
    setView({ kind: "space" });
    progress.current = 0;
    window.scrollTo(0, 0);
  }, []);

  /* the array view is a place, not a document: it doesn't scroll */
  useEffect(() => {
    document.body.classList.toggle("is-locked", view.kind === "space");
    return () => document.body.classList.remove("is-locked");
  }, [view.kind]);

  /* reading position drives the camera while a project is open */
  useEffect(() => {
    if (view.kind !== "project") {
      progress.current = 0;
      return;
    }
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.current = max > 40 ? Math.min(1, window.scrollY / max) : 0;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [view]);

  /* escape always takes you back out to the array */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && view.kind !== "space") toSpace();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view.kind, toSpace]);

  return (
    <div className={`site view-${view.kind}`}>
      <Boot />

      {/* the world, behind everything */}
      <div className={`stage-layer ${hoverId ? "is-pointing" : ""}`}>
        <StageBoundary>
          <Suspense fallback={null}>
            <Stage
              projects={projects}
              activeId={activeId}
              hoverId={hoverId}
              mode={mode}
              progressRef={progress}
              onSelect={openProject}
              onHover={setHoverId}
            />
          </Suspense>
        </StageBoundary>
        <div className="stage-vignette" aria-hidden="true" />
      </div>

      <Header view={view} onHome={toSpace} onPage={openPage} />

      <main>
        {/* ================= THE ARRAY ================= */}
        <section className="space" id="top">
          <div className="space-copy">
            <p className="eyebrow">
              <span className="pulse" /> {profile.handle} — {profile.location}
            </p>

            <h1>
              Full-stack
              <br />
              <span className="accent">developer</span>
            </h1>

            <p className="lede">{profile.tagline}</p>

            <div className="hero-actions">
              <button className="btn btn-primary" onClick={() => openProject(projects[0].id)}>
                Open the first volume
              </button>
              <a
                className="btn"
                href="https://compkit.kriscreates.co.uk"
                target="_blank"
                rel="noopener"
              >
                CompKit Game Engine <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>

          {/* Pinned to the edges, not stacked in a column: the middle of the
              screen belongs to the array. */}
          <ul className="bay-list">
            {projects.map((p) => (
              <li key={p.id}>
                <button
                  className={`bay-btn ${p.id === activeId ? "is-active" : ""} ${
                    p.id === hoverId ? "is-hovered" : ""
                  }`}
                  data-vol={p.id}
                  style={{ "--accent": p.accent }}
                  onMouseEnter={() => setHoverId(p.id)}
                  onMouseLeave={() => setHoverId(null)}
                  onFocus={() => setHoverId(p.id)}
                  onBlur={() => setHoverId(null)}
                  onClick={() => openProject(p.id)}
                >
                  <span className="bay-btn-code">{p.code}</span>
                  <span className="bay-btn-name">{p.name}</span>
                  <span className="bay-btn-kind">{p.kind}</span>
                  <span className="bay-btn-go" aria-hidden="true">OPEN →</span>
                </button>
              </li>
            ))}
          </ul>

          <Counter />

          <p className="space-hint">
            <span className="dot" /> Drag to fly around the array — click a drive to open it
          </p>
        </section>

        {/* ================= THE VOLUMES ================= */}
        <div className="deep">
          {projects.map((p, i) => (
            <ProjectView
              key={p.id}
              project={p}
              projects={projects}
              index={i}
              total={projects.length}
              open={view.kind === "project" && view.id === p.id}
              onClose={toSpace}
              onJump={openProject}
              onContact={() => openPage("contact")}
            />
          ))}

          {/* ---------- the stack ---------- */}
          <article
            className={`deck deck-page ${
              view.kind === "page" && view.id === "stack" ? "is-open" : ""
            }`}
            hidden={!(view.kind === "page" && view.id === "stack")}
            aria-labelledby="stack-title"
          >
            <nav className="deck-switch" aria-label="Back">
              <button className="deck-back" onClick={toSpace}>
                <span aria-hidden="true">←</span> The array
              </button>
            </nav>

            <header className="deck-head">
              <div className="deck-meta">
                <span className="deck-code">SYS_02</span>
                <span className="deck-seq">THE WHOLE STACK</span>
              </div>
              <h1 className="deck-title glitch" id="stack-title" data-text="Schema to stylesheet">
                Schema to stylesheet
              </h1>
              <p className="deck-blurb">{profile.intro}</p>
            </header>

            <div className="cap-grid">
              {capability.map((c) => (
                <section className="cap" key={c.title}>
                  <h2>{c.title}</h2>
                  <p className="cap-line">{c.line}</p>
                  <ul>
                    {c.items.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            <footer className="deck-foot">
              <button className="btn" onClick={toSpace}>
                <span aria-hidden="true">←</span> Back to the array
              </button>
              <button className="btn btn-primary" onClick={() => openPage("contact")}>
                Get in touch
              </button>
            </footer>
          </article>

          {/* ---------- contact ---------- */}
          <article
            className={`deck deck-page ${
              view.kind === "page" && view.id === "contact" ? "is-open" : ""
            }`}
            hidden={!(view.kind === "page" && view.id === "contact")}
            aria-labelledby="contact-title"
          >
            <nav className="deck-switch" aria-label="Back">
              <button className="deck-back" onClick={toSpace}>
                <span aria-hidden="true">←</span> The array
              </button>
            </nav>

            <header className="deck-head">
              <div className="deck-meta">
                <span className="deck-code">SYS_03</span>
                <span className="deck-seq">OPEN TO WORK</span>
              </div>
              <h1 className="deck-title glitch" id="contact-title" data-text="Get in touch">
                Get in touch
              </h1>
              <p className="deck-blurb">
                Got a system that needs building, finishing or rescuing? Send the detail
                and I&apos;ll tell you straight whether I&apos;m the right person for it.
              </p>
              <div className="deck-links">
                <a className="btn btn-primary btn-lg" href={`mailto:${profile.email}`}>
                  {profile.email}
                </a>
              </div>
            </header>

            <ul className="link-tiles">
              {links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} target="_blank" rel="noopener">
                    <span className="tile-tag">{l.tag}</span>
                    <span className="tile-label">{l.label}</span>
                  </a>
                </li>
              ))}
            </ul>

            <footer className="deck-foot">
              <button className="btn" onClick={toSpace}>
                <span aria-hidden="true">←</span> Back to the array
              </button>
            </footer>
          </article>
        </div>
      </main>

      <footer className="site-foot">
        <span>
          © {new Date().getFullYear()} {profile.handle}
        </span>
        <span className="foot-mid">
          Product work:{" "}
          <a href="https://compkit.kriscreates.co.uk" rel="noopener">
            CompKit Game Engine
          </a>
        </span>
        <span>Built with React, Vite and three.js</span>
      </footer>
    </div>
  );
}

/* ---------------------------------------------------- */

function Header({ view, onHome, onPage }) {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-head ${solid || view.kind !== "space" ? "is-solid" : ""}`}>
      <button className="brand" onClick={onHome} aria-label="KrisCreates — the array">
        <img className="brand-mark" src="/logo-mark.png" alt="" width="44" height="34" />
        <span className="brand-name">
          Kris<b>Creates</b>
        </span>
      </button>

      <nav>
        <button className={view.kind === "space" ? "is-on" : ""} onClick={onHome}>
          Array
        </button>
        <button
          className={view.kind === "page" && view.id === "stack" ? "is-on" : ""}
          onClick={() => onPage("stack")}
        >
          Stack
        </button>
        <button
          className={view.kind === "page" && view.id === "contact" ? "is-on" : ""}
          onClick={() => onPage("contact")}
        >
          Contact
        </button>
        <a
          className="nav-out"
          href="https://compkit.kriscreates.co.uk"
          target="_blank"
          rel="noopener"
        >
          CompKit ↗
        </a>
      </nav>
    </header>
  );
}
