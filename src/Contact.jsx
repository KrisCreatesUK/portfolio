import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* =========================
   FORM
========================= */

function ContactForm() {
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

    const handleSubmit = async () => {
    console.log("🚀 SUBMIT CLICKED");
    console.log("📦 FORM DATA:", form);

    try {
        const res = await fetch(
        "https://cms.kriscreates.co.uk/wp-json/kc/v1/contact",
        {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            },
            body: JSON.stringify(form),
        }
        );

        console.log("📡 RESPONSE STATUS:", res.status);

        const data = await res.json().catch(() => null);
        console.log("📥 RESPONSE BODY:", data);

        if (res.ok) {
        console.log("✅ SUCCESS");
        setStatus("sent");
        } else {
        console.log("❌ ERROR RESPONSE");
        setStatus("error");
        }
    } catch (err) {
        console.log("🔥 FETCH FAILED:", err);
        setStatus("error");
    }
    };

  return (
    <div className="contact-flow">
      <div className="contact-progress-top">
        <div className="contact-progress-label">
          Step {Math.min(step + 1, 3)} / 3
        </div>

        <div className="contact-progress">
          <div
            className="contact-progress-bar"
            style={{ width: `${((Math.min(step, 2) + 1) / 3) * 100}%` }}
          />
        </div>

        <div className="contact-progress-nodes">
          <div className={`contact-progress-node ${step >= 0 ? "active" : ""}`} />
          <div className={`contact-progress-node ${step >= 1 ? "active" : ""}`} />
          <div className={`contact-progress-node ${step >= 2 ? "active" : ""}`} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {status !== "sent" && step === 0 && (
          <motion.div
            key="step1"
            className="contact-step"
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.28 }}
          >
            <h3>What should I call you?</h3>
            <p>Start simple, then I’ll guide the rest.</p>

            <input
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your name"
            />

            <div className="contact-actions">
              <button onClick={next} disabled={!form.name.trim()}>
                Continue
              </button>
            </div>
          </motion.div>
        )}

        {status !== "sent" && step === 1 && (
          <motion.div
            key="step2"
            className="contact-step"
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.28 }}
          >
            <h3>Nice to meet you, {form.name}.</h3>
            <p>Where should I reply?</p>

            <input
              autoFocus
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@email.com"
            />

            <div className="row">
              <button className="is-secondary" onClick={back}>
                Back
              </button>
              <button onClick={next} disabled={!form.email.trim()}>
                Continue
              </button>
            </div>
          </motion.div>
        )}

        {status !== "sent" && step === 2 && (
          <motion.div
            key="step3"
            className="contact-step"
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.28 }}
          >
            <h3>What are you looking to build?</h3>
            <p>
              Give me the rough version. Project type, features, goals, problems,
              anything useful.
            </p>

            <textarea
              autoFocus
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Tell me about your project..."
            />

            <div className="row">
              <button className="is-secondary" onClick={back}>
                Back
              </button>
              <button onClick={handleSubmit} disabled={!form.message.trim()}>
                Send
              </button>
            </div>
          </motion.div>
        )}

        {status === "sent" && (
          <motion.div
            key="success"
            className="contact-step"
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3>Message sent.</h3>
            <div className="contact-success">
              Thanks, I’ve got it. I’ll get back to you shortly.
            </div>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            key="error"
            className="contact-error"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Something went wrong sending that. Please try again.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =========================
   PAGE WRAPPER
========================= */

export default function ContactPage({ onClose }) {
  return (
    <motion.div
      className="contact-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="contact-bg-abstract" />
      <div className="contact-bg-stripes" />

      <div className="contact-inner">
        <div className="contact-side">
          <div className="contact-eyebrow">&lt; Start Project</div>

          <h1 className="contact-title">
            Let’s build something sharp.
          </h1>

          <p className="contact-copy">
            Websites, WooCommerce systems, custom plugins, bookings, integrations,
            or fixing something that already exists. Give me the rough outline and
            I’ll take it from there.
          </p>

          <div className="contact-side-meta">
            <div className="contact-side-meta-item">
              <span>Focus</span>
              <span>WordPress, WooCommerce, custom systems</span>
            </div>

            <div className="contact-side-meta-item">
              <span>Projects</span>
              <span>Business sites, ecommerce, plugins, functionality</span>
            </div>

            <div className="contact-side-meta-item">
              <span>Reply</span>
              <span>Usually within 1 to 2 working days</span>
            </div>
          </div>
        </div>

        <div className="contact-shell">
          <div className="contact-header">
            <button onClick={onClose}>← Back</button>
            <h2>[ Contact ]</h2>
          </div>

          <ContactForm />
        </div>
      </div>
    </motion.div>
  );
}