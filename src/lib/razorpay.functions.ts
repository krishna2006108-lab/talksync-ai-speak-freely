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
