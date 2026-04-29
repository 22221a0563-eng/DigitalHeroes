import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    const { data: users, error } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("subscription_status", "active");

    if (error) throw new Error(`Database error: ${error.message}`);
    if (!users || users.length === 0)
      throw new Error("No active users found to email.");

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
      port: 587, // Port 587 is for STARTTLS
      secure: false, // MUST be false for port 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        // This helps prevent version mismatch errors by allowing the
        // protocol to negotiate the best available version
        rejectUnauthorized: false,
      },
    });

    let sentCount = 0;

    // Loop and send emails
    for (const user of users) {
      if (!user.email) continue;

      const firstName = user.full_name?.split(" ")[0] || "Hero";

      try {
        await transporter.sendMail({
          // Use your SMTP_FROM variable here
          from: `"Digital Heroes" <${process.env.SMTP_FROM}>`,
          to: user.email,
          subject: "📢 Today is Draw Day!",
          html: `
            <h2>Get Ready, ${firstName}!</h2>
            <p>The monthly draw is happening today! Make sure your 5 Stableford scores are logged in your dashboard to participate.</p>
            <p>Good luck!</p>
          `,
        });
        sentCount++;
      } catch (emailError) {
        console.error(`Failed to send to ${user.email}:`, emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully announced draw to ${sentCount} users.`,
    });
  } catch (err: any) {
    console.error("Announce Draw Critical Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
