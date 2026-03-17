import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/utils/supabase";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "wedding2026";

function checkAuth(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  return authHeader?.replace("Bearer ", "") === ADMIN_SECRET;
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const supabase = getSupabaseServiceClient();
    const { error } = await supabase.from("guestbook").delete().eq("id", id);
    if (error) {
      return NextResponse.json(
        { error: "Не удалось удалить комментарий", details: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      {
        error: "Не удалось удалить комментарий",
        details: e instanceof Error ? e.message : String(e),
      },
      { status: 500 }
    );
  }
}

