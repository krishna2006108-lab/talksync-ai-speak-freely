import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const claimInput = z.object({
  n: z.number().int().min(1).max(10).optional(),
});

export const claimFoundingSeat = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => claimInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    // Pick next available seat if none specified
    let seatN = data.n;
    if (!seatN) {
      const { data: next, error: nextErr } = await supabaseAdmin
        .from("founding_seats")
        .select("n")
        .eq("taken", false)
        .order("n", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (nextErr) throw new Error(nextErr.message);
      if (!next) throw new Error("All founding seats are already taken");
      seatN = next.n;
    }

    // Atomic-ish claim: only update if still not taken
    const { data: claimed, error: updErr } = await supabaseAdmin
      .from("founding_seats")
      .update({ taken: true, taken_at: new Date().toISOString() })
      .eq("n", seatN)
      .eq("taken", false)
      .select("n")
      .maybeSingle();
    if (updErr) throw new Error(updErr.message);
    if (!claimed) throw new Error(`Seat ${seatN} is no longer available`);

    // Return fresh taken count
    const { count, error: cntErr } = await supabaseAdmin
      .from("founding_seats")
      .select("n", { count: "exact", head: true })
      .eq("taken", true);
    if (cntErr) throw new Error(cntErr.message);

    return {
      claimedSeat: claimed.n,
      takenCount: count ?? 0,
      remaining: 10 - (count ?? 0),
    };
  });
