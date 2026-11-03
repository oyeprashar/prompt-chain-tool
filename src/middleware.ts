import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // The public landing page can render before Supabase credentials are configured.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (await import("next/server")).NextResponse.next();
  }
  return updateSession(request);
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
};
