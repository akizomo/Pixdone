import Stripe from "stripe";

export type StripeCheckoutSessionCompletedEvent = {
  type: "checkout.session.completed";
  data: {
    object: {
      metadata?: Record<string, string | undefined>;
      // Keep type loose to avoid depending on stripe SDK.
    };
  };
};

export async function createCheckoutSession({
  stripeSecretKey,
  priceId,
  userId,
  successUrl,
  cancelUrl,
  themeKey,
}: {
  stripeSecretKey: string;
  priceId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
  themeKey: "synthwave";
}): Promise<{ checkoutUrl: string }> {
  const stripe = new Stripe(stripeSecretKey);

  // Attach internal user + theme key for webhook entitlement update.
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      userId,
      themeKey,
    },
  });

  if (!session.url) throw new Error("Stripe checkout session response missing url");
  return { checkoutUrl: session.url };
}

export function verifyStripeWebhook({
  rawBody,
  signatureHeader,
  webhookSecret,
}: {
  rawBody: Buffer;
  signatureHeader: string | undefined;
  webhookSecret: string;
}): StripeCheckoutSessionCompletedEvent | any {
  if (!signatureHeader) throw new Error("Missing Stripe signature header");
  // constructEvent は署名検証/パースのみを行うため、API呼び出しを行わない。
  // そのため STRIPE_SECRET_KEY 未設定でも失敗しないようにダミーを許容する。
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? "sk_test_dummy";
  const stripe = new Stripe(stripeSecretKey);
  // constructEvent は署名検証 + payload parsing を行い、失敗時は例外を投げます。
  return stripe.webhooks.constructEvent(rawBody, signatureHeader, webhookSecret);
}

