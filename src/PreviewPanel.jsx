import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

function stripHtml(html = "") {
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || div.innerText || "").trim();
}

function normaliseTag(tag = "") {
  return tag.toLowerCase().replace(/\s+/g, "");
}

export default function PreviewPanel({
  project,
  projects,
  onClose,
  onSelect,
  onBackToThoughts,
  siteLogo
}) {
  if (!project) return null;

  const isPost = !project.kc_meta;
  const meta = project.kc_meta || {};

  const index = projects.findIndex((p) => p.id === project.id);

  const prevProject =
    index > 0 ? projects[index - 1] : projects[projects.length - 1];

  const nextProject =
    index < projects.length - 1 ? projects[index + 1] : projects[0];

  const rawDescription = stripHtml(
    project.excerpt?.rendered || project.content?.rendered
  );

  const description =
    rawDescription.length > 180
      ? rawDescription.slice(0, 180) + "..."
      : rawDescription;

  const liveUrl = meta.live_url;
  const hasLiveUrl = !!liveUrl && liveUrl !== "#";

  const skills = meta.skills || [];
  const tech = meta.tech || [];

  /* =========================
     BUTTON HOVER FX
  ========================= */
  useEffect(() => {
    const buttons = document.querySelectorAll(
      ".preview-panel .project-button.pro"
    );

    const handleMove = (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      e.currentTarget.style.setProperty("--mx", `${x}px`);
      e.currentTarget.style.setProperty("--my", `${y}px`);
    };

    const handleLeave = (e) => {
      e.currentTarget.style.setProperty("--mx", "50%");
      e.currentTarget.style.setProperty("--my", "50%");
    };

    buttons.forEach((btn) => {
      btn.addEventListener("mousemove", handleMove);
      btn.addEventListener("mouseleave", handleLeave);
    });

    return () => {
      buttons.forEach((btn) => {
        btn.removeEventListener("mousemove", handleMove);
        btn.removeEventListener("mouseleave", handleLeave);
      });
    };
  }, []);

  /* =========================
     CLOSE / BACK LOGIC
  ========================= */
  const handleClose = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isPost && onBackToThoughts) {
      onBackToThoughts();
    } else {
      onClose();
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.aside
        className="preview-panel"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.4 }}
      >
        <div className="bg-abstract" />
        <div className="bg-abstract-stripes" />

        {/* LOGO */}
        <div className="panel-logo">
            <img
              src={
                siteLogo ||
                "https://cms.kriscreates.co.uk/wp-content/uploads/2025/10/kc-logo-1.png"
              }
              alt="Kris Creates logo"
            />
        </div>

        {/* TOP BAR */}
        <div className="panel-top">
          <button
            type="button"
            className="panel-close"
            onClick={handleClose}
          >
            {isPost ? "back" : "close"}
          </button>

          {!isPost && (
            <div className="panel-nav">
              <button type="button" onClick={() => onSelect(prevProject)}>
                ‹
              </button>
              <button type="button" onClick={() => onSelect(nextProject)}>
                ›
              </button>
            </div>
          )}
        </div>

        {/* HEADER */}
        <div className="panel-header">
          <div className="panel-label">
            {isPost ? "[ post.article ]" : "[ project.system ]"}
          </div>

          <h2
            className="panel-title"
            dangerouslySetInnerHTML={{
              __html: project.title.rendered
            }}
          />
        </div>

        {/* =========================
           PROJECT ONLY DATA
        ========================= */}
        {!isPost && skills.length > 0 && (
          <div className="panel-section">
            <div className="panel-sub">&lt;skills Used()</div>

            <div className="panel-tags">
              {skills.map((tag, i) => (
                <span key={i} className="tag" data-tag={normaliseTag(tag)}>
                  {tag}
                </span>
              ))}
            </div>
            /&gt;
          </div>
        )}

        {!isPost && tech.length > 0 && (
          <div className="panel-section">
            <div className="panel-sub">&lt;tech Used()</div>

            <div className="panel-tags">
              {tech.map((tag, i) => (
                <span key={i} className="tag" data-tag={normaliseTag(tag)}>
                  {tag}
                </span>
              ))}
            </div>
            /&gt;
          </div>
        )}

        {/* DESCRIPTION */}
        <div className="panel-section">
          <div className="panel-sub">description</div>
          <p className="panel-text">{description}</p>
        </div>

        {/* CTA */}
        {!isPost && hasLiveUrl && (
          <div className="panel-section panel-cta">
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="project-button pro"
            >
              <svg viewBox="0 0 24 24" className="icon">
                <path d="M14 3H21V10" />
                <path d="M21 3L10 14" />
                <path d="M5 5V19H19V10" />
              </svg>

              <span className="text">View Live</span>
            </a>
          </div>
        )}
      </motion.aside>
    </AnimatePresence>
  );
}