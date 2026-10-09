import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";

// Provider callback endpoint. Signature is verified with PAYMENT_WEBHOOK_SECRET,
// duplicates are dropped via webhook_events, and the payment is RE-VERIFIED with
// the provider before any ticket is issued.
const bodySchema = z.object({
  event_id: z.string().min(1).max(120),
  provider: z.string().min(1).max(40),
  provider_reference: z.string().min(1).max(120),
});

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["PAYMENT_WEBHOOK_SECRET"];
        if (!secret) return new Response("Webhook not configured", { status: 503 });
        const raw = await request.text();
        const sig = request.headers.get("x-signature") ?? "";
        const expected = createHmac("sha256", secret).update(raw).digest("hex");
        if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
          return new Response("Invalid signature", { status: 401 });
        }
        const parsed = bodySchema.safeParse(JSON.parse(raw));
        if (!parsed.success) return new Response("Bad request", { status: 400 });
        const body = parsed.data;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error: dup } = await supabaseAdmin
          .from("webhook_events")
          .insert({ provider: body.provider, event_id: body.event_id });
        if (dup) return new Response("duplicate", { status: 200 });

        const { data: payment } = await supabaseAdmin
          .from("payments")
          .select("id")
          .eq("provider", body.provider)
          .eq("provider_reference", body.provider_reference)
          .maybeSingle();
        if (!payment) return new Response("unknown payment", { status: 404 });

        const { verifyAndFulfil } = await import("@/lib/payments/fulfil.server");
        const status = await verifyAndFulfil(payment.id);
        return Response.json({ ok: true, status });
      },
    },
  },
});
