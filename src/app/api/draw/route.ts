import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  calculateCharity,
  calculatePrizePool,
  runDrawSimulation,
  distributePrizes,
  User,
} from "@/lib/drawEngine";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { mode, drawType, isTest, simData } = await request.json();

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (mode === "publish" && simData) {
      // Setup Brevo SMTP Transporter
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      for (const payout of simData.payouts) {
        // Save to Database First
        const { error: dbError } = await supabaseAdmin.from("winners").insert({
          user_id: payout.userId,
          amount: payout.amount,
          match_tier: payout.tier,
          drawn_at: new Date().toISOString(),
          status: "pending",
        });

        if (dbError) throw dbError;

        // Send Email via Brevo/Nodemailer with Eligibility Instructions
        if (payout.userEmail) {
          try {
            await transporter.sendMail({
              from: `"Digital Heroes Rewards" <${process.env.SMTP_FROM}>`,
              to: payout.userEmail,
              subject: "🏆 You Won the Digital Heroes Draw!",
              html: `
                <div style="font-family: sans-serif; line-height: 1.5;">
                  <h2>Congratulations ${payout.userName}!</h2>
                  <p>You successfully matched ${
                    payout.tier
                  } numbers in today's draw and won <strong>$${payout.amount.toFixed(
                2
              )}</strong>!</p>
                  
                  <hr />
                  
                  <h3>📋 Next Steps: Eligibility Verification</h3>
                  <p>To claim your prize, you must complete the mandatory verification process:</p>
                  
                  <ol>
                    <li><strong>Proof Upload:</strong> Please log in to your dashboard and upload a <strong>Screenshot of your scores</strong> directly from the golf platform.</li>
                    <li><strong>Admin Review:</strong> Our team will review your submission to ensure it matches your logged scores.</li>
                    <li><strong>Approval:</strong> Once the admin approves your proof, your payout will be processed. If the submission is rejected, you will be notified of the reason.</li>
                  </ol>
                  
                  <p>Check your dashboard now to start the process. Congratulations again!</p>
                </div>
              `,
            });
            console.log(`Success: Winner email sent to ${payout.userEmail}`);
          } catch (emailError) {
            console.error(
              "Email failed to send, but database was saved.",
              emailError
            );
          }
        }
      }

      await supabaseAdmin.from("system_settings").upsert({
        id: 1,
        current_jackpot_rollover: simData.rolloverPreview,
      });
      return NextResponse.json({
        message:
          "Draw published successfully! Winners emailed & Ledgers updated.",
      });
    }

    // --- NORMAL SIMULATION LOGIC ---
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, subscription_plan, subscription_amount, charity_percentage, selected_charity, email, full_name"
      )
      .eq("subscription_status", "active");

    const { data: scores } = await supabaseAdmin.from("scores").select("*");

    let validUsers: User[] = (profiles || [])
      .map((p) => {
        const userScores = (scores || [])
          .filter((s) => s.user_id === p.id)
          .map((s) => s.score);
        const isYearly = p.subscription_plan === "yearly";
        const actualSubAmount = p.subscription_amount
          ? Number(p.subscription_amount)
          : isYearly
          ? 250
          : 25;

        return {
          id: p.id,
          subscription_plan: p.subscription_plan || "monthly",
          subscription_amount: actualSubAmount,
          charity_percentage: p.charity_percentage || 50,
          selected_charity: p.selected_charity || "",
          scores: userScores,
        };
      })
      .filter((u) => u.scores.length === 5);

    if (isTest) {
      const testEmail = process.env.SMTP_FROM || "test@example.com";

      validUsers = [
        {
          id: "test-user-001",
          subscription_plan: "yearly",
          subscription_amount: 250,
          charity_percentage: 50,
          selected_charity: "Red Cross, WWF",
          scores: [5, 12, 23, 34, 41],
        },
        {
          id: "test-user-002",
          subscription_plan: "monthly",
          subscription_amount: 25,
          charity_percentage: 50,
          selected_charity: "WWF",
          scores: [5, 12, 23, 34, 45],
        },
        {
          id: "test-user-003",
          subscription_plan: "monthly",
          subscription_amount: 25,
          charity_percentage: 50,
          selected_charity: "Red Cross",
          scores: [1, 2, 3, 4, 5],
        },
      ];
      profiles?.push(
        {
          id: "test-user-001",
          full_name: "Test Hero Alpha (Yearly)",
          email: testEmail,
        } as any,
        {
          id: "test-user-002",
          full_name: "Test Hero Bravo (Monthly)",
          email: testEmail,
        } as any,
        {
          id: "test-user-003",
          full_name: "Test Hero Charlie (Monthly)",
          email: testEmail,
        } as any
      );
    }

    if (validUsers.length === 0) {
      return NextResponse.json(
        {
          error:
            "No real users have 5 scores. Click 'TEST SIMULATION' to run with dummy data.",
        },
        { status: 400 }
      );
    }

    const { data: settings } = await supabaseAdmin
      .from("system_settings")
      .select("current_jackpot_rollover")
      .eq("id", 1)
      .maybeSingle();
    const rollover = settings?.current_jackpot_rollover || 0;

    const { totalCharity } = calculateCharity(validUsers);
    const pool = calculatePrizePool(validUsers, totalCharity, rollover);

    let drawNumbers = runDrawSimulation(validUsers, drawType);
    if (isTest) drawNumbers[0] = 5;

    const { payouts, nextMonthJackpot } = distributePrizes(
      validUsers,
      drawNumbers,
      pool.allocations
    );

    const enrichedPayouts = payouts.map((p) => {
      const user = profiles?.find((profile) => profile.id === p.userId);
      return {
        ...p,
        userName: user?.full_name || "Anonymous Hero",
        userEmail: user?.email || "",
      };
    });

    return NextResponse.json({
      message: isTest
        ? `Test Simulation (${drawType}) complete`
        : "Simulation complete",
      drawNumbers,
      prizePool: pool,
      totalCharity,
      payouts: enrichedPayouts,
      rolloverPreview: nextMonthJackpot,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
