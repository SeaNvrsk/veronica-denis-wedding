import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/utils/supabase";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "wedding2026";

function checkAuth(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  return token === ADMIN_SECRET;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const updates: any = {};
    if (typeof body.title === "string") updates.title = body.title.trim();
    if (typeof body.contentHtml === "string") updates.content_html = body.contentHtml;
    if (Array.isArray(body.media)) updates.media = body.media;
    if (typeof body.published === "boolean") updates.published = body.published;

    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();
    if (error) {
      return NextResponse.json({ error: "Не удалось обновить запись", details: error.message }, { status: 500 });
    }
    return NextResponse.json({
      id: data.id,
      title: data.title,
      contentHtml: data.content_html,
      media: data.media || [],
      createdAt: data.created_at,
      published: data.published,
    });
  } catch {
    return NextResponse.json(
      { error: "Не удалось обновить запись" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(_request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const supabase = getSupabaseServiceClient();
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: "Не удалось удалить запись", details: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Не удалось удалить запись" },
      { status: 500 }
    );
  }
}
