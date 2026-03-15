import { NextResponse } from "next/server";
import { getGuestbookEntries, addGuestbookEntry } from "@/lib/store";

export async function GET() {
  try {
    const entries = await getGuestbookEntries();
    return NextResponse.json(entries);
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

    const entry = await addGuestbookEntry({
      author: author.trim(),
      message: message.trim(),
      emoji: emoji || undefined,
      image: image || undefined,
      video: video || undefined,
    });

    return NextResponse.json(entry);
  } catch {
    return NextResponse.json(
      { error: "Не удалось добавить сообщение" },
      { status: 500 }
    );
  }
}
