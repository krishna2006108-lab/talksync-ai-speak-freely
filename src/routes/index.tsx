import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import "./index.css";

export const Route = createFileRoute("/")({
  component: TalkSyncLanding,
});

// ============ CONFIG ============
const PAYMENT_LINK = ""; // TODO: wire to Razorpay

type Seat = { n: number; credits: number; mins: number; taken: boolean };

const SEATS: Seat[] = [
  { n: 1, credits: 600, mins: 40, taken: false },
  { n: 2, credits: 540, mins: 36, taken: false },
  { n: 3, credits: 495, mins: 33, taken: false },
  { n: 4, credits: 450, mins: 30, taken: false },
  { n: 5, credits: 420, mins: 28, taken: false },
  { n: 6, credits: 390, mins: 26, taken: false },
  { n: 7, credits: 360, mins: 24, taken: false },
  { n: 8, credits: 330, mins: 22, taken: false },
  { n: 9, credits: 315, mins: 21, taken: false },
  { n: 10, credits: 300, mins: 20, taken: false },
];

const FAQ_ITEMS = [
  {
    q: "What exactly do I get for ₹299?",
    a: "You lock in a founding seat with your first month of service included, the ₹299/mo price for life, monthly credits tied to your seat number, and direct founder access via WhatsApp to shape the product.",
  },
  {
    q: "What if the product never launches?",
    a: "Full ₹299 refund by [LAUNCH DATE]. No questions asked. This promise is written here publicly and we stand by it.",
  },
  {
    q: "How do credits work?",
    a: "1 minute of live translation = 15 credits. Unused credits roll over for 1 month. Founders can top up at ₹100 for 150 credits (locked forever, regular price ₹120).",
  },
  {
    q: "Which languages are supported?",
    a: "Hindi ↔ English at launch. Spanish and Portuguese are next in the pipeline. Founders vote on which language comes after.",
  },
  {
    q: "Does it work on Zoom / Meet / Teams?",
    a: "Yes — TalkSync runs alongside your call as a virtual audio device, so it is fully platform-independent. Zoom, Google Meet, Microsoft Teams, Whereby, anything.",
  },
  {
    q: "When is launch?",
    a: "[LAUNCH MONTH]. Founding members get access 2 weeks before public launch, plus a private onboarding call with the founder.",
  },
];

