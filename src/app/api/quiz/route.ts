import { NextResponse } from "next/server";
import { getQuizQuestions } from "@/lib/store";
import { getSupabaseServerClient } from "@/utils/supabase";

type QuizAnswerRow = { questionId: number; answer: number; correct: boolean };
type QuizResultRow = { score: number; total: number; answers: QuizAnswerRow[] };

export async function GET(request: Request) {
  try {
    const questions = await getQuizQuestions();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type === "stats") {
      const supabase = getSupabaseServerClient();
      const { data: submissions, error } = await supabase
        .from("quiz_results")
        .select("score, total, answers");
      if (error) {
        return NextResponse.json(
          { error: "Failed to load quiz" },
          { status: 500 }
        );
      }
      const totalParticipants = (submissions || []).length;
      const questionStats = questions.map((q) => {
        const correctCount = (submissions as unknown as QuizResultRow[] | null || []).filter((s) => {
          const answers = Array.isArray(s.answers) ? s.answers : [];
          const answer = answers.find((a) => a.questionId === q.id);
          return answer?.correct;
        }).length;
        return {
          questionId: q.id,
          question: q.question,
          correctCount,
          totalParticipants,
          percentage:
            totalParticipants > 0
              ? Math.round((correctCount / totalParticipants) * 100)
              : 0,
        };
      });
      const avgScore =
        totalParticipants > 0
          ? Math.round(
              ((submissions as unknown as QuizResultRow[] | null) || []).reduce(
                (sum, s) => sum + (s.score || 0),
                0
              ) / totalParticipants
            )
          : 0;

      return NextResponse.json({
        totalParticipants,
        avgScore,
        totalQuestions: questions.length,
        questionStats,
      });
    }

    return NextResponse.json({
      questions: questions.map(({ id, question, options, correctIndex }) => ({
        id,
        question,
        options,
        correctIndex,
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load quiz" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const questions = await getQuizQuestions();
    const body = await request.json();
    const { answers } = body as { answers: { questionId: number; answer: number }[] };

    if (!Array.isArray(answers)) {
      return NextResponse.json(
        { error: "Неверный формат ответов" },
        { status: 400 }
      );
    }

    const processedAnswers = answers.map((a) => {
      const question = questions.find((q) => q.id === a.questionId);
      const correct = question ? question.correctIndex === a.answer : false;
      return {
        questionId: a.questionId,
        answer: a.answer,
        correct,
      };
    });

    const score = processedAnswers.filter((a) => a.correct).length;
    const total = questions.length;

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("quiz_results")
      .insert({ score, total, answers: processedAnswers })
      .select("*")
      .single();
    if (error) {
      return NextResponse.json(
        { error: "Не удалось сохранить ответы" },
        { status: 500 }
      );
    }
    return NextResponse.json({
      id: data.id,
      score: data.score,
      total: data.total,
      submittedAt: data.created_at,
      correctAnswers: processedAnswers,
    });
  } catch {
    return NextResponse.json(
      { error: "Не удалось сохранить ответы" },
      { status: 500 }
    );
  }
}
