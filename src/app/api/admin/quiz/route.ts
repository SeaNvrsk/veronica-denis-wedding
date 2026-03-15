import { NextResponse } from "next/server";
import { getQuizQuestions, setQuizQuestions } from "@/lib/store";
import type { QuizQuestion } from "@/lib/store";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "wedding2026";

function checkAuth(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  return authHeader?.replace("Bearer ", "") === ADMIN_SECRET;
}

export async function GET(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const questions = await getQuizQuestions();
    return NextResponse.json(questions);
  } catch {
    return NextResponse.json(
      { error: "Failed to load questions" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const questions = body as QuizQuestion[];
    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "Нужен непустой массив вопросов" },
        { status: 400 }
      );
    }
    const valid = questions.every(
      (q) =>
        typeof q.id === "number" &&
        typeof q.question === "string" &&
        Array.isArray(q.options) &&
        q.options.length >= 2 &&
        typeof q.correctIndex === "number" &&
        q.correctIndex >= 0 &&
        q.correctIndex < q.options.length
    );
    if (!valid) {
      return NextResponse.json(
        { error: "Неверный формат вопросов" },
        { status: 400 }
      );
    }
    await setQuizQuestions(questions);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Не удалось сохранить вопросы" },
      { status: 500 }
    );
  }
}
