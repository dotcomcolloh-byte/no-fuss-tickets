import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";

// Paystack webhook. Signature = HMAC-SHA512(raw body, PAYSTACK_SECRET_KEY).
// Duplicates are dropped via webhook_events and the payment is RE-VERIFIED
// with Paystack's API before any ticket is issued.
const bodySchema = z.object({
  event: z.string(),
  data: z.object({ id: z.union([z.number(), z.string()]), reference: z.string().min(1).max(120) }).passthrough(),
});

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["PAYSTACK_SECRET_KEY"];
        if (!secret) return new Response("Webhook not configured", { status: 503 });
        const raw = await request.text();
        const sig = request.headers.get("x-paystack-signature") ?? "";
        const expected = createHmac("sha512", secret).update(raw).digest("hex");
        if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
          return new Response("Invalid signature", { status: 401 });
        }
        let json: unknown;
        try { json = JSON.parse(raw); } catch { return new Response("Bad request", { status: 400 }); }
        const parsed = bodySchema.safeParse(json);
        if (!parsed.success) return new Response("Bad request", { status: 400 });
        const body = parsed.data;
        if (body.event !== "charge.success") return new Response("ignored", { status: 200 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error: dup } = await supabaseAdmin
          .from("webhook_events")
          .insert({ provider: "paystack", event_id: `${body.event}:${body.data.id}` });
        if (dup) return new Response("duplicate", { status: 200 });

        const { data: payment } = await supabaseAdmin
          .from("payments")
          .select("id")
          .eq("provider", "paystack")
          .eq("provider_reference", body.data.reference)
          .maybeSingle();
        if (!payment) return new Response("unknown payment", { status: 200 });

        const { verifyAndFulfil } = await import("@/lib/payments/fulfil.server");
        const status = await verifyAndFulfil(payment.id);
        return Response.json({ ok: true, status });
      },
    },
  },
});
