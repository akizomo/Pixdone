import Stripe from "stripe";

// PixDone+ サブスクリプションの Checkout セッションを作成する
export async function createPlusCheckoutSession({
  stripeSecretKey,
  priceId,
  userId,
  successUrl,
  cancelUrl,
}: {
  stripeSecretKey: string;
  priceId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ checkoutUrl: string }> {
  const stripe = new Stripe(stripeSecretKey);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl,
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 7,
      metadata: { userId },
    },
    metadata: { userId },
  });

  if (!session.url) throw new Error("Stripe checkout session response missing url");
  return { checkoutUrl: session.url };
}

// サブスクリプションを期間末にキャンセルする
export async function cancelPlusSubscription({
  stripeSecretKey,
  stripeSubscriptionId,
}: {
  stripeSecretKey: string;
  stripeSubscriptionId: string;
}): Promise<{ cancelAt: string }> {
  const stripe = new Stripe(stripeSecretKey);
  const subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true,
  });
  // current_period_end lives on the first subscription item in Stripe API v20+
  const periodEnd = subscription.items.data[0]?.current_period_end;
  const cancelAt = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;
  return { cancelAt: cancelAt ?? '' };
}

// Webhook の署名を検証してイベントを返す
export function verifyStripeWebhook({
  rawBody,
  signatureHeader,
  webhookSecret,
}: {
  rawBody: Buffer;
  signatureHeader: string | undefined;
  webhookSecret: string;
}): Stripe.Event {
  if (!signatureHeader) throw new Error("Missing Stripe signature header");
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) throw new Error("Missing STRIPE_SECRET_KEY env variable");
  const stripe = new Stripe(stripeSecretKey);
  return stripe.webhooks.constructEvent(rawBody, signatureHeader, webhookSecret);
}
