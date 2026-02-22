import { NextResponse } from "next/server";
import { getQuizSubmissions, addQuizSubmission } from "@/lib/store";
import { QUIZ_QUESTIONS } from "@/lib/quiz-data";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type === "stats") {
      const submissions = await getQuizSubmissions();
      const totalParticipants = submissions.length;
      const questionStats = QUIZ_QUESTIONS.map((q) => {
        const correctCount = submissions.filter((s) => {
          const answer = s.answers.find((a) => a.questionId === q.id);
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
              submissions.reduce((sum, s) => sum + s.score, 0) /
                totalParticipants
            )
          : 0;

      return NextResponse.json({
        totalParticipants,
        avgScore,
        totalQuestions: QUIZ_QUESTIONS.length,
        questionStats,
      });
    }

    return NextResponse.json({
      questions: QUIZ_QUESTIONS.map(({ id, question, options, correctIndex }) => ({
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
    const body = await request.json();
    const { answers } = body as { answers: { questionId: number; answer: number }[] };

    if (!Array.isArray(answers)) {
      return NextResponse.json(
        { error: "Неверный формат ответов" },
        { status: 400 }
      );
    }

    const processedAnswers = answers.map((a) => {
      const question = QUIZ_QUESTIONS.find((q) => q.id === a.questionId);
      const correct = question ? question.correctIndex === a.answer : false;
      return {
        questionId: a.questionId,
        answer: a.answer,
        correct,
      };
    });

    const score = processedAnswers.filter((a) => a.correct).length;
    const total = QUIZ_QUESTIONS.length;

    const submission = await addQuizSubmission({
      answers: processedAnswers,
      score,
      total,
    });

    return NextResponse.json({
      ...submission,
      correctAnswers: processedAnswers,
    });
  } catch {
    return NextResponse.json(
      { error: "Не удалось сохранить ответы" },
      { status: 500 }
    );
  }
}