const PROBLEM_ITEMS = [
  "LOST A DEAL BECAUSE OF ENGLISH?",
  "AVOIDING VIDEO CALLS?",
  "TYPING WHEN YOU SHOULD BE TALKING?",
  "CLIENT SAID 'SORRY, DIDN'T GET THAT'?",
];

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function TalkSyncLanding() {
  const seatsAvailable = useMemo(() => SEATS.filter((s) => !s.taken).length, []);
  const nextAvailable = useMemo(() => SEATS.find((s) => !s.taken)?.n ?? null, []);

  // Scroll reveal
  useEffect(() => {
    if (typeof window === "undefined") return;
    const els = document.querySelectorAll<HTMLElement>(".ts-reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("ts-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("ts-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const claim = (n?: number) => {
    if (PAYMENT_LINK) {
      window.location.href = PAYMENT_LINK + (n ? `?seat=${n}` : "");
    } else {
      scrollToId("seats");
    }
  };

  return (
    <div className="ts-root">
      {/* 0. STICKY TOP BAR */}
      <div className="ts-sticky" role="banner">
        <span className="ts-sticky-text">
          🔥 {seatsAvailable}/10 FOUNDING SEATS LEFT — ₹299/MO FOREVER
        </span>
        <button className="ts-sticky-btn" onClick={() => scrollToId("seats")}>
          CLAIM
        </button>
      </div>

      <main>
        {/* 1. HERO */}
        <section className="ts-section ts-section-lime ts-hero">
          <div className="ts-container">
            <h1>SPEAK HINDI. THEY HEAR ENGLISH. LIVE.</h1>
            <p className="ts-hero-sub">
              Real-time AI voice translation for your client calls on Zoom, Google Meet & Teams.
              You talk in your language — your client hears a natural human-like voice in theirs.
            </p>
            <div className="ts-hero-ctas">
              <button className="ts-btn" onClick={() => scrollToId("seats")}>
                CLAIM FOUNDING SEAT — ₹299/MO FOREVER
              </button>
              <button className="ts-btn ts-btn-ghost" onClick={() => scrollToId("demo")}>
                ▶ WATCH 60-SEC DEMO
              </button>
            </div>
            <div className="ts-hero-trust">
              90% off list price · Full refund if we don't launch · Free trial needs no card
            </div>

            {/* Hero visual */}
            <div className="ts-hero-visual ts-reveal" aria-label="Voice translation flow demo">
              {/* YOU frame */}
              <div className="ts-frame" role="img" aria-label="You speaking Hindi">
                <span className="ts-frame-label">YOU</span>
                <div className="ts-frame-body">
                  <div className="ts-wave" aria-hidden="true">
                    {Array.from({ length: 10 }).map((_, i) => <span key={i} />)}
                  </div>
                  <div className="ts-bubble ts-bubble-lime">
                    मैं आपको प्रोजेक्ट समझाता हूँ…
                  </div>
                </div>
              </div>

              {/* Pipeline */}
              <div className="ts-pipeline" aria-hidden="true">
                <div className="ts-node">SPEECH → TEXT</div>
                <div className="ts-arrow">▶</div>
                <div className="ts-node">TRANSLATE</div>
                <div className="ts-arrow">▶</div>
                <div className="ts-node">AI VOICE</div>
              </div>

              {/* CLIENT frame */}
              <div className="ts-frame" role="img" aria-label="Client hearing English">
                <span className="ts-frame-label">YOUR CLIENT</span>
                <div className="ts-frame-body">
                  <div className="ts-bubble ts-typing">
                    Let me walk you through the project…
                  </div>
                  <div className="ts-wave" aria-hidden="true">
                    {Array.from({ length: 10 }).map((_, i) => <span key={i} />)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. PROBLEM MARQUEE */}
        <section className="ts-marquee" aria-label="Common problems">
          <div className="ts-marquee-track">
            {Array.from({ length: 3 }).map((_, r) =>
              PROBLEM_ITEMS.map((t, i) => (
                <span key={`${r}-${i}`}>&nbsp;&nbsp;{t}&nbsp;&nbsp;•</span>
              ))
            )}
          </div>
        </section>

        {/* 3. WHY THIS EXISTS */}
        <section className="ts-section ts-section-white">
          <div className="ts-container">
            <h2 className="ts-section-title ts-reveal">WHY THIS EXISTS</h2>
            <div className="ts-grid ts-grid-3 ts-reveal">
              <article className="ts-card">
                <h3>CALLS = TRUST = MONEY</h3>
                <p>
                  Freelancers who do video calls close higher-paying projects. Chat-only
                  freelancers get chat-only rates.
                </p>
              </article>
              <article className="ts-card">
                <h3>ENGLISH ANXIETY IS EXPENSIVE</h3>
                <p>
                  Every avoided call, every misunderstood requirement, every awkward silence
                  costs you clients.
                </p>
              </article>
              <article className="ts-card">
                <h3>YOUR SKILL ISN'T THE PROBLEM. THE LANGUAGE WALL IS.</h3>
                <p>
                  Remove the wall — keep your skill, your voice, your confidence.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* 4. HOW IT WORKS */}
        <section className="ts-section ts-section-ink">
          <div className="ts-container">
            <h2 className="ts-section-title ts-reveal">HOW IT WORKS</h2>
            <div className="ts-grid ts-grid-3 ts-reveal">
              <article className="ts-card">
                <div className="ts-card-num">1</div>
                <h3>JOIN ANY MEETING</h3>
                <p>Zoom, Google Meet or Microsoft Teams.</p>
                <div className="ts-badges">
                  <span className="ts-badge">ZOOM</span>
                  <span className="ts-badge">MEET</span>
                  <span className="ts-badge">TEAMS</span>
                </div>
              </article>
              <article className="ts-card">
                <div className="ts-card-num">2</div>
                <h3>SPEAK YOUR LANGUAGE</h3>
                <p>Hindi, English + more coming.</p>
                <div className="ts-badges">
                  <span className="ts-badge">हिन्दी</span>
                  <span className="ts-badge">ENGLISH</span>
                  <span className="ts-badge">+ MORE</span>
                </div>
              </article>
              <article className="ts-card">
                <div className="ts-card-num">3</div>
                <h3>THEY HEAR THEIRS</h3>
                <p>Natural AI voice, in real time. Live captions run for both sides.</p>
              </article>
            </div>
          </div>
        </section>

        {/* 5. DEMO */}
        <section id="demo" className="ts-section ts-section-white">
          <div className="ts-container">
            <h2 className="ts-section-title ts-reveal">SEE IT IN 60 SECONDS</h2>
            <div id="demo-video" className="ts-demo-frame ts-reveal" role="img" aria-label="60 second demo video placeholder">
              <div className="ts-demo-play" />
            </div>
            <div style={{ textAlign: "center" }}>
              <button className="ts-btn" onClick={() => scrollToId("seats")}>
                CLAIM FOUNDING SEAT — ₹299/MO FOREVER
              </button>
            </div>
          </div>
        </section>

        {/* 6. THE OFFER */}
        <section id="seats" className="ts-section ts-section-lime">
          <div className="ts-container">
            <h2 className="ts-section-title ts-reveal">
              FOUNDING 10 — EVERYONE PAYS ₹299/MO. FOREVER.
            </h2>
            <p className="ts-section-lead ts-reveal">
              That's 90% off the ₹2,999 list price — locked for life. Your seat number decides
              your monthly credits. Earlier seat = more credits, forever.
            </p>

            <div className="ts-seat-grid ts-reveal">
              {SEATS.map((s) => {
                const isNext = s.n === nextAvailable;
                if (s.taken) {
                  return (
                    <div key={s.n} className="ts-seat ts-seat-taken" aria-label={`Seat ${s.n} taken`}>
                      <div className="ts-seat-num">
                        SEAT <strong>{s.n}</strong>
                      </div>
                      <div className="ts-seat-credits">{s.credits} CREDITS/MO</div>
                      <div className="ts-seat-mins">(~{s.mins} min of live translation)</div>
                      <div className="ts-seat-stamp" aria-hidden="true">✕</div>
                      <div className="ts-seat-taken-label">TAKEN</div>
                    </div>
                  );
                }
                return (
                  <div
                    key={s.n}
                    className={`ts-seat${isNext ? " ts-seat-next" : ""}`}
                    aria-label={`Seat ${s.n} available`}
                  >
                    {isNext && <span className="ts-seat-next-badge">← NEXT AVAILABLE</span>}
                    <div className="ts-seat-num">
                      SEAT <strong>{s.n}</strong>
                    </div>
                    <div className="ts-seat-credits">{s.credits} CREDITS/MO</div>
                    <div className="ts-seat-mins">(~{s.mins} min of live translation)</div>
                    <button
                      className="ts-seat-btn"
                      onClick={() => claim(s.n)}
                    >
                      CLAIM SEAT {s.n} — ₹299
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="ts-urgency ts-reveal">
              EVERY SEAT YOU MISS = FEWER CREDITS. FOR LIFE. Seat 1 gets 2× the credits of Seat
              10 — same ₹299.
            </div>
            <div className="ts-closing ts-reveal">
              After Seat 10: ₹2,999/mo · 3,000 credits. No extensions. No exceptions.
            </div>
            <div className="ts-fineprint ts-reveal">
              1 minute of live translation = 15 credits · Unused credits roll over 1 month ·
              Founder top-up: ₹100 = 150 credits, locked forever (regular ₹120)
            </div>
          </div>
        </section>

        {/* 7. FEATURES */}
        <section className="ts-section ts-section-white">
          <div className="ts-container">
            <h2 className="ts-section-title ts-reveal">WHAT'S IN THE BOX</h2>
            <div className="ts-grid ts-grid-3 ts-reveal">
              <article className="ts-card">
                <h3>LIVE VOICE TRANSLATION</h3>
                <p>Natural voice, not robotic. Your tone, their language.</p>
              </article>
              <article className="ts-card">
                <h3>LIVE CAPTIONS</h3>
                <p>Both languages, side by side. Nobody loses a word.</p>
              </article>
              <article className="ts-card">
                <span className="ts-badge-onlyus">ONLY US</span>
                <h3>MEETING SUMMARY IN YOUR LANGUAGE</h3>
                <p>
                  Call happens in English. Notes arrive in Hindi. Review the deal in the language
                  you think in.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* 8. COMPARISON */}
        <section className="ts-section ts-section-pale">
          <div className="ts-container">
            <h2 className="ts-section-title ts-reveal">TALKSYNC vs THE REST</h2>
            <div className="ts-compare-wrap ts-reveal">
              <table className="ts-compare">
                <thead>
                  <tr>
                    <th></th>
                    <th>TALKSYNC</th>
                    <th>GOOGLE MEET</th>
                    <th>TEAMS PREMIUM</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Natural AI voice translation</td>
                    <td className="ts-us">✅</td>
                    <td>Limited</td>
                    <td>Captions only</td>
                  </tr>
                  <tr>
                    <td>Works on Zoom + Meet + Teams</td>
                    <td className="ts-us">✅</td>
                    <td>❌</td>
                    <td>❌</td>
                  </tr>
                  <tr>
                    <td>Translated captions</td>
                    <td className="ts-us">✅</td>
                    <td>✅</td>
                    <td>✅</td>
                  </tr>
                  <tr>
                    <td>Summary in YOUR language</td>
                    <td className="ts-us">✅</td>
                    <td>❌</td>
                    <td>❌</td>
                  </tr>
                  <tr>
                    <td>Founding price</td>
                    <td className="ts-us">₹299/mo forever*</td>
                    <td>$20/mo</td>
                    <td>$10/user/mo</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="ts-compare-note">*Founding seats only.</div>
          </div>
        </section>

        {/* 9. FOUNDER NOTE */}
        <section className="ts-section ts-section-ink">
          <div className="ts-container">
            <div className="ts-founder ts-reveal">
              <div className="ts-founder-photo" aria-hidden="true">👤</div>
              <div>
                <p>
                  "I'm building TalkSync because I've watched brilliant freelancers lose clients
                  to a language wall. Founding members talk to me directly — you shape what this
                  becomes."
                </p>
                <div className="ts-founder-sig">— [FOUNDER NAME], FOUNDER</div>
                <div className="ts-founder-links">
                  <a href="#" aria-label="WhatsApp the founder">WHATSAPP</a>
                  <a href="#" aria-label="Instagram">INSTAGRAM</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 10. FAQ */}
        <section className="ts-section ts-section-white">
          <div className="ts-container">
            <h2 className="ts-section-title ts-reveal">QUESTIONS, ANSWERED HONESTLY</h2>
            <div className="ts-faq ts-reveal">
              {FAQ_ITEMS.map((item, i) => (
                <FaqItem
                  key={i}
                  index={i}
                  q={item.q}
                  a={item.a}
                  open={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* 11. FINAL CTA */}
        <section className="ts-section ts-section-lime">
          <div className="ts-container" style={{ textAlign: "center" }}>
            <h2 className="ts-section-title ts-reveal" style={{ fontSize: "clamp(32px, 6vw, 56px)", lineHeight: "110%" }}>
              10 SEATS. THEN THE PRICE 10Xs.
            </h2>
            <div className="ts-reveal" style={{ marginTop: 28 }}>
              <button className="ts-btn" onClick={() => scrollToId("seats")}>
                CLAIM FOUNDING SEAT — ₹299/MO FOREVER
              </button>
            </div>
            <div className="ts-hero-trust ts-reveal" style={{ marginTop: 20 }}>
              90% off list price · Full refund if we don't launch · Free trial needs no card
            </div>
          </div>
        </section>
      </main>

      {/* 12. FOOTER */}
      <footer className="ts-footer">
        <div className="ts-footer-inner">
          <div className="ts-footer-logo">TALKSYNC AI</div>
          <nav className="ts-footer-links">
            <a href="#">TERMS</a>
            <a href="#">PRIVACY</a>
            <a href="#">REFUND POLICY</a>
          </nav>
          <div className="ts-footer-made">Made in India 🇮🇳</div>
        </div>
      </footer>
    </div>
  );
}

function FaqItem({
  index,
  q,
  a,
  open,
  onToggle,
}: {
  index: number;
  q: string;
  a: string;
  open: boolean;
  onToggle: () => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [maxH, setMaxH] = useState(0);

  useEffect(() => {
    if (!bodyRef.current) return;
    setMaxH(open ? bodyRef.current.scrollHeight : 0);
  }, [open, a]);

  const id = `faq-${index}`;
  return (
    <div className="ts-faq-item">
      <button
        className="ts-faq-btn"
        aria-expanded={open}
        aria-controls={id}
        onClick={onToggle}
      >
        <span>{q}</span>
        <span className="ts-faq-icon" aria-hidden="true">+</span>
      </button>
      <div
        id={id}
        className="ts-faq-body"
        role="region"
        style={{ maxHeight: maxH }}
      >
        <div ref={bodyRef} className="ts-faq-body-inner">
          {a}
        </div>
      </div>
    </div>
  );
}
