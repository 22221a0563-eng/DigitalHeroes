import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { plan } = body; // "monthly" or "yearly"

    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isYearly = plan === "yearly";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Digital Heroes Pro (${isYearly ? "Yearly" : "Monthly"})`,
              description: "Access to the monthly draw and impact ledger.",
            },
            unit_amount: isYearly ? 25000 : 2500,
            recurring: {
              interval: isYearly ? "year" : "month",
            },
          },
          quantity: 1,
        },
      ],

      success_url: `${
        process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"
      }/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,

      cancel_url: `${
        process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"
      }/dashboard?canceled=true`,

      metadata: {
        supabase_user_id: user.id,
      },
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error("Stripe Checkout Error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
