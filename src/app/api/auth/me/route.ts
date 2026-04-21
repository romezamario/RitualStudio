import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/supabase/server";

export async function GET() {
  const { user, profile, isAdmin } = await getCurrentUserProfile();

  return NextResponse.json(
    {
      user,
      profile,
      isAdmin,
    },
    { status: user ? 200 : 401 }
  );
}
