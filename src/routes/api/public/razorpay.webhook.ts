import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

// Razorpay webhook: POST /api/public/razorpay/webhook
// Docs: https://razorpay.com/docs/webhooks/
//
// Verify signature: HMAC-SHA256 over the RAW request body using the
// webhook secret, compared timing-safely against `x-razorpay-signature`.
// Only after verification do we act on the payload.

export const Route = createFileRoute("/api/public/razorpay/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) {
          console.error("[razorpay webhook] RAZORPAY_WEBHOOK_SECRET missing");
          return new Response("Server misconfigured", { status: 500 });
        }

        const signature = request.headers.get("x-razorpay-signature") ?? "";
        const raw = await request.text();

        const expected = createHmac("sha256", secret).update(raw).digest("hex");
        const sigBuf = Buffer.from(signature, "utf8");
        const expBuf = Buffer.from(expected, "utf8");
        if (
          sigBuf.length !== expBuf.length ||
          !timingSafeEqual(sigBuf, expBuf)
        ) {
          console.warn("[razorpay webhook] invalid signature");
          return new Response("Invalid signature", { status: 401 });
        }

        let event: {
          event?: string;
          payload?: {
            payment?: {
              entity?: {
                id?: string;
                order_id?: string;
                status?: string;
                notes?: Record<string, string>;
              };
            };
            order?: {
              entity?: { id?: string; notes?: Record<string, string> };
            };
          };
        };
        try {
          event = JSON.parse(raw);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        // Only act on successful captures. Ignore other events (authorized,
        // failed, refunded, etc.) — but ack 200 so Razorpay stops retrying.
        if (event.event !== "payment.captured") {
          return new Response("ignored", { status: 200 });
        }

        const payment = event.payload?.payment?.entity;
        const notes =
          payment?.notes ?? event.payload?.order?.entity?.notes ?? {};
        const seatNRaw = notes.seat_n;
        const seatN = seatNRaw ? Number.parseInt(seatNRaw, 10) : NaN;
        if (!Number.isInteger(seatN) || seatN < 1 || seatN > 10) {
          console.warn("[razorpay webhook] missing/invalid seat_n note", notes);
          return new Response("ok", { status: 200 });
        }

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        // Idempotent: only flip if still not taken. Repeated webhook
        // deliveries for the same payment become no-ops.
        const { data: claimed, error } = await supabaseAdmin
          .from("founding_seats")
          .update({ taken: true, taken_at: new Date().toISOString() })
          .eq("n", seatN)
          .eq("taken", false)
          .select("n")
          .maybeSingle();

        if (error) {
          console.error("[razorpay webhook] update failed", error);
          return new Response("Update failed", { status: 500 });
        }

        if (!claimed) {
          console.info(
            `[razorpay webhook] seat ${seatN} was already taken (payment ${payment?.id})`,
          );
        } else {
          console.info(
            `[razorpay webhook] seat ${seatN} claimed via payment ${payment?.id}`,
          );
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
