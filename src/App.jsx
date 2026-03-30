import { useEffect, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";

import Home from "./Home";
import ProjectView from "./ProjectView";
import PreviewPanel from "./PreviewPanel";
import Cursor from "./Cursor";
import Thoughts from "./Thoughts";
import ContactPage from "./Contact";
import "./index.css";

/* =========================
   HEADER
========================= */

function Header({
  siteLogo,
  onHome,
  onWork,
  onAbout,
  onContact,
  onThoughts
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(null);

  const handle = (fn, key) => {
    fn();
    setActive(key === "home" ? null : key);
    setOpen(false);
  };

  return (
    <>
      <motion.header
        className="site-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="header-inner">
          <div className="logo" onClick={() => handle(onHome, "home")}>
            <img
              src={
                siteLogo ||
                "https://cms.kriscreates.co.uk/wp-content/uploads/2025/10/kc-logo-1.png"
              }
              alt="Kris Creates logo"
            />
          </div>

          <nav className="nav desktop-nav">
            <a
              onClick={() => handle(onWork, "work")}
              className={active === "work" ? "active" : ""}
            >
              Work /&gt;
            </a>

            <a
              onClick={() => handle(onAbout, "about")}
              className={active === "about" ? "active" : ""}
            >
              About /&gt;
            </a>

            <a
              onClick={() => handle(onThoughts, "thoughts")}
              className={active === "thoughts" ? "active" : ""}
            >
              // Thoughts
            </a>

            <a
              onClick={() => handle(onContact, "contact")}
              className={active === "contact" ? "active" : ""}
            >
              Contact /&gt;
            </a>

            <div id="indicator" className={active || ""}></div>
          </nav>

          <button
            className={`hamburger ${open ? "active" : ""}`}
            onClick={() => setOpen(!open)}
          >
            <span />
            <span />
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
          >
            <a onClick={() => handle(onWork, "work")}>Work</a>
            <a onClick={() => handle(onAbout, "about")}>About</a>
            <a onClick={() => handle(onThoughts, "thoughts")}>Thoughts</a>
            <a onClick={() => handle(onContact, "contact")}>Contact</a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* =========================
   APP
========================= */

export default function App() {
  const [projects, setProjects] = useState([]);
  const [active, setActive] = useState(null);

  const [transitioning, setTransitioning] = useState(false);

  const [pendingProject, setPendingProject] = useState(null);
  const [pendingContact, setPendingContact] = useState(false);
  const [pendingThoughts, setPendingThoughts] = useState(false);
  const [pendingScroll, setPendingScroll] = useState(null);

  const [showContact, setShowContact] = useState(false);
  const [showThoughts, setShowThoughts] = useState(false);

  const [savedScroll, setSavedScroll] = useState(0);
  const [siteLogo, setSiteLogo] = useState(null);

  /* =========================
     DATA
  ========================= */

  useEffect(() => {
    fetch("https://cms.kriscreates.co.uk/wp-json/kc/v1/logo")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Logo fetch failed: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setSiteLogo(data?.url || null);
      })
      .catch(() => {
        setSiteLogo(null);
      });
  }, []);

  useEffect(() => {
    fetch("https://cms.kriscreates.co.uk/wp-json/wp/v2/kc_portfolio?_embed")
      .then((res) => res.json())
      .then((data) => setProjects(data))
      .catch(console.error);
  }, []);

  /* =========================
     NAVIGATION SYSTEM
  ========================= */

  const startTransition = () => {
    document.body.classList.add("transitioning");
    setTransitioning(true);
  };

  const goHome = () => {
    setPendingProject(null);
    setPendingContact(false);
    setPendingThoughts(false);
    setPendingScroll(null);
    startTransition();
  };

  const goThoughts = () => {
    setPendingThoughts(true);
    setPendingProject(null);
    setPendingContact(false);
    setPendingScroll(null);
    startTransition();
  };

  const goContact = () => {
    setPendingContact(true);
    setPendingProject(null);
    setPendingThoughts(false);
    setPendingScroll(null);
    startTransition();
  };

  const goToSection = (id) => {
    if (showContact || active || showThoughts) {
      setPendingScroll(id);
      setPendingContact(false);
      setPendingProject(null);
      setPendingThoughts(false);
      startTransition();
    } else {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth"
      });
    }
  };

  const goProject = (project) => {
    setSavedScroll(window.scrollY);
    setPendingProject(project);
    setPendingContact(false);
    setPendingThoughts(false);
    setPendingScroll(null);
    startTransition();
  };

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="app-shell">
      <Cursor />

      {transitioning && (
        <TransitionScreen
          onComplete={() => {
            setActive(pendingProject);
            setShowContact(pendingContact);
            setShowThoughts(pendingThoughts);

            const shouldRestoreScroll =
              !pendingProject &&
              !pendingContact &&
              !pendingThoughts &&
              !pendingScroll;

            setPendingProject(null);
            setPendingContact(false);
            setPendingThoughts(false);

            setTransitioning(false);

            if (pendingScroll) {
              const targetId = pendingScroll;

              const scrollToTarget = () => {
                const el = document.getElementById(targetId);

                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                  setPendingScroll(null);
                } else {
                  requestAnimationFrame(scrollToTarget);
                }
              };

              scrollToTarget();
            }

            if (shouldRestoreScroll) {
              requestAnimationFrame(() => {
                window.scrollTo(0, savedScroll);
              });
            }
          }}
        />
      )}

      <AnimatePresence>
        {!active && (
          <Header
            siteLogo={siteLogo}
            onHome={goHome}
            onWork={() => goToSection("work")}
            onAbout={() => goToSection("about")}
            onContact={goContact}
            onThoughts={goThoughts}
          />
        )}
      </AnimatePresence>

      <LayoutGroup>
        <AnimatePresence mode="wait">
          {showContact ? (
            <ContactPage onClose={goHome} />
          ) : showThoughts ? (
            <Thoughts
              key="thoughts"
              onSelect={goProject}
              isTransitioning={transitioning}
            />
          ) : !active ? (
            <Home
              key="home"
              projects={projects}
              isTransitioning={transitioning}
              onSelect={goProject}
            />
          ) : (
            <div key="project" className="project-mode">
              <ProjectView project={active} />

              <PreviewPanel
                project={active}
                projects={projects}
                onSelect={goProject}
                onClose={goHome}
                onBackToThoughts={goThoughts}
                siteLogo={siteLogo}
              />
            </div>
          )}
        </AnimatePresence>
      </LayoutGroup>
    </div>
  );
}

/* =========================
   TRANSITION
========================= */

function TransitionScreen({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
      document.body.classList.remove("transitioning");
    }, 650);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const lines = new Array(14).fill(0);

  return (
    <div className="transition-screen">
      {lines.map((_, i) => (
        <div
          key={i}
          className="transition-line"
          style={{ animationDelay: `${i * 0.035}s` }}
        />
      ))}
    </div>
  );
}