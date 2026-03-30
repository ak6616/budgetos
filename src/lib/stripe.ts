import Stripe from "stripe";

export const stripe = typeof process.env.STRIPE_SECRET_KEY === "string"
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-03-25.dahlia",
    })
  : (null as unknown as Stripe);
