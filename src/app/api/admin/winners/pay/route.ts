import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { winnerId } = await req.json();

    // 1. Update Database Status
    const { error: updateError } = await supabase
      .from("winners")
      .update({ status: "paid" })
      .eq("id", winnerId);

    if (updateError) throw updateError;

    // 2. Fetch User Email and Name for the notification
    // Note: Profiles is linked via a foreign key
    const { data: winnerData, error: fetchError } = await supabase
      .from("winners")
      .select("amount, profiles(email, full_name)")
      .eq("id", winnerId)
      .single();

    if (fetchError) throw fetchError;

    // 3. Setup the Transporter using the Brevo credentials that just worked
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER, // Using the 9eb... login from your screenshot
        pass: process.env.SMTP_PASS, // Using your new SMTP key
      },
    });

    // 4. Send the Email
    // Casting to 'any' because of the nested Supabase profile structure
    const profile = winnerData?.profiles as any;

    if (profile?.email) {
      try {
        await transporter.sendMail({
          // MUST use your authorized SMTP_FROM email
          from: `"Digital Heroes Payouts" <${process.env.SMTP_FROM}>`,
          to: profile.email,
          subject: "💸 Your Prize Has Been Paid!",
          html: `
            <div style="font-family: sans-serif; line-height: 1.5;">
              <h2>Money is on the way!</h2>
              <p>Hi ${profile.full_name || "Hero"},</p>
              <p>Great news! We have processed your payout of <strong>$${
                winnerData.amount
              }</strong>.</p>
              <p>The funds should appear in your account shortly depending on your payment method.</p>
              <p>Thank you for making an impact with us!</p>
            </div>
          `,
        });
        console.log(`Payout email sent successfully to: ${profile.email}`);
      } catch (emailErr) {
        console.error("Payout email failed but DB was updated:", emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Critical Payout Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
