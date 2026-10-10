import { getProviderById } from "./providers.server";

/**
 * Called after any provider callback/webhook or status poll.
 * Re-verifies with the provider, then atomically fulfils (idempotent in SQL).
 */
export async function verifyAndFulfil(paymentId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: payment, error } = await supabaseAdmin
    .from("payments")
    .select("id, order_id, provider, provider_reference, provider_payload, status, amount, currency")
    .eq("id", paymentId)
    .single();
  if (error || !payment) throw new Error("Payment not found");
  if (payment.status === "paid" || payment.status === "failed") return payment.status;

  const provider = getProviderById(payment.provider);
  const result = await provider.verify(payment);

  if (result.status === "pending") return "processing";

  if (result.status === "failed") {
    await supabaseAdmin
      .from("payments")
      .update({ status: "failed", verification_status: "verified_failed", updated_at: new Date().toISOString() })
      .eq("id", paymentId);
    await supabaseAdmin.from("orders").update({ status: "failed" }).eq("id", payment.order_id);
    return "failed";
  }

  const { data: fr, error: fe } = await supabaseAdmin.rpc("fulfill_order", {
    _payment_id: paymentId,
    _provider_reference: result.providerReference ?? payment.provider_reference ?? "",
  });
  if (fe) {
    if (fe.message.includes("SOLD_OUT")) {
      await supabaseAdmin
        .from("payments")
        .update({ status: "failed", verification_status: "sold_out_refund_required" })
        .eq("id", paymentId);
      await supabaseAdmin.from("orders").update({ status: "failed" }).eq("id", payment.order_id);
      return "failed";
    }
    throw fe;
  }
  const status = (fr as { status: string }).status;
  if (status === "paid") await sendTicketEmail(payment.order_id);
  return "paid";
}

async function sendTicketEmail(orderId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, customers(email), events(name)")
    .eq("id", orderId)
    .single();
  if (!order) return;
  const o = order as unknown as { customers: { email: string }; events: { name: string } };
  const subject = `Your Tumdo Kalenjin Connect Ticket — ${o.events.name}`;
  // Email delivery requires a verified sender domain. Until one is set up we
  // record the attempt so organisers can see it; the ticket is always
  // available via the secure link on the success page.
  await supabaseAdmin.from("email_logs").insert({
    order_id: orderId,
    to_email: o.customers.email,
    subject,
    status: "pending_domain_setup",
  });
}
