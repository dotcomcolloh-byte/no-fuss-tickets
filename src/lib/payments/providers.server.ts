// Payment provider abstraction. Server-only.
// Each provider initiates a payment and independently VERIFIES its outcome.
// Fulfilment never trusts the browser — it only trusts verify().

export type ProviderVerifyResult = {
  status: "paid" | "failed" | "pending";
  providerReference?: string | undefined;
};

export type InitiateArgs = {
  paymentId: string;
  amount: number;
  currency: string;
  phone: string;
  email: string;
  reference: string;
  method: string;
  callbackUrl: string;
};

export type InitiateResult = {
  providerReference: string;
  payload: Record<string, unknown>;
  redirectUrl?: string | undefined;
};

export interface PaymentProvider {
  id: string;
  initiate(args: InitiateArgs): Promise<InitiateResult>;
  verify(payment: { provider_reference: string | null; provider_payload: unknown; amount: number; currency: string }): Promise<ProviderVerifyResult>;
}

/** Sandbox is OFF unless PAYMENT_SANDBOX is explicitly "true". Never enable it in production. */
export function sandboxEnabled() {
  return process.env["PAYMENT_SANDBOX"] === "true";
}

const sandboxProvider: PaymentProvider = {
  id: "sandbox",
  async initiate({ paymentId }) {
    return { providerReference: `SBX-${paymentId.slice(0, 8).toUpperCase()}`, payload: { sandbox_status: "pending" } };
  },
  async verify(payment) {
    const p = (payment.provider_payload ?? {}) as { sandbox_status?: string };
    if (p.sandbox_status === "approved") return { status: "paid", providerReference: payment.provider_reference ?? undefined };
    if (p.sandbox_status === "declined") return { status: "failed" };
    return { status: "pending" };
  },
};

function paystackKey() {
  const k = process.env["PAYSTACK_SECRET_KEY"];
  if (!k) throw new Error("Payments are not configured yet. Please try again later.");
  return k;
}

const paystackProvider: PaymentProvider = {
  id: "paystack",
  async initiate({ amount, currency, email, reference, method, callbackUrl, phone }) {
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${paystackKey()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100), // subunit (cents)
        currency,
        reference,
        callback_url: callbackUrl,
        channels: method === "card" ? ["card"] : ["mobile_money"],
        metadata: { phone },
      }),
    });
    const json = (await res.json()) as { status: boolean; message: string; data?: { authorization_url: string; reference: string } };
    if (!res.ok || !json.status || !json.data) {
      console.error("Paystack initialize failed", json.message);
      throw new Error("Could not start payment. Please try again.");
    }
    return { providerReference: json.data.reference, payload: {}, redirectUrl: json.data.authorization_url };
  },
  async verify(payment) {
    if (!payment.provider_reference) return { status: "pending" };
    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(payment.provider_reference)}`, {
      headers: { Authorization: `Bearer ${paystackKey()}` },
    });
    const json = (await res.json()) as { status: boolean; data?: { status: string; amount: number; currency: string; reference: string } };
    const d = json.data;
    if (!res.ok || !json.status || !d) return { status: "pending" };
    if (d.status === "success") {
      // Amount + currency must match what we charged
      if (d.amount !== Math.round(Number(payment.amount) * 100) || d.currency !== payment.currency) {
        console.error("Paystack amount mismatch", d.reference);
        return { status: "failed" };
      }
      return { status: "paid", providerReference: d.reference };
    }
    if (d.status === "failed" || d.status === "abandoned" || d.status === "reversed") return { status: "failed" };
    return { status: "pending" };
  },
};

export function getProvider(_method: string): PaymentProvider {
  if (sandboxEnabled()) return sandboxProvider;
  return paystackProvider;
}

export function getProviderById(id: string): PaymentProvider {
  if (id === "paystack") return paystackProvider;
  if (id === "sandbox") {
    if (!sandboxEnabled()) throw new Error("Sandbox payments are disabled");
    return sandboxProvider;
  }
  throw new Error(`Unknown provider ${id}`);
}
