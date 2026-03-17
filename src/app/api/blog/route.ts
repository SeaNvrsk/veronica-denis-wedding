import { NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/utils/supabase";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "wedding2026";

function checkAuth(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  return token === ADMIN_SECRET;
}

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });
    if (error) {
      return NextResponse.json({ error: "Failed to load blog" }, { status: 500 });
    }
    return NextResponse.json(
      (data || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        contentHtml: p.content_html,
        media: p.media || [],
        createdAt: p.created_at,
      }))
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to load blog" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, contentHtml, media, published } = body;

    if (!title?.trim() || !contentHtml?.trim()) {
      return NextResponse.json(
        { error: "Заголовок и содержание обязательны" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .insert({
        title: title.trim(),
        content_html: contentHtml.trim(),
        media: Array.isArray(media) ? media : [],
        published: published ?? true,
      })
      .select("*")
      .single();
    if (error) {
      return NextResponse.json({ error: "Не удалось создать запись", details: error.message }, { status: 500 });
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
      { error: "Не удалось создать запись" },
      { status: 500 }
    );
  }
}
