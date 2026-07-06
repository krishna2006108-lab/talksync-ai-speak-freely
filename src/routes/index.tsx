import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { claimFoundingSeat } from "@/lib/seats.functions";
import "./index.css";

// ============ CONFIG ============
const PAYMENT_LINK = ""; // TODO: wire to Razorpay checkout

type Seat = {
  n: number;
  credits: number;
  mins: number;
  taken: boolean;
};

const seatsQueryOptions = queryOptions({
  queryKey: ["founding_seats"],
  queryFn: async (): Promise<Seat[]> => {
    const { data, error } = await supabase
      .from("founding_seats")
      .select("n, credits, mins, taken")
      .order("n", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Seat[];
  },
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(seatsQueryOptions),
  component: TalkSyncLanding,
  pendingMs: 100,
  pendingMinMs: 400,
  pendingComponent: TalkSyncSkeleton,
  errorComponent: ({ error }) => (
    <div style={{ padding: 24, fontFamily: "system-ui" }} role="alert">
      Couldn't load seat availability: {String(error?.message ?? "unknown")}
    </div>
  ),
});

function TalkSyncSkeleton() {
  return (
    <div className="ts-root ts-skeleton-root" aria-busy="true" aria-live="polite">
      <div className="ts-sticky">
        <span className="ts-sticky-text">
          <span className="ts-sk ts-sk-line" style={{ width: 220 }} />
        </span>
        <span className="ts-sk ts-sk-block" style={{ width: 72, height: 32 }} />
      </div>
      <section className="ts-section ts-section-lime">
        <div className="ts-container">
          <span className="ts-sk ts-sk-line" style={{ width: "80%", height: 40, marginBottom: 16 }} />
          <span className="ts-sk ts-sk-line" style={{ width: "60%", height: 40, marginBottom: 24 }} />
          <span className="ts-sk ts-sk-line" style={{ width: "90%", height: 18, marginBottom: 8 }} />
          <span className="ts-sk ts-sk-line" style={{ width: "70%", height: 18, marginBottom: 28 }} />
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 40 }}>
            <span className="ts-sk ts-sk-block" style={{ width: 260, height: 56 }} />
            <span className="ts-sk ts-sk-block" style={{ width: 200, height: 56 }} />
          </div>
          <div className="ts-grid ts-grid-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="ts-sk ts-sk-block" style={{ height: 220 }} />
            ))}
          </div>
        </div>
      </section>
      <section className="ts-section ts-section-white">
        <div className="ts-container">
          <span className="ts-sk ts-sk-line" style={{ width: 240, height: 32, marginBottom: 24 }} />
          <div className="ts-seat-grid">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="ts-sk ts-sk-block" style={{ height: 200 }} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    q: "Can I get this offer later?",
    a: "No. Each seat sells once. When Seat 10 goes, the founding offer is deleted from this page permanently and pricing becomes ₹2,999/mo for everyone. We're putting this in writing so there's no confusion.",
  },
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
  const { data: seats } = useSuspenseQuery(seatsQueryOptions);
  const queryClient = useQueryClient();

  const seatsAvailable = useMemo(() => seats.filter((s) => !s.taken).length, [seats]);
  const seatsTaken = seats.length - seatsAvailable;
  const nextSeat = useMemo(() => seats.find((s) => !s.taken) ?? null, [seats]);
  const nextAvailable = nextSeat?.n ?? null;

  // Realtime: any change to founding_seats invalidates the query
  useEffect(() => {
    const channel = supabase
      .channel("founding_seats_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "founding_seats" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["founding_seats"] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

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

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const claim = (n?: number) => {
    if (PAYMENT_LINK) {
      window.location.href = PAYMENT_LINK + (n ? `?seat=${n}` : "");
    } else {
      scrollToId("seats");
    }
  };

  const critical = seatsAvailable <= 3;
  const nextCredits = nextSeat?.credits ?? null;

  return (
    <div className="ts-root">
      {/* 0. STICKY TOP BAR */}
      <div
        className={`ts-sticky${critical ? " ts-sticky-critical" : ""}`}
        role="banner"
      >
        <span className="ts-sticky-text">
          {critical ? "🚨" : "⚡"} ONLY {seatsAvailable} OF 10 FOUNDING SEATS LEFT
          {nextCredits !== null && ` — NEXT SEAT LOCKS AT ${nextCredits} CREDITS/MO`}
        </span>
        <button className="ts-sticky-btn" onClick={() => scrollToId("seats")}>
          CLAIM
        </button>
      </div>

      <main>
        {/* 1. HERO — BLACK bg */}
        <section className="ts-section ts-section-lime ts-hero">
          <div className="ts-container">
            <h1>
              SPEAK HINDI. THEY HEAR <span className="ts-hl">ENGLISH.</span> LIVE.
            </h1>
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

            <div className="ts-hero-visual ts-reveal" aria-label="Voice translation flow demo">
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

              <div className="ts-pipeline" aria-hidden="true">
                <div className="ts-node">SPEECH → TEXT</div>
                <div className="ts-arrow">▶</div>
                <div className="ts-node">TRANSLATE</div>
                <div className="ts-arrow">▶</div>
                <div className="ts-node">AI VOICE</div>
              </div>

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

        {/* 2. PROBLEM MARQUEE — WHITE bg */}
        <section className="ts-marquee" aria-label="Common problems">
          <div className="ts-marquee-track">
            {Array.from({ length: 3 }).map((_, r) =>
              PROBLEM_ITEMS.map((t, i) => (
                <span key={`${r}-${i}`}>&nbsp;&nbsp;{t}&nbsp;&nbsp;•</span>
              ))
            )}
          </div>
        </section>

        {/* 3. WHY THIS EXISTS — BLACK bg */}
        <section className="ts-section ts-section-white">
          <div className="ts-container">
            <h2 className="ts-section-title ts-reveal">
              WHY THIS <span className="ts-hl">EXISTS</span>
            </h2>
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
                <p>Remove the wall — keep your skill, your voice, your confidence.</p>
              </article>
            </div>
          </div>
        </section>

        {/* 4. HOW IT WORKS — OFF-WHITE bg */}
        <section className="ts-section ts-section-ink">
          <div className="ts-container">
            <h2 className="ts-section-title ts-reveal" style={{ color: "var(--white)" }}>HOW IT WORKS</h2>
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

        {/* 5. DEMO — BLACK bg */}
        <section id="demo" className="ts-section ts-section-white">
          <div className="ts-container">
            <h2 className="ts-section-title ts-reveal">
              SEE IT IN <span className="ts-hl">60 SECONDS</span>
            </h2>
            <div
              id="demo-video"
              className="ts-demo-frame ts-reveal"
              role="img"
              aria-label="60 second demo video placeholder"
            >
              <div className="ts-demo-play" />
            </div>
            <div style={{ textAlign: "center" }}>
              <button className="ts-btn" onClick={() => scrollToId("seats")}>
                CLAIM FOUNDING SEAT — ₹299/MO FOREVER
              </button>
            </div>
          </div>
        </section>

        {/* 6. THE OFFER — OFF-WHITE bg (lime CTAs/badges pop) */}
        <section id="seats" className="ts-section ts-section-lime">
          <div className="ts-container">
            <span className="ts-section-eyebrow ts-reveal">THE OFFER</span>
            <h2 className="ts-section-title ts-reveal">
              FOUNDING 10 — EVERYONE PAYS <span className="ts-hl">₹299/MO. FOREVER.</span>
            </h2>
            <p className="ts-section-lead ts-reveal">
              That's 90% off the ₹2,999 list price — locked for life. Your seat number decides
              your monthly credits. Earlier seat = more credits, forever.
            </p>

            <div className="ts-seats-header-warn ts-reveal">
              EVERY SEAT SOLD = <strong>GONE FOREVER</strong>. We will never re-open a sold seat,
              never re-run this offer, never discount again.{" "}
              <strong>This page self-destructs after Seat 10.</strong>
            </div>

            {/* LOSS METER */}
            <div className="ts-lossmeter ts-reveal" aria-label="Seats claimed vs remaining">
              <div className="ts-lossmeter-bar">
                {seats.map((s) => (
                  <div
                    key={s.n}
                    className={`ts-lossmeter-cell ${s.taken ? "sold" : "free"}`}
                    aria-label={s.taken ? `Seat ${s.n} sold` : `Seat ${s.n} available`}
                  >
                    {s.taken ? "✕" : s.n}
                  </div>
                ))}
              </div>
              <div className="ts-lossmeter-caption">
                {seatsTaken} claimed · {seatsAvailable} remaining · 0 will return
              </div>
            </div>

            <div className="ts-seat-grid ts-reveal">
              {seats.map((s, idx) => {
                const isNext = s.n === nextAvailable;
                // Find NEXT future available after this one for the "if you wait" line
                const nextFuture = seats
                  .slice(idx + 1)
                  .find((x) => !x.taken);
                const diff = nextFuture ? s.credits - nextFuture.credits : 0;

                if (s.taken) {
                  return (
                    <div
                      key={s.n}
                      className="ts-seat ts-seat-taken"
                      aria-label={`Seat ${s.n} gone forever`}
                    >
                      <div className="ts-seat-num">SEAT</div>
                      <div className="ts-seat-badge-num">{s.n}</div>
                      <div className="ts-seat-credits">{s.credits} CREDITS/MO</div>
                      <div className="ts-seat-mins">(~{s.mins} min of live translation)</div>
                      <div className="ts-seat-lifetime">🔒 LIFETIME LOCK</div>
                      <div className="ts-seat-stamp" aria-hidden="true">
                        GONE FOREVER
                      </div>
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
                    <div className="ts-seat-num">SEAT</div>
                    <div className="ts-seat-badge-num">{s.n}</div>
                    <div className="ts-seat-credits">{s.credits} CREDITS/MO</div>
                    <div className="ts-seat-mins">(~{s.mins} min of live translation)</div>
                    <div className="ts-seat-lifetime">🔒 LIFETIME LOCK</div>
                    <button className="ts-seat-btn" onClick={() => claim(s.n)}>
                      CLAIM SEAT {s.n} — ₹299
                    </button>
                    {nextFuture && diff > 0 && (
                      <div className="ts-seat-wait">
                        IF YOU WAIT: next seat = {nextFuture.credits} credits
                        <br />
                        (−{diff} every month, forever)
                      </div>
                    )}
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

        {/* 6b. WHAT FOUNDING MEMBERS KEEP FOREVER — BLACK bg */}
        <section className="ts-section ts-section-white">
          <div className="ts-container">
            <span className="ts-section-eyebrow ts-reveal">THE FOREVER DEAL</span>
            <h2 className="ts-section-title ts-reveal">
              WHAT FOUNDING MEMBERS <span className="ts-hl">KEEP FOREVER</span>
            </h2>
            <div className="ts-keep-table-wrap ts-reveal" style={{ marginTop: 24 }}>
              <table className="ts-keep-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>FOUNDING MEMBER (YOU)</th>
                    <th>EVERYONE ELSE (AFTER SEAT 10)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Price</td>
                    <td className="ts-keep-you">₹299/mo locked for life</td>
                    <td className="ts-keep-them">₹2,999/mo</td>
                  </tr>
                  <tr>
                    <td>Savings</td>
                    <td className="ts-keep-you">90% off — permanent</td>
                    <td className="ts-keep-them">0% — forever</td>
                  </tr>
                  <tr>
                    <td>Your seat's credits</td>
                    <td className="ts-keep-you">Locked to you for life</td>
                    <td className="ts-keep-them">Standard allocation</td>
                  </tr>
                  <tr>
                    <td>This offer again?</td>
                    <td className="ts-keep-you">Yours forever</td>
                    <td className="ts-keep-them">Never. Sold seats never re-open.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="ts-keep-cta ts-reveal">
              Founding = you pay <strong>~₹32,400 LESS</strong> every single year. For life.
              That's the deal.
            </div>
          </div>
        </section>

        {/* 7. FEATURES — BLACK bg */}
        <section className="ts-section ts-section-white">
          <div className="ts-container">
            <h2 className="ts-section-title ts-reveal">
              WHAT'S <span className="ts-hl">IN THE BOX</span>
            </h2>
            <div className="ts-grid ts-grid-3 ts-reveal">
              <article className="ts-card">
                <span className="ts-badge-onlyus">ONLY US</span>
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

        {/* 8. COMPARISON — WHITE bg */}
        <section className="ts-section ts-section-pale">
          <div className="ts-container">
            <h2 className="ts-section-title ts-reveal">TALKSYNC vs THE REST</h2>
            <div className="ts-compare-wrap ts-reveal">
              <table className="ts-compare">
                <thead>
                  <tr>
                    <th></th>
                    <th className="us-col">TALKSYNC</th>
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

        {/* 9. FOUNDER NOTE — BLACK bg */}
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

        {/* 10. FAQ — OFF-WHITE bg */}
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

        {/* 11. FINAL CTA — FULL LIME (the only one) */}
        <section className="ts-section ts-section-lime">
          <div className="ts-container" style={{ textAlign: "center" }}>
            <h2
              className="ts-section-title ts-reveal"
              style={{ fontSize: "clamp(32px, 6vw, 56px)", lineHeight: "110%" }}
            >
              10 SEATS. SOLD ONCE. NEVER AGAIN.
            </h2>
            <p className="ts-section-lead ts-reveal" style={{ margin: "16px auto 0", maxWidth: 640 }}>
              ₹299/mo forever vs ₹2,999/mo forever — you're one click from the right side of that
              line.
            </p>
            <div className="ts-reveal" style={{ marginTop: 28 }}>
              <button
                className="ts-btn"
                style={{ background: "var(--ink)", color: "var(--lime)" }}
                onClick={() => scrollToId("seats")}
              >
                CLAIM FOUNDING SEAT — ₹299/MO FOREVER
              </button>
            </div>
            <div
              className="ts-reveal"
              style={{
                marginTop: 20,
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
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
      <div id={id} className="ts-faq-body" role="region" style={{ maxHeight: maxH }}>
        <div ref={bodyRef} className="ts-faq-body-inner">
          {a}
        </div>
      </div>
    </div>
  );
}
