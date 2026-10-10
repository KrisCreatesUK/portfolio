
/* =========================================================
   ONE PROJECT'S PAGE
   ---------------------------------------------------------
   Opens over the cyberspace rather than replacing it: the
   array is still turning behind the glass while you read.

   The write-up is dealt out as numbered steps, each with the
   screenshot that belongs to it, so the page walks you
   through the thing instead of dropping an essay on you.

   Every project's page is in the DOM at all times, with the
   closed ones carrying `hidden`. That is what keeps the copy
   and the outbound links in the prerendered markup for the
   crawlers that never run our JavaScript.
   ========================================================= */

export default function ProjectView({ project, open, index, total, onClose, onJump, onContact, projects }) {
  const steps = project.body.map((text, i) => ({
    text,
    image: project.images?.[i] ?? null,
  }));
  const rest = (project.images ?? []).slice(project.body.length);

  return (
    <article
      hidden={!open}
      className={`deck ${open ? "is-open" : ""}`}
      style={{ "--accent": project.accent }}
      aria-labelledby={`${project.id}-title`}
    >
      {/* ---------- the switcher, stuck under the header ---------- */}
      <nav className="deck-switch" aria-label="Switch volume">
        <button className="deck-back" onClick={onClose}>
          <span aria-hidden="true">←</span> The map
        </button>
        <div className="deck-tabs">
          {projects.map((p) => (
            <button
              key={p.id}
              className={`vol-tab ${p.id === project.id ? "is-active" : ""}`}
              style={{ "--accent": p.accent }}
              aria-current={p.id === project.id ? "true" : undefined}
              onClick={() => onJump(p.id)}
            >
              <span className="vol-tab-code">{p.code}</span>
              <span className="vol-tab-name">{p.name}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ---------- title card ---------- */}
      <header className="deck-head">
        <div className="deck-meta">
          <span className="deck-code" data-text={project.code}>{project.code}</span>
          <span className={`badge badge-${project.statusTone}`}>{project.status}</span>
          <span className="deck-seq">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        </div>

        <h1 className="deck-title glitch" id={`${project.id}-title`} data-text={project.name}>
          {project.name}
        </h1>

        <p className="deck-kind">
          {project.kind} <span className="sep">/</span> {project.year}{" "}
          <span className="sep">/</span> {project.version}
        </p>

        <p className="deck-blurb">{project.blurb}</p>

        {project.links.length > 0 && (
          <div className="deck-links">
            {project.links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target={l.href.startsWith("mailto:") ? undefined : "_blank"}
                rel="noopener"
                className={l.primary ? "btn btn-primary" : "btn"}
              >
                {l.label} <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        )}
      </header>

      {/* ---------- the walkthrough ---------- */}
      <div className="deck-steps">
        {steps.map((step, i) => (
          <section className="step" key={i}>
            <div className="step-rail" aria-hidden="true">
              <span className="step-no">{String(i + 1).padStart(2, "0")}</span>
              <span className="step-line" />
            </div>

            <div className="step-body">
              <p>{step.text}</p>

              {step.image && (
                <figure className="step-shot">
                  <img src={step.image.src} alt={step.image.caption} loading="lazy" />
                  <figcaption>{step.image.caption}</figcaption>
                </figure>
              )}
            </div>
          </section>
        ))}
      </div>

      {/* ---------- the facts ---------- */}
      <div className="deck-cols">
        <section>
          <h2 className="mini-title">What&apos;s in it</h2>
          <ul className="ticks">
            {project.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mini-title">Built with</h2>
          <ul className="chips">
            {project.stack.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      </div>

      {/* ---------- anything the steps didn't use ---------- */}
      {rest.length > 0 && (
        <div className="deck-gallery">
          {rest.map((img) => (
            <figure key={img.src}>
              <img src={img.src} alt={img.caption} loading="lazy" />
              <figcaption>{img.caption}</figcaption>
            </figure>
          ))}
        </div>
      )}

      <footer className="deck-foot">
        <button className="btn" onClick={onClose}>
          <span aria-hidden="true">←</span> Back to the map
        </button>
        <button className="btn btn-primary" onClick={onContact}>Start a conversation</button>
      </footer>
    </article>
  );
}
