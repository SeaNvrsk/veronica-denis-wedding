import { NextResponse } from "next/server";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "wedding2026";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (password === ADMIN_SECRET) {
      return NextResponse.json({ success: true, token: ADMIN_SECRET });
    }

    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  }
}
