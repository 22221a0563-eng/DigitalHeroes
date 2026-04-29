import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Initialize with the SERVICE ROLE KEY (This acts as the master key)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function PATCH(request: Request) {
  try {
    const { userId, newPassword } = await request.json();
    if (!userId || !newPassword)
      return NextResponse.json({ error: "Missing data" }, { status: 400 });

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId)
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });

    // Forcefully delete the user from the Auth system entirely
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;

    // The ON DELETE CASCADE in the SQL schema will automatically clean up their scores!

    return NextResponse.json({
      success: true,
      message: "User completely deleted",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
