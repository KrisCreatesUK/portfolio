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

  const touch = (key) => setActive(key);

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

          {/* DESKTOP */}
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

          {/* HAMBURGER */}
          <button
            className={`hamburger ${open ? "active" : ""}`}
            onClick={() => setOpen(!open)}
          >
            <span />
            <span />
          </button>
        </div>
      </motion.header>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="mobile-nav">

              {/* WORK */}
              <a
                onClick={() => handle(onWork, "work")}
                onTouchStart={() => touch("work")}
                className={active === "work" ? "active" : ""}
              >
                {active === "work" && (
                  <motion.div
                    layoutId="mobile-indicator"
                    className="mobile-indicator"
                  />
                )}

                <svg viewBox="0 0 24 24">
                  <path d="M3 7h18M3 12h12M3 17h6" />
                </svg>
                <span>Work</span>
              </a>

              {/* ABOUT */}
              <a
                onClick={() => handle(onAbout, "about")}
                onTouchStart={() => touch("about")}
                className={active === "about" ? "active" : ""}
              >
                {active === "about" && (
                  <motion.div
                    layoutId="mobile-indicator"
                    className="mobile-indicator"
                  />
                )}

                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c2-4 6-6 8-6s6 2 8 6" />
                </svg>
                <span>About</span>
              </a>

              {/* THOUGHTS */}
              <a
                onClick={() => handle(onThoughts, "thoughts")}
                onTouchStart={() => touch("thoughts")}
                className={active === "thoughts" ? "active" : ""}
              >
                {active === "thoughts" && (
                  <motion.div
                    layoutId="mobile-indicator"
                    className="mobile-indicator"
                  />
                )}

                <svg viewBox="0 0 24 24">
                  <path d="M4 4h16v12H7l-3 3z" />
                </svg>
                <span>Thoughts</span>
              </a>

              {/* CONTACT */}
              <a
                onClick={() => handle(onContact, "contact")}
                onTouchStart={() => touch("contact")}
                className={active === "contact" ? "active" : ""}
              >
                {active === "contact" && (
                  <motion.div
                    layoutId="mobile-indicator"
                    className="mobile-indicator"
                  />
                )}

                <svg viewBox="0 0 24 24">
                  <path d="M4 4h16v16H4z" />
                  <path d="M4 6l8 6 8-6" />
                </svg>
                <span>Contact</span>
              </a>

            </div>
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

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelExitAction, setPanelExitAction] = useState(null);

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
    setPanelExitAction(null);
    startTransition();
  };

  const goThoughts = () => {
    setPendingThoughts(true);
    setPendingProject(null);
    setPendingContact(false);
    setPendingScroll(null);
    setPanelExitAction(null);
    startTransition();
  };

  const goContact = () => {
    setPendingContact(true);
    setPendingProject(null);
    setPendingThoughts(false);
    setPendingScroll(null);
    setPanelExitAction(null);
    startTransition();
  };

  const goToSection = (id) => {
    if (showContact || active || showThoughts) {
      setPendingScroll(id);
      setPendingContact(false);
      setPendingProject(null);
      setPendingThoughts(false);
      setPanelExitAction(null);
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
    setPanelExitAction(null);
    startTransition();
  };

  /* =========================
     PANEL CLOSE ACTIONS
  ========================= */

  const closePanelToHome = () => {
    setPanelExitAction("home");
    setPanelOpen(false);
  };

  const closePanelToThoughts = () => {
    setPanelExitAction("thoughts");
    setPanelOpen(false);
  };

  const handlePanelExitComplete = () => {
    if (panelExitAction === "home") {
      setPendingProject(null);
      setPendingContact(false);
      setPendingThoughts(false);
      setPendingScroll(null);

      startTransition();
    }

    if (panelExitAction === "thoughts") {
      setPendingThoughts(true);
      setPendingProject(null);
      setPendingContact(false);
      setPendingScroll(null);

      startTransition();
    }

    setPanelExitAction(null);
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

            if (pendingProject) {
              setPanelOpen(true);
            } else {
              setPanelOpen(false);
            }

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

            <AnimatePresence
              mode="wait"
              onExitComplete={handlePanelExitComplete}
            >
              {panelOpen && (
                <PreviewPanel
                  key={active.id}
                  project={active}
                  projects={projects}
                  onSelect={goProject}
                  onClose={closePanelToHome}
                  onBackToThoughts={closePanelToThoughts}
                  siteLogo={siteLogo}
                />
              )}
            </AnimatePresence>
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