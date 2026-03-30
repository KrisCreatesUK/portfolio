import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useLayoutEffect, useRef } from "react";
import Prism from "prismjs";

import "prismjs/themes/prism-tomorrow.css";

import "prismjs/components/prism-markup";
import "prismjs/components/prism-markup-templating";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-php";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-css";

function getHeroImage(project) {
  return (
    project?.kc_meta?.intro_image_url ||
    project?.kc_meta?.bg_image_url ||
    project?._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
    project?.kc_meta?.slides?.[0]?.image_url ||
    project?.image ||
    ""
  );
}

export default function ProjectView({ project }) {
  const heroImage = getHeroImage(project);
  const isWPPost = !project?.kc_meta;
  const slides = project?.kc_meta?.slides || [];
  const containerRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [project?.id]);

  useLayoutEffect(() => {
    if (!isWPPost) return;

    const container = containerRef.current;
    if (!container) return;

    const codeBlocks = container.querySelectorAll(
      'pre code[class*="language-"], code[class*="language-"]'
    );

    console.log("Prism languages:", Object.keys(Prism.languages));
    console.log("Found code blocks:", codeBlocks.length);

    codeBlocks.forEach((block) => {
      Prism.highlightElement(block);
    });
  }, [project?.id, isWPPost]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, -120]);

  return (
    <motion.div
      ref={containerRef}
      key={project.id}
      className="project-view"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.35,
        ease: [0.4, 0, 0.2, 1]
      }}
    >
      <div className="project-view-grid" />

      {heroImage && (
        <section className="project-hero-image-only">
          <motion.img
            src={heroImage}
            alt=""
            className="project-hero-image"
            style={{ y: heroY }}
          />
        </section>
      )}

      {isWPPost && (
        <section className="project-content">
          <div className="content-inner">
            <div className="panel-label">POST</div>

            <h1
              dangerouslySetInnerHTML={{
                __html: project.title?.rendered || ""
              }}
            />

            {project.categoryName && (
              <div className="post-category">{project.categoryName}</div>
            )}

            <div
              className="post-body"
              dangerouslySetInnerHTML={{
                __html: project.content?.rendered || ""
              }}
            />
          </div>
        </section>
      )}

      {!isWPPost && slides.length > 0 && (
        <section className="project-slides">
          {slides.map((slide, i) => (
            <motion.div
              key={i}
              className={`project-slide ${
                slide.orientation === "right" ? "reverse" : ""
              }`}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1]
              }}
            >
              <div className="slide-copy">
                {slide.title && <h3>{slide.title}</h3>}
                {slide.content && <p>{slide.content}</p>}
              </div>

              {slide.image_url && (
                <div className="slide-media">
                  <img src={slide.image_url} alt="" />
                </div>
              )}
            </motion.div>
          ))}
        </section>
      )}
    </motion.div>
  );
}