"use client";

import { useState, useEffect } from "react";

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
}

interface QuizStats {
  totalParticipants: number;
  avgScore: number;
  totalQuestions: number;
  questionStats: {
    questionId: number;
    question: string;
    correctCount: number;
    totalParticipants: number;
    percentage: number;
  }[];
}

type QuizPhase = "intro" | "questions" | "results" | "stats";

export function Quiz() {
  const [phase, setPhase] = useState<QuizPhase>("intro");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    total: number;
    correctAnswers: { questionId: number; correct: boolean }[];
  } | null>(null);
  const [stats, setStats] = useState<QuizStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/quiz")
      .then((r) => r.json())
      .then((data) => setQuestions(data.questions || []))
      .catch(() => {});
  }, []);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const selectAnswer = (optionIndex: number) => {
    if (revealed) return;
    setSelectedAnswer(optionIndex);
  };

  const confirmAnswer = () => {
    if (selectedAnswer === null) return;
    setRevealed(true);
    const finalAnswers = { ...answers, [currentQuestion.id]: selectedAnswer };
    setAnswers(finalAnswers);

    setTimeout(() => {
      if (isLastQuestion) {
        submitQuiz(finalAnswers);
      } else {
        setCurrentIndex((i) => i + 1);
        setSelectedAnswer(null);
        setRevealed(false);
      }
    }, 1500);
  };

  const submitQuiz = async (finalAnswers?: Record<number, number>) => {
    const toSubmit = finalAnswers ?? answers;
    setLoading(true);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: Object.entries(toSubmit).map(([qId, answer]) => ({
            questionId: Number(qId),
            answer,
          })),
        }),
      });
      const data = await res.json();
      if (data.correctAnswers) {
        setResult({
          score: data.score,
          total: data.total,
          correctAnswers: data.correctAnswers,
        });
      }
    } catch {
    } finally {
      setLoading(false);
      setPhase("results");
    }
  };

  const fetchStats = () => {
    fetch("/api/quiz?type=stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  };

  const resetQuiz = () => {
    setPhase("intro");
    setCurrentIndex(0);
    setAnswers({});
    setSelectedAnswer(null);
    setRevealed(false);
    setResult(null);
    setStats(null);
  };

  if (questions.length === 0 && phase !== "intro") {
    return null;
  }

  return (
    <section id="quiz" className="py-20 scroll-mt-20">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-serif text-indigo-900 text-center mb-4">
          Викторина о молодожёнах
        </h2>
        <p className="text-indigo-600 text-center mb-12">
          Проверьте, насколько хорошо вы знаете Веронику и Дениса
        </p>

        <div className="bg-white/95 backdrop-blur rounded-2xl p-8 shadow-xl border border-indigo-100 min-h-[320px]">
          {phase === "intro" && (
            <div className="text-center py-8 animate-fade-in">
              <p className="text-lg text-indigo-800 mb-6">
                Ответьте на {questions.length} вопросов о паре. В конце вы
                увидите результат и сможете посмотреть статистику ответов.
              </p>
              <button
                onClick={() => setPhase("questions")}
                className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
              >
                Начать викторину
              </button>
            </div>
          )}

          {phase === "questions" && currentQuestion && (
            <div className="animate-fade-in">
              <p className="text-sm text-indigo-500 mb-2">
                Вопрос {currentIndex + 1} из {questions.length}
              </p>
              <h3 className="text-xl font-semibold text-indigo-900 mb-6">
                {currentQuestion.question}
              </h3>
              <div className="space-y-3">
                {currentQuestion.options.map((option, i) => {
                  const isSelected = selectedAnswer === i;
                  const showCorrect =
                    revealed &&
                    currentQuestion &&
                    currentQuestion.correctIndex === i;
                  const showWrong =
                    revealed && isSelected && !showCorrect;

                  return (
                    <button
                      key={i}
                      onClick={() => selectAnswer(i)}
                      disabled={revealed}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-indigo-200 hover:border-indigo-300"
                      } ${
                        showCorrect
                          ? "border-green-500 bg-green-50 animate-bounce-in"
                          : ""
                      } ${
                        showWrong
                          ? "border-red-400 bg-red-50 animate-shake"
                          : ""
                      }`}
                    >
                      <span className="text-indigo-800">{option}</span>
                      {showCorrect && (
                        <span className="ml-2 text-green-600">✓</span>
                      )}
                      {showWrong && (
                        <span className="ml-2 text-red-600">✗</span>
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedAnswer !== null && !revealed && (
                <button
                  onClick={confirmAnswer}
                  className="mt-6 w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition animate-fade-in"
                >
                  Подтвердить
                </button>
              )}
              {loading && (
                <div className="mt-6 text-center text-indigo-600">
                  Сохранение результата...
                </div>
              )}
            </div>
          )}

          {phase === "results" && result && (
            <div className="text-center animate-fade-in">
              <p className="text-2xl font-bold text-indigo-900 mb-2">
                Ваш результат: {result.score} из {result.total}
              </p>
              <p className="text-indigo-600 mb-6">
                {Math.round((result.score / result.total) * 100)}% правильных
                ответов
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <button
                  onClick={fetchStats}
                  className="px-6 py-2 rounded-xl bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition"
                >
                  Посмотреть статистику
                </button>
                <button
                  onClick={resetQuiz}
                  className="px-6 py-2 rounded-xl border border-indigo-300 text-indigo-700 hover:bg-indigo-50 transition"
                >
                  Пройти снова
                </button>
              </div>
              {stats && (
                <div className="mt-8 text-left animate-fade-in">
                  <h4 className="font-semibold text-indigo-900 mb-4">
                    Статистика ответов
                  </h4>
                  <p className="text-sm text-indigo-600 mb-4">
                    Участников: {stats.totalParticipants} · Средний балл:{" "}
                    {stats.avgScore}/{stats.totalQuestions}
                  </p>
                  <div className="space-y-2">
                    {stats.questionStats.map((q) => (
                      <div
                        key={q.questionId}
                        className="text-sm p-2 rounded-lg bg-indigo-50"
                      >
                        <p className="text-indigo-800 font-medium">
                          {q.question}
                        </p>
                        <p className="text-indigo-600">
                          Правильно ответили: {q.percentage}% (
                          {q.correctCount}/{q.totalParticipants})
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
