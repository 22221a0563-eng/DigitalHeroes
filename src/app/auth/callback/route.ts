// src/app/auth/callback/route.ts
import { createClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Ensure "next" is captured from the query string
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createClient();
    // This exchanges the one-time code for a valid session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // On success, go to /reset-password (or whatever was in 'next')
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If the link is expired (otp_expired), Supabase usually redirects here
  return NextResponse.redirect(`${origin}/login?error=link_expired`);
}
