import { AnimatePresence, motion } from "framer-motion";

export default function ProjectPanel({ project }) {
  return (
    <div className="panel-wrap">
      <AnimatePresence mode="wait">
        <motion.article
          key={project.id}
          className="panel"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.32, ease: [0.2, 0.7, 0.3, 1] }}
          style={{ "--accent": project.accent }}
        >
          <header className="panel-head">
            <div className="panel-code">
              <span className="panel-index">{project.index}</span>
              {project.code}
            </div>
            <span className={`badge badge-${project.statusTone}`}>{project.status}</span>
          </header>

          <h2 className="panel-title">{project.name}</h2>
          <p className="panel-kind">
            {project.kind} <span className="sep">/</span> {project.year}{" "}
            <span className="sep">/</span> {project.version}
          </p>

          <p className="panel-blurb">{project.blurb}</p>

          {project.images?.length > 0 && (
            <div className={`shots shots-${project.shotFit}`}>
              {project.images.map((img) => (
                <figure key={img.src}>
                  <img src={img.src} alt={img.caption} loading="lazy" />
                  <figcaption>{img.caption}</figcaption>
                </figure>
              ))}
            </div>
          )}

          <div className="panel-body">
            {project.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <div className="panel-cols">
            <section>
              <h3 className="mini-title">What's in it</h3>
              <ul className="ticks">
                {project.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="mini-title">Built with</h3>
              <ul className="chips">
                {project.stack.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </section>
          </div>

          {project.links.length > 0 && (
            <footer className="panel-foot">
              {project.links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener"
                  className={l.primary ? "btn btn-primary" : "btn"}
                >
                  {l.label} <span aria-hidden="true">↗</span>
                </a>
              ))}
            </footer>
          )}
        </motion.article>
      </AnimatePresence>
    </div>
  );
}
