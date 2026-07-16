import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow auth callback and reset password routes
  if (
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/reset-password")
  ) {
    return NextResponse.next();
  }

  // If you are using Supabase Auth, add your session update logic here.

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
