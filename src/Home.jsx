import { motion } from "framer-motion";
import { useEffect, useState, useMemo, useRef } from "react";

/* =========================
   HELPERS
========================= */

function getProjectImage(project) {
  return (
    project?._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
    project?.kc_meta?.intro_image_url ||
    project?.kc_meta?.bg_image_url ||

    project?.kc_meta?.slides?.[0]?.image_url ||
    ""
  );
}

/* =========================
   HOME
========================= */

export default function Home({ projects, onSelect, isTransitioning }) {
  const words = [
    "custom plugins />",
    "woocommerce systems />",
    "booking platforms />",
    "business websites />",
    "api integrations />",
    "scalable features />"
  ];

  /* GROUPED (FIXED) */
  const grouped = {
    websites: projects.filter((p) => p.kc_meta?.type === "website"),
    plugins: projects.filter((p) => p.kc_meta?.type === "plugin"),
    products: projects.filter((p) => p.kc_meta?.type === "product"),
  };

  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);

  /* GLITCH EFFECT (FIXED + STABLE) */
  useEffect(() => {
    const chars = "!<>-_\\/[]{}=+*^?#▓▒░";
    const finalText = words[wordIndex];

    let iteration = 0;
    let settled = false;

    const interval = setInterval(() => {
      if (settled) return;

      const output = finalText
        .split("")
        .map((char, i) => {
          if (i < iteration) return finalText[i];
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join("");

      setText(output);

      iteration += 0.8;

      if (iteration >= finalText.length) {
        clearInterval(interval);

        // ✅ LOCK CLEAN TEXT
        setText(finalText);
        settled = true;

        // wait, then move to next word
        setTimeout(() => {
          setWordIndex((prev) => (prev + 1) % words.length);
        }, 2000);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [wordIndex]);

  return (
    <main className="home">

      {/* HERO */}
      <section className="page-section hero-section">
        <div className="bg-abstract" />
        <div className="bg-abstract-stripes" />

        <motion.div
          className="hero"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="eyebrow">&lt;BEGIN</div>

        <div className="hero-title">

        <div className="hero-line hero-dynamic">
          <h2>WordPress Developer</h2>

          <span className="hero-prefix">I build</span>

          <span className="typing-wrap">
            <span className="typing">{text}</span>
            <span className="cursor">|</span>
          </span>
        </div>
        </div>

        <h6 className="hero-sub">Let me show you...</h6>
        </motion.div>
      </section>

      {/* PROJECT SECTIONS */}
      <div className="home-sections">
        <Section
          id="work"
          type ="plugins"
          title="&lt; Plugins /&gt;"
          items={grouped.plugins}
          onSelect={onSelect}
          isTransitioning={isTransitioning}
        />
        <Section
          type="websites"
          title="&lt; Websites /&gt;"
          items={grouped.websites}
          onSelect={onSelect}
          isTransitioning={isTransitioning}
        />


        <Section
          type ="products"
          title="&lt; Products /&gt;"
          items={grouped.products}
          onSelect={onSelect}
          isTransitioning={isTransitioning}
        />
      </div>

      {/* ABOUT */}
      <AboutSection />
      {/* FIND ME */}
      <FindMeSection />

      {/* FOOTER */}
      <Footer />
    </main>
  );
}

/* =========================
   SECTION
========================= */
function chunkArray(array, size) {
  if (!array || array.length === 0) return [];

  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}
function Section({ id, type, title, items, onSelect, isTransitioning }) {
  if (!items || items.length === 0) return null;

  const chunkSize = 3;
  const chunks = chunkArray(items, chunkSize);

  return (
    <>
      {chunks.map((group, groupIndex) => (
        <section
          key={`${type}-${groupIndex}`}
          id={groupIndex === 0 ? id : undefined}
          className={`page-section section-${type}`}
        >
          <div className="bg-abstract" />
          <div className="bg-abstract-stripes" />

          <div className="section-inner">
            <div className="section-header">
              <div className="eyebrow">{title}</div>
            </div>

            <div className={`project-ribbon ribbon-phase-${groupIndex % 4}`}>
              {group.map((project, index) => {
                const image = getProjectImage(project);

                const globalIndex = groupIndex * chunkSize + index;

                const staggerClass =
                  globalIndex % 4 === 0
                    ? "offset-a"
                    : globalIndex % 4 === 1
                    ? "offset-b"
                    : globalIndex % 4 === 2
                    ? "offset-c"
                    : "offset-d";

                return (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    image={image}
                    staggerClass={staggerClass}
                    onClick={onSelect}
                    isTransitioning={isTransitioning}
                  />
                );
              })}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
/* =========================
   PROJECT CARD
========================= */

export function ProjectCard({ project, image, staggerClass, onClick, isTransitioning }) {
  const baseRotation = useMemo(() => {
    return {
      x: (Math.random() - 0.5) * 8,
      y: (Math.random() - 0.5) * 8
    };
  }, []);

  const [rotate, setRotate] = useState(baseRotation);
  const [touchActive, setTouchActive] = useState(false);
  // ✅ loading control
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const touchStartRef = useRef(null);
  // 🔥 track when loading started
  const loadStartRef = useRef(Date.now());

  useEffect(() => {
    if (!imageLoaded) return;

    const MIN_DURATION = 600; // 👈 adjust (500–800 sweet spot)

    const elapsed = Date.now() - loadStartRef.current;
    const remaining = Math.max(0, MIN_DURATION - elapsed);

    const t = setTimeout(() => {
      setShowLoader(false); // hide loader AFTER minimum time
      setShowText(true);    // reveal title after
    }, remaining);

    return () => clearTimeout(t);
  }, [imageLoaded]);

  const handleMove = (clientX, clientY, target) => {
    const wrap = target;
    const img = wrap.querySelector(".project-image");

    if (!img) return;

    const rect = wrap.getBoundingClientRect();

    const cw = rect.width;
    const ch = rect.height;

    const naturalRatio = img.naturalWidth / img.naturalHeight;
    const containerRatio = cw / ch;

    let renderedWidth, renderedHeight, offsetX, offsetY;

    if (naturalRatio > containerRatio) {
      renderedWidth = cw;
      renderedHeight = cw / naturalRatio;
      offsetX = 0;
      offsetY = (ch - renderedHeight) / 2;
    } else {
      renderedHeight = ch;
      renderedWidth = ch * naturalRatio;
      offsetY = 0;
      offsetX = (cw - renderedWidth) / 2;
    }

    let x = clientX - rect.left;
    let y = clientY - rect.top;

    x -= offsetX;
    y -= offsetY;

    x = Math.max(0, Math.min(renderedWidth, x));
    y = Math.max(0, Math.min(renderedHeight, y));

    const px = (x / renderedWidth) * 100;
    const py = (y / renderedHeight) * 100;

    wrap.style.setProperty("--x", `${px}%`);
    wrap.style.setProperty("--y", `${py}%`);

    const midX = rect.width / 2;
    const midY = rect.height / 2;

    const strength = 12;

    const rotateY =
      baseRotation.y +
      ((clientX - rect.left - midX) / midX) * strength;

    const rotateX =
      baseRotation.x +
      ((midY - (clientY - rect.top)) / midY) * strength;

    setRotate({ x: rotateX, y: rotateY });
  };
  return (
  <div
    className={`project-teaser ${staggerClass} ${touchActive ? "touch-active" : ""}`}
    onClick={() => onClick(project)}

    /* DESKTOP */
    onMouseMove={(e) => handleMove(e.clientX, e.clientY, e.currentTarget)}
    onMouseLeave={() => {
      setRotate(baseRotation);
      setTouchActive(false);
    }}

    /* MOBILE (FIXED) */
    onTouchStart={(e) => {
      const touch = e.touches[0];

      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };

      setTouchActive(false);
    }}

    onTouchMove={(e) => {
      if (!touchStartRef.current) return;

      const touch = e.touches[0];

      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      const time = Date.now() - touchStartRef.current.time;

      // 🔥 1. SCROLL DETECTION (vertical intent)
      if (absY > absX && absY > 8) {
        // user is scrolling → never activate tilt
        touchStartRef.current = null;
        return;
      }

      // 🔥 2. REQUIRE HOLD BEFORE ACTIVATION
      if (!touchActive) {
        if (time < 120) return; // 👈 tweak (100–150 sweet spot)

        setTouchActive(true);
      }

      handleMove(touch.clientX, touch.clientY, e.currentTarget);
    }}

    onTouchEnd={() => {
      touchStartRef.current = null;
      setTouchActive(false);
      setRotate(baseRotation);
    }}
  >
      <motion.div
        className="project-tilt"
        animate={{
          rotateX: rotate.x,
          rotateY: rotate.y,
          scale: 1.04
        }}
        transition={{ type: "spring", stiffness: 160, damping: 20 }}
      >
        <div className="project-teaser-inner">

          <div className="project-image-wrap">

            {/* ✅ loader */}
            <div className={`image-loader ${!showLoader ? "hide" : ""}`} />

            {image ? (
              <motion.img
                src={image}
                alt=""
                loading="lazy"
                onLoad={(e) => {
                  const img = e.target;

                  const ratio = img.naturalWidth / img.naturalHeight;

                  // set aspect ratio on wrapper
                  const wrap = img.closest(".project-image-wrap");
                  if (wrap) {
                    wrap.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
                  }

                  setImageLoaded(true);
                }}
                className="project-image"
                animate={{
                  scale: isTransitioning ? 0.96 : showLoader ? 1.05 : 1,
                  opacity: isTransitioning
                    ? 0.2
                    : !showLoader
                    ? 0.9
                    : 0,
                  filter: isTransitioning
                    ? "blur(6px)"
                    : showLoader
                    ? "blur(12px)"
                    : "blur(0px)"
                }}
                transition={{ duration: 0.5 }}
              />
            ) : (
              <div className="project-image placeholder" />
            )}

            <div className="project-spotlight" />
          </div>

          <div className={`project-title-overlay ${showText ? "show" : ""}`}>
            <h2
              className="project-title"
              dangerouslySetInnerHTML={{ __html: project.title.rendered }}
            />
          </div>

        </div>
      </motion.div>
    </div>
  );
}

export function PostCard({
  post,
  image,
  title,
  category,
  onClick,
  isTransitioning,
  staggerClass
}) {
  const baseRotation = useMemo(() => {
    return {
      x: (Math.random() - 0.5) * 6,
      y: (Math.random() - 0.5) * 6
    };
  }, []);

  const [rotate, setRotate] = useState(baseRotation);
  const [loaded, setLoaded] = useState(false);

  const handleMouseMove = (e) => {
    const wrap = e.currentTarget;
    const img = wrap.querySelector(".project-image");

    if (!img) return;

    const rect = wrap.getBoundingClientRect();

    const cw = rect.width;
    const ch = rect.height;

    const naturalRatio = img.naturalWidth / img.naturalHeight;
    const containerRatio = cw / ch;

    let renderedWidth, renderedHeight, offsetX, offsetY;

    if (naturalRatio > containerRatio) {
      renderedWidth = cw;
      renderedHeight = cw / naturalRatio;
      offsetX = 0;
      offsetY = (ch - renderedHeight) / 2;
    } else {
      renderedHeight = ch;
      renderedWidth = ch * naturalRatio;
      offsetY = 0;
      offsetX = (cw - renderedWidth) / 2;
    }

    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    x -= offsetX;
    y -= offsetY;

    x = Math.max(0, Math.min(renderedWidth, x));
    y = Math.max(0, Math.min(renderedHeight, y));

    const px = (x / renderedWidth) * 100;
    const py = (y / renderedHeight) * 100;

    // ✅ THIS WAS MISSING
    wrap.style.setProperty("--x", `${px}%`);
    wrap.style.setProperty("--y", `${py}%`);

    // tilt (keep your existing logic)
    const midX = rect.width / 2;
    const midY = rect.height / 2;

    const strength = 10;

    const rotateY =
      baseRotation.y +
      ((e.clientX - rect.left - midX) / midX) * strength;

    const rotateX =
      baseRotation.x +
      ((midY - (e.clientY - rect.top)) / midY) * strength;

    setRotate({ x: rotateX, y: rotateY });
  };

  return (
    <div
      className={`project-teaser post-card ${staggerClass}`}
      onClick={() => onClick(post)}
      onMouseMove={handleMouseMove}
      onMouseLeave={(e) => {
        setRotate(baseRotation);
        e.currentTarget.style.setProperty("--x", "50%");
        e.currentTarget.style.setProperty("--y", "50%");
      }}
    >
      <motion.div
        className="project-tilt"
        animate={{
          rotateX: rotate.x,
          rotateY: rotate.y,
          scale: 1.03
        }}
        transition={{ type: "spring", stiffness: 140, damping: 18 }}
      >
        <div className="project-teaser-inner">

          {/* IMAGE */}
          <div className="project-image-wrap">

            <div className={`image-loader ${loaded ? "hide" : ""}`} />

            {image ? (
              <motion.img
                src={image}
                alt=""
                onLoad={(e) => {
                  const img = e.target;

                  const wrap = img.closest(".project-image-wrap");

                  if (wrap && img.naturalWidth && img.naturalHeight) {
                    wrap.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
                  }

                  setLoaded(true);
                }}
                className="project-image"
                animate={{
                  scale: loaded ? 1 : 1.05,
                  opacity: loaded ? 0.95 : 0,
                  filter: loaded ? "blur(0px)" : "blur(10px)"
                }}
                transition={{ duration: 0.4 }}
              />
            ) : (
              <div className="project-image placeholder" />
            )}
            {/* keep your spotlight */}
            <div className="project-spotlight" />
          </div>

          {/* TEXT BELOW IMAGE */}
          <div className="post-card-meta">
            <div className="post-card-category">{category}</div>
            <h3 className="post-card-title">{title}</h3>
          </div>

        </div>
      </motion.div>
    </div>
  );
}

/* =========================
   ABOUT SECTION
========================= */
function AboutSection() {
  const ref = useRef();

  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);

  const fullCode = [
    "class Kris {",
    "// WordPress developer focused on real-world systems.",
    "// Plugins, WooCommerce, and scalable functionality.",
    "",
    "constructor() {",
    "this.name = 'Kris'",
    "this.location = 'UK'",
    "",
    "this.role = 'WordPress Developer'",
    "",
    "this.specialisesIn = [",
    "'Custom WordPress plugins',",
    "'WooCommerce functionality',",
    "'Booking and ordering systems',",
    "'API integrations and backend logic'",
    "]",
    "",
    "this.stack = [",
    "'WordPress','WooCommerce',",
    "'PHP','MySQL',",
    "'JavaScript','AJAX','jQuery','React',",
    "'HTML','CSS'",
    "]",
    "}",
    "",
    "whatIDo() {",
    "return [",
    "'Build custom WordPress plugins and features',",
    "'Develop WooCommerce stores and custom functionality',",
    "'Create booking, ordering, and business systems',",
    "'Implement dynamic frontends using AJAX and JavaScript',",
    "'Improve, debug, and scale existing websites'",
    "]",
    "}",
    "",
    "howIWork() {",
    "return [",
    "'Keep solutions simple, reliable, and maintainable',",
    "'Communicate clearly and deliver consistently',",
    "'Focus on business impact, not just code',",
    "'Ship clean, working solutions without overcomplication'",
    "]",
    "}",
    "",
    "experience() {",
    "return [",
    "{ 'Freelance': 'WordPress development, ecommerce, and custom systems' },",
    "{ 'Agencies': 'White-label work and ongoing collaboration' },",
    "{ 'Frontend': 'JavaScript, AJAX, UI development, performance optimisation' },",
    "{ 'Backend': 'PHP, APIs, integrations, database design' }",
    "]",
    "}",
    "",
    "skills() {",
    "return [",
    "'WordPress','WooCommerce','PHP','MySQL',",
    "'JavaScript','AJAX','jQuery','React',",
    "'HTML','CSS','REST APIs','Performance','Debugging'",
    "]",
    "}",
    "}"
  ];

  function formatLine(line) {
    if (line.trim().startsWith("//")) {
      return `<span class="comment">${line}</span>`;
    }

    let output = line;

    /* STRINGS FIRST */
    const strings = [];
    output = output.replace(/'([^']*)'/g, (match) => {
      strings.push(match);
      return `__STRING_${strings.length - 1}__`;
    });

    /* NUMBERS (protect them) */
    const numbers = [];
    output = output.replace(/\b\d+\b/g, (match) => {
      numbers.push(match);
      return `__NUMBER_${numbers.length - 1}__`;
    });

    /* KEYWORDS */
    output = output.replace(/\bclass\b/g, `<span class="methods">class</span>`);
    output = output.replace(/\bconstructor\b/g, `<span class="methods">constructor</span>`);
    output = output.replace(/\breturn\b/g, `<span class="methods">return</span>`);
    output = output.replace(/\bthis\b/g, `<span class="scope">this</span>`);

    /* FUNCTION NAMES */
    output = output.replace(
      /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g,
      `<span class="fn">$1</span>`
    );

    /* RESTORE STRINGS */
    output = output.replace(/__STRING_(\d+)__/g, (_, i) => {
      return `<span class="string">${strings[i]}</span>`;
    });

    /* RESTORE NUMBERS */
    output = output.replace(/__NUMBER_(\d+)__/g, (_, i) => {
      return `<span class="number">${numbers[i]}</span>`;
    });

    return output;
  }

  /* INTERSECTION OBSERVER */
  useEffect(() => {
    const container = document.querySelector(".home");
    if (!ref.current || !container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        root: container,
        threshold: 0.2
      }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  /* STABLE TYPING ENGINE */
  useEffect(() => {
    if (!visible) return;

    let cancelled = false;

    const tick = () => {
      if (cancelled) return;

      setIndex((prev) => {
        if (prev >= fullCode.length) return prev;
        return prev + 1;
      });

      if (!cancelled) {
        setTimeout(tick, 60);
      }
    };

    tick();

    return () => {
      cancelled = true;
    };
  }, [visible]);

  return (
    <section id="about" className="page-section about-section" ref={ref}>
      <div className="bg-abstract" />
      <div className="bg-abstract-stripes" />
      <div className="section-inner">

        <div className="section-header">
          <div className="eyebrow">About /&gt;</div>
        </div>

        <div className="code-wrp">
          {fullCode.slice(0, index).map((line, i) => (
            <div key={i} className="code-l">
              <span className="line-number">
                {String(i + 1).padStart(2, "0")}
              </span>

              <span
                className="code-content"
                dangerouslySetInnerHTML={{
                  __html: formatLine(line)
                }}
              />
            </div>
          ))}

          <div className="cursor">|</div>
        </div>

      </div>
    </section>
  );
}
function FindMeSection() {
  return (
    <section className="page-section section-find">
      <div className="bg-abstract" />
      <div className="bg-abstract-stripes" />

      <div className="section-inner">
        <div className="section-header">
          <div className="eyebrow">Find Me /&gt;</div>
        </div>

        <div className="find-grid">

          {/* LINKEDIN */}
          <a href="https://linkedin.com" target="_blank" className="find-tile">
            <div className="logo-wrap">
              <svg viewBox="0 0 24 24" className="find-me-logo">
                <path fill="currentColor" d="M4.98 3.5C4.98 4.88 3.87 6 2.49 6S0 4.88 0 3.5 1.11 1 2.49 1 4.98 2.12 4.98 3.5zM0 8h5v16H0V8zm7.5 0h4.8v2.2h.1c.7-1.3 2.4-2.7 5-2.7 5.4 0 6.4 3.5 6.4 8v9.5h-5v-8.4c0-2-.03-4.6-2.8-4.6-2.8 0-3.2 2.2-3.2 4.5V24h-5V8z"/>
              </svg>
            </div>
            <span className="tile-label">LinkedIn</span>
          </a>

          {/* FIVERR */}
          <a href="https://fiverr.com" target="_blank" className="find-tile">
            <div className="logo-wrap">
              <span className="find-me-logo">fi</span>
            </div>
            <span className="tile-label">Fiverr</span>
          </a>

          {/* UPWORK */}
          <a href="https://upwork.com" target="_blank" className="find-tile">
            <div className="logo-wrap">
              <span className="find-me-logo up">Up</span>
            </div>
            <span className="tile-label">Upwork</span>
          </a>

          {/* PPH */}
          <a href="https://peopleperhour.com" target="_blank" className="find-tile">
            <div className="logo-wrap">
              <span className="find-me-logo pph">PPH</span>
            </div>
            <span className="tile-label">PeoplePerHour</span>
          </a>

        </div>
      </div>
    </section>
  );
}
function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">

        <div className="footer-left">
          © {new Date().getFullYear()} KrisCreates
        </div>

        <div className="footer-right">
          Built with React + WordPress
        </div>

      </div>
    </footer>
  );
}