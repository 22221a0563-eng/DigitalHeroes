import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Use the master key to update the database securely
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: Request) {
  try {
    const { session_id } = await request.json();

    // Ask Stripe if this session was actually paid
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === "paid") {
      const userId = session.metadata?.supabase_user_id;

      if (userId) {
        // Force the database to update to active!
        await supabaseAdmin
          .from("profiles")
          .update({
            subscription_status: "active",
            stripe_customer_id: session.customer as string,
          })
          .eq("id", userId);

        return NextResponse.json({
          success: true,
          message: "Database updated",
        });
      }
    }

    return NextResponse.json({ success: false, message: "Not paid" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
