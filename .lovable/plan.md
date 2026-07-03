# TalkSync AI — Neo-Brutalist Landing Page

Build the full landing page as the app's home route (`src/routes/index.tsx`), matching your spec exactly. No frameworks beyond the existing React/TanStack shell; all styling as scoped CSS to keep the neo-brutalist system pure (no Tailwind conflicts).

## Files

- `src/routes/index.tsx` — full page, all 13 sections, JS-driven seat rendering, IntersectionObserver reveals, accordion state, sticky bar count.
- `src/routes/index.css` — all neo-brutalist styles (borders, hard shadows, marquee, waveform keyframes, accordion, reduced-motion).
- `src/routes/__root.tsx` — update `head()`: title "TalkSync AI — Speak Hindi. They Hear English. Live.", matching description, og/twitter tags. Add IBM Plex Sans via `<link>` in root head (weights 400, 500, 600).

## Design system (locked)

- Palette: `#E7FF2C` `#C7E100` `#FAFFD5` `#090A0A` `#404446` `#FFFFFF` + `#7A9900` `#990000` `#005099`.
- Borders 3–4px solid `#090A0A`, hard shadow `6px 6px 0 #090A0A` (no blur), radius 0–4px, zero gradients.
- Type: IBM Plex Sans. H1 40/120% (32px ≤480px), H2 32/125%, H3 24/135%, body 16–18/150%. Headers weight 500.
- Buttons: black bg / lime text, uppercase, 0.5px tracking, ≥48px tap target, hover = `translate(2px,2px)` + shadow shrink to `3px 3px 0`.
- Sections alternate lime ↔ black.
- Mobile-first at 380px; enhance ≥768px. No horizontal scroll except intentional marquee + comparison table.

## Page sections (exact order & copy from brief)

0. Sticky top bar — seat count from JS `SEATS` config, CLAIM → `#seats`.
1. Hero — H1, sub, primary + ghost CTA, micro-trust line, dual "video call" frames (CSS-only): YOU frame with animated waveform + Hindi bubble, pipeline with 3 pulsing nodes (SPEECH→TEXT / TRANSLATE / AI VOICE), CLIENT frame with typing text + waveform. 6s loop.
2. Problem ticker — black bg, CSS infinite marquee, pause on hover.
3. "Why this exists" — 3 brutalist cards.
4. How it works — 3 numbered cards + platform badges.
5. `#demo` — 16:9 bordered placeholder `<div id="demo-video">`, repeat primary CTA.
6. `#seats` — THE OFFER. Lime bg. 10 seat cards rendered from `SEATS` array (n, credits, mins, taken). Taken = grey `#404446` + ✕ stamp. First available = thicker border, `rotate(-1deg)`, "← NEXT AVAILABLE" badge. Each card shows SEAT n / credits/mo / (~mins min). Urgency line, closing line, fine print row. `PAYMENT_LINK` const (empty, ready for Razorpay).
7. Features — 3 cards, "MEETING SUMMARY IN YOUR LANGUAGE" gets "ONLY US" badge.
8. Comparison table — horizontal scroll on mobile, sticky first column via `position: sticky; left: 0`, footnote.
9. Founder note — black bg, circular photo placeholder, quote, WhatsApp/Instagram placeholder links.
10. FAQ — accordion, 6 items, `aria-expanded` / `aria-controls`, animated height.
11. Final CTA — lime bg, huge H2 "10 SEATS. THEN THE PRICE 10Xs.", CTA, trust line.
12. Footer — TALKSYNC AI, Terms/Privacy/Refund placeholders, "Made in India 🇮🇳".

## JS behavior

- `SEATS` config array (values from brief) drives: sticky bar count (`taken=false` count), seat grid render, "NEXT AVAILABLE" highlight on first non-taken.
- `PAYMENT_LINK` const (empty) → all CLAIM buttons.
- IntersectionObserver: `.reveal` → translateY(12px)+opacity fade-in on enter.
- Smooth-scroll for in-page anchors (`#seats`, `#demo`).
- Accordion: single-open state, animate `max-height`.
- `@media (prefers-reduced-motion: reduce)` disables marquee, waveform, pulse, reveal, hover translate.

## Urgency (real, per brief)

Only the seat ladder + taken states. No fake countdown, no fake purchase popups.

## Accessibility & perf

- `<html lang="en">` already set. Semantic landmarks (`header/main/section/footer`), alt text on placeholders (`role="img" aria-label`), accordion `aria-expanded`/`aria-controls`, focus-visible outlines in lime.
- Only external request: Google Fonts (IBM Plex Sans) via `<link rel="preconnect">` + stylesheet in root head.
- No images (pure CSS visuals), so LCP is text — targets Lighthouse mobile 90+.

## Out of scope (this pass)

- Real Razorpay wiring (leave `PAYMENT_LINK` empty).
- Real demo video (placeholder div).
- Backend for seat state (config is client-side; you edit `taken:true` per sale).
