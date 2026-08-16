import { Component, Suspense, lazy, useEffect, useState } from "react";
import { motion } from "framer-motion";

import Counter from "./components/Counter";
import ProjectPanel from "./components/ProjectPanel";
import { profile, projects, capability, links } from "./data";
import "./styles.css";

const Stage = lazy(() => import("./three/Stage"));

/* If WebGL is unavailable the HUD still stands on its own */
class StageBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function App() {
  const [activeId, setActiveId] = useState(projects[0].id);
  const [hoverId, setHoverId] = useState(null);

  const active = projects.find((p) => p.id === activeId) ?? projects[0];

  const select = (id) => setActiveId(id);

  return (
    <div className="site">
      <Header />

      <main>
        {/* ================= THE ARRAY ================= */}
        <section className="stage" id="top">
          <div className="stage-3d">
            <StageBoundary>
              <Suspense fallback={null}>
                <Stage
                  projects={projects}
                  activeId={activeId}
                  hoverId={hoverId}
                  onSelect={select}
                  onHover={setHoverId}
                />
              </Suspense>
            </StageBoundary>
          </div>

          <div className="stage-hud">
            <div className="hud-copy">
              <motion.p className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <span className="pulse" /> {profile.handle} — {profile.location}
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.7 }}
              >
                Full-stack
                <br />
                <span className="accent">developer</span>
              </motion.h1>

              <motion.p
                className="lede"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {profile.tagline}
              </motion.p>

              <motion.div
                className="hero-actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <a className="btn btn-primary" href="#volume">Read the volumes</a>
                <a
                  className="btn"
                  href="https://compkit.kriscreates.co.uk"
                  target="_blank"
                  rel="noopener"
                >
                  CompKit Game Engine <span aria-hidden="true">↗</span>
                </a>
              </motion.div>
            </div>

            <div className="hud-bottom">
              <Counter />

              <ul className="bay-list">
                {projects.map((p) => (
                  <li key={p.id}>
                    <button
                      className={`bay-btn ${p.id === activeId ? "is-active" : ""}`}
                      style={{ "--accent": p.accent }}
                      onMouseEnter={() => setHoverId(p.id)}
                      onMouseLeave={() => setHoverId(null)}
                      onClick={() => select(p.id)}
                    >
                      <span className="bay-btn-code">{p.code}</span>
                      <span className="bay-btn-name">{p.name}</span>
                      <span className="bay-btn-kind">{p.kind}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="stage-hint">
            <span className="dot" /> Drag your eye around — click a drive to mount it
          </div>
        </section>

        {/* ================= ACTIVE VOLUME ================= */}
        <section className="section" id="volume">
          <SectionHead index="01" title="Mounted volume" note="Three systems, three runtimes" />
          <ProjectPanel project={active} />
        </section>

        {/* ================= CAPABILITY ================= */}
        <section className="section" id="stack">
          <SectionHead index="02" title="The whole stack" note="Schema to stylesheet" />
          <p className="section-lede">{profile.intro}</p>

          <div className="cap-grid">
            {capability.map((c) => (
              <article className="cap" key={c.title}>
                <h3>{c.title}</h3>
                <p className="cap-line">{c.line}</p>
                <ul>
                  {c.items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* ================= CONTACT ================= */}
        <section className="section" id="contact">
          <SectionHead index="03" title="Get in touch" note="Open to work" />

          <div className="contact">
            <div className="contact-main">
              <p className="contact-lede">
                Got a system that needs building, finishing or rescuing? Send the
                detail and I'll tell you straight whether I'm the right person for it.
              </p>
              <a className="btn btn-primary btn-lg" href={`mailto:${profile.email}`}>
                {profile.email}
              </a>
            </div>

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
          </div>
        </section>
      </main>

      <footer className="site-foot">
        <span>© {new Date().getFullYear()} {profile.handle}</span>
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

function SectionHead({ index, title, note }) {
  return (
    <header className="section-head">
      <span className="section-index">{index}</span>
      <h2>{title}</h2>
      <span className="section-note">{note}</span>
    </header>
  );
}

function Header() {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-head ${solid ? "is-solid" : ""}`}>
      <a className="brand" href="#top" aria-label="KrisCreates — home">
        <img className="brand-mark" src="/logo-mark.png" alt="" width="44" height="34" />
        <span className="brand-name">
          Kris<b>Creates</b>
        </span>
      </a>

      <nav>
        <a href="#volume">Work</a>
        <a href="#stack">Stack</a>
        <a href="#contact">Contact</a>
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
