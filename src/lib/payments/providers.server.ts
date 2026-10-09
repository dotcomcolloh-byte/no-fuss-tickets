// Payment provider abstraction. Server-only.
// Each provider can initiate a payment and independently VERIFY its outcome.
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
};

export type InitiateResult = {
  providerReference: string;
  payload: Record<string, unknown>;
  /** Where the customer should go next (provider hosted page / waiting screen) */
  nextAction: "await_stk" | "sandbox_page" | "redirect";
  redirectUrl?: string;
};

export interface PaymentProvider {
  id: string;
  initiate(args: InitiateArgs): Promise<InitiateResult>;
  verify(payment: {
    provider_reference: string | null;
    provider_payload: unknown;
  }): Promise<ProviderVerifyResult>;
}

/** Sandbox mode is ON unless PAYMENT_SANDBOX is explicitly "false". Disable it in production. */
export function sandboxEnabled() {
  return process.env["PAYMENT_SANDBOX"] !== "false";
}

const sandboxProvider: PaymentProvider = {
  id: "sandbox",
  async initiate({ paymentId }) {
    return {
      providerReference: `SBX-${paymentId.slice(0, 8).toUpperCase()}`,
      payload: { sandbox_status: "pending" },
      nextAction: "sandbox_page",
    };
  },
  // The sandbox "provider" keeps its own state in provider_payload, which only
  // server code can write (via the sandbox simulator endpoint).
  async verify(payment) {
    const p = (payment.provider_payload ?? {}) as { sandbox_status?: string };
    if (p.sandbox_status === "approved")
      return { status: "paid", providerReference: payment.provider_reference ?? undefined };
    if (p.sandbox_status === "declined") return { status: "failed" };
    return { status: "pending" };
  },
};

// Real providers plug in here (e.g. M-Pesa Daraja STK push, card processor).
// They read credentials from process.env inside the handler and are only
// selected when configured.
function mpesaConfigured() {
  return Boolean(process.env["MPESA_CONSUMER_KEY"] && process.env["MPESA_CONSUMER_SECRET"]);
}

export function getProvider(method: string): PaymentProvider {
  if (method === "mpesa" && mpesaConfigured()) {
    throw new Error("M-Pesa live provider not yet implemented");
  }
  if (sandboxEnabled()) return sandboxProvider;
  throw new Error("No payment provider configured for this method");
}

export function getProviderById(id: string): PaymentProvider {
  if (id === "sandbox") {
    if (!sandboxEnabled()) throw new Error("Sandbox payments are disabled");
    return sandboxProvider;
  }
  throw new Error(`Unknown provider ${id}`);
}
