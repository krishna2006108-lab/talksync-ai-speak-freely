import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SEAT_PRICE_PAISE = 29900; // ₹299 in paise
const CURRENCY = "INR";

const createOrderInput = z.object({
  n: z.number().int().min(1).max(10),
});

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => createOrderInput.parse(input))
  .handler(async ({ data }) => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error("Razorpay is not configured on the server");
    }

    // Verify seat is still available before creating an order
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: seat, error: seatErr } = await supabaseAdmin
      .from("founding_seats")
      .select("n, taken")
      .eq("n", data.n)
      .maybeSingle();
    if (seatErr) throw new Error(seatErr.message);
    if (!seat) throw new Error(`Seat ${data.n} does not exist`);
    if (seat.taken) throw new Error(`Seat ${data.n} is no longer available`);

    // Short, unique receipt (Razorpay limit: 40 chars)
    const receipt = `seat-${data.n}-${Date.now().toString(36)}`;

    const auth = btoa(`${keyId}:${keySecret}`);
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: SEAT_PRICE_PAISE,
        currency: CURRENCY,
        receipt,
        // notes are echoed back in the webhook payload — this is how the
        // webhook knows which seat this payment corresponds to.
        notes: { seat_n: String(data.n), product: "founding_seat" },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[razorpay] order create failed", res.status, text);
      throw new Error("Failed to create payment order");
    }

    const order = (await res.json()) as {
      id: string;
      amount: number;
      currency: string;
    };

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId, // publishable — safe to expose to browser for Checkout
      seatN: data.n,
    };
  });

const verifyPaymentInput = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

// Called from Checkout's success handler: verifies the payment signature and
// marks the seat taken immediately, so the page updates in real time without
// waiting for the webhook (which stays on as the reliable backup).
export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => verifyPaymentInput.parse(input))
  .handler(async ({ data }) => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error("Razorpay is not configured on the server");
    }

    // Signature = HMAC-SHA256(order_id|payment_id) with the key secret.
    const { createHmac, timingSafeEqual } = await import("crypto");
    const expected = createHmac("sha256", keySecret)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest("hex");
    const sigBuf = Buffer.from(data.razorpay_signature, "utf8");
    const expBuf = Buffer.from(expected, "utf8");
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      console.error("[razorpay] invalid payment signature", data.razorpay_order_id);
      throw new Error("Payment verification failed");
    }

    // Don't trust the client for the seat number — read it back from the
    // order's notes via the Razorpay API.
    const auth = btoa(`${keyId}:${keySecret}`);
    const res = await fetch(
      `https://api.razorpay.com/v1/orders/${encodeURIComponent(data.razorpay_order_id)}`,
      { headers: { Authorization: `Basic ${auth}` } },
    );
    if (!res.ok) {
      console.error("[razorpay] order fetch failed", res.status, await res.text());
      throw new Error("Payment verification failed");
    }
    const order = (await res.json()) as { notes?: Record<string, string> };
    const seatN = Number.parseInt(order.notes?.seat_n ?? "", 10);
    if (!Number.isInteger(seatN) || seatN < 1 || seatN > 10) {
      console.error("[razorpay] order has no valid seat_n note", order.notes);
      throw new Error("Payment verification failed");
    }

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    // Idempotent: the webhook may already have flipped it.
    const { error } = await supabaseAdmin
      .from("founding_seats")
      .update({ taken: true, taken_at: new Date().toISOString() })
      .eq("n", seatN)
      .eq("taken", false);
    if (error) {
      console.error("[razorpay] seat update failed", error);
      throw new Error("Could not record your seat — it will be confirmed shortly");
    }

    console.info(
      `[razorpay] seat ${seatN} claimed via payment ${data.razorpay_payment_id} (client verify)`,
    );
    return { seatN };
  });
