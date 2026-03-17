import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase";

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("guestbook")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      return NextResponse.json(
        { error: "Failed to load guestbook" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      (data || []).map((row) => ({
        id: row.id,
        author: row.author,
        message: row.message,
        emoji: row.emoji ?? undefined,
        image: row.image_url ?? undefined,
        video: row.video_url ?? undefined,
        createdAt: row.created_at,
      }))
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to load guestbook" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { author, message, emoji, image, video } = body;

    if (!author?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "Имя и сообщение обязательны" },
        { status: 400 }
      );
    }

    if (author.length > 50) {
      return NextResponse.json(
        { error: "Имя слишком длинное" },
        { status: 400 }
      );
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { error: "Сообщение слишком длинное" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("guestbook")
      .insert({
        author: author.trim(),
        message: message.trim(),
        emoji: emoji || null,
        image_url: image || null,
        video_url: video || null,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Не удалось добавить сообщение" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: data.id,
      author: data.author,
      message: data.message,
      emoji: data.emoji ?? undefined,
      image: data.image_url ?? undefined,
      video: data.video_url ?? undefined,
      createdAt: data.created_at,
    });
  } catch {
    return NextResponse.json(
      { error: "Не удалось добавить сообщение" },
      { status: 500 }
    );
  }
}
