import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const FEE_RATE = 0; // booking fee as fraction of subtotal

const orderSchema = z.object({
  eventId: z.string().uuid(),
  items: z
    .array(z.object({ ticketTypeId: z.string().uuid(), quantity: z.number().int().min(1).max(20) }))
    .min(1)
    .max(10),
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ]{9,15}$/, "Invalid phone number"),
  nationalId: z.string().trim().max(30).optional().or(z.literal("")),
  method: z.enum(["mpesa", "card", "mobile_money"]),
  idempotencyKey: z.string().min(8).max(80),
});

/** Creates customer + pending order + pending payment, then initiates the payment server-side. */
export const createOrderAndPay = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => orderSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getProvider } = await import("./payments/providers.server");

    // Duplicate-submit protection
    const { data: existing } = await supabaseAdmin
      .from("orders")
      .select("access_token")
      .eq("idempotency_key", data.idempotencyKey)
      .maybeSingle();
    if (existing) return { orderToken: existing.access_token };

    const { data: event } = await supabaseAdmin
      .from("events")
      .select("id, status, require_id")
      .eq("id", data.eventId)
      .single();
    if (!event || event.status !== "published") throw new Error("This event is not on sale.");
    if (event.require_id && !data.nationalId) throw new Error("National ID / Passport is required for this event.");

    const ids = data.items.map((i) => i.ticketTypeId);
    const { data: types } = await supabaseAdmin
      .from("ticket_types")
      .select("id, event_id, price, quantity, sold, name, sales_start, sales_end")
      .in("id", ids);
    const now = Date.now();
    let subtotal = 0;
    const lines = data.items.map((i) => {
      const t = types?.find((x) => x.id === i.ticketTypeId);
      if (!t || t.event_id !== data.eventId) throw new Error("Invalid ticket type");
      if (t.sales_start && new Date(t.sales_start).getTime() > now) throw new Error(`${t.name} sales have not started`);
      if (t.sales_end && new Date(t.sales_end).getTime() < now) throw new Error(`${t.name} sales have ended`);
      if (t.sold + i.quantity > t.quantity) throw new Error(`Only ${t.quantity - t.sold} ${t.name} tickets left`);
      subtotal += Number(t.price) * i.quantity;
      return { ticket_type_id: t.id, quantity: i.quantity, unit_price: Number(t.price) };
    });
    const fees = Math.round(subtotal * FEE_RATE);
    const total = subtotal + fees;

    const { data: customer, error: ce } = await supabaseAdmin
      .from("customers")
      .insert({
        full_name: data.fullName,
        email: data.email.toLowerCase(),
        phone: data.phone,
        national_id: data.nationalId || null,
      })
      .select("id")
      .single();
    if (ce) throw new Error("Could not save customer");

    const { data: order, error: oe } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_id: customer.id,
        event_id: data.eventId,
        subtotal,
        fees,
        total,
        idempotency_key: data.idempotencyKey,
        status: "pending",
      })
      .select("id, access_token")
      .single();
    if (oe) throw new Error("Could not create order");
    await supabaseAdmin.from("order_items").insert(lines.map((l) => ({ ...l, order_id: order.id })));

    const provider = getProvider(data.method);
    const { data: payment, error: pe } = await supabaseAdmin
      .from("payments")
      .insert({ order_id: order.id, provider: provider.id, method: data.method, amount: total, status: "pending" })
      .select("id, transaction_ref")
      .single();
    if (pe) throw new Error("Could not create payment");

    const init = await provider.initiate({
      paymentId: payment.id,
      amount: total,
      currency: "KES",
      phone: data.phone,
      email: data.email,
      reference: payment.transaction_ref,
    });
    await supabaseAdmin
      .from("payments")
      .update({
        status: "processing",
        provider_reference: init.providerReference,
        provider_payload: init.payload as never,
      })
      .eq("id", payment.id);
    await supabaseAdmin.from("orders").update({ status: "processing" }).eq("id", order.id);

    return { orderToken: order.access_token };
  });

const tokenSchema = z.object({ token: z.string().regex(/^[a-f0-9]{48}$/) });

/** Order status — read from the database (and re-verified with the provider). */
export const getOrderStatus = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => tokenSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { verifyAndFulfil } = await import("./payments/fulfil.server");
    const load = () =>
      supabaseAdmin
        .from("orders")
        .select(
          "id, order_ref, status, subtotal, fees, total, currency, created_at, paid_at, customers(full_name, email), events(id, name, event_type, event_date, start_time, venue, location, cover_image_url), order_items(quantity, unit_price, ticket_types(name)), payments(id, transaction_ref, method, provider, status, verification_status, amount), tickets(token, ticket_code, status, ticket_types(name))",
        )
        .eq("access_token", data.token)
        .maybeSingle();
    let { data: order } = await load();
    if (!order) throw new Error("Order not found");
    const pay = (order.payments as { id: string; status: string }[])[0];
    if (pay && pay.status === "processing") {
      const s = await verifyAndFulfil(pay.id);
      if (s !== "processing") order = (await load()).data!;
    }
    const { id: _id, ...rest } = order;
    return { ...rest, sandbox: (order.payments as { provider: string }[])[0]?.provider === "sandbox" };
  });

/**
 * SANDBOX ONLY: simulates the provider's own system approving/declining.
 * Writes provider-side state, then runs the same verify → fulfil path a real
 * webhook would. Disabled when PAYMENT_SANDBOX=false.
 */
export const sandboxProviderAction = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ token: z.string().regex(/^[a-f0-9]{48}$/), outcome: z.enum(["approved", "declined"]) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { sandboxEnabled } = await import("./payments/providers.server");
    if (!sandboxEnabled()) throw new Error("Sandbox disabled");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { verifyAndFulfil } = await import("./payments/fulfil.server");
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, payments(id, provider, status)")
      .eq("access_token", data.token)
      .single();
    const pay = (order?.payments as { id: string; provider: string; status: string }[] | undefined)?.[0];
    if (!pay || pay.provider !== "sandbox") throw new Error("Not a sandbox payment");
    if (pay.status !== "processing") return { status: pay.status };
    await supabaseAdmin
      .from("payments")
      .update({ provider_payload: { sandbox_status: data.outcome, at: new Date().toISOString() } })
      .eq("id", pay.id);
    const status = await verifyAndFulfil(pay.id);
    return { status };
  });

/** Public ticket view by secure token — no payment details. */
export const getTicket = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => tokenSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: t } = await supabaseAdmin
      .from("tickets")
      .select(
        "token, ticket_code, status, used_at, ticket_types(name), customers(full_name, email), events(name, event_type, event_date, start_time, venue, location, cover_image_url)",
      )
      .eq("token", data.token)
      .maybeSingle();
    if (!t) throw new Error("Ticket not found");
    return t;
  });

/** Ticket lookup: ticket ID + purchase email must both match. */
export const lookupTicket = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        code: z.string().trim().toUpperCase().regex(/^TK-[A-F0-9]{10}$/, "Ticket ID looks like TK-XXXXXXXXXX"),
        email: z.string().trim().email().max(255),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: t } = await supabaseAdmin
      .from("tickets")
      .select("token, customers(email)")
      .eq("ticket_code", data.code)
      .maybeSingle();
    const em = (t?.customers as { email: string } | null)?.email;
    if (!t || em?.toLowerCase() !== data.email.toLowerCase()) return { token: null };
    return { token: t.token };
  });
