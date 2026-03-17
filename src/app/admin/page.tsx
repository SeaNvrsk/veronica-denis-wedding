"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/utils/supabase";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  images: string[];
  videoUrl?: string;
  published: boolean;
  createdAt: string;
}

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
  questionStats: { questionId: number; question: string; correctCount: number; totalParticipants: number; percentage: number }[];
}

interface GuestbookEntry {
  id: string;
  author: string;
  message: string;
  emoji?: string | null;
  image_url?: string | null;
  video_url?: string | null;
  created_at: string;
}

interface QuizResultRow {
  id: string;
  score: number;
  total: number;
  created_at: string;
}

function QuizQuestionForm({
  question,
  onSave,
  onCancel,
}: {
  question: QuizQuestion;
  onSave: (q: QuizQuestion) => void;
  onCancel: () => void;
}) {
  const [q, setQ] = useState(question);
  return (
    <div className="space-y-4">
      <input
        type="text"
        value={q.question}
        onChange={(e) => setQ((p) => ({ ...p, question: e.target.value }))}
        placeholder="Вопрос"
        className="w-full px-4 py-2 rounded-xl border border-indigo-200"
      />
      <div>
        <label className="block text-sm text-indigo-700 mb-1">Варианты ответов (каждый с новой строки)</label>
        <textarea
          value={q.options.join("\n")}
          onChange={(e) =>
            setQ((p) => ({
              ...p,
              options: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
            }))
          }
          rows={4}
          className="w-full px-4 py-2 rounded-xl border border-indigo-200 resize-none"
        />
      </div>
      <div>
        <label className="block text-sm text-indigo-700 mb-1">Номер правильного ответа (1, 2, 3...)</label>
        <select
          value={q.correctIndex + 1}
          onChange={(e) => setQ((p) => ({ ...p, correctIndex: parseInt(e.target.value, 10) - 1 }))}
          className="w-full px-4 py-2 rounded-xl border border-indigo-200"
        >
          {q.options.map((_, i) => (
            <option key={i} value={i + 1}>
              {i + 1}. {q.options[i] || "—"}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSave(q)}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Готово
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl border border-indigo-300 text-indigo-700 hover:bg-indigo-50"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formImages, setFormImages] = useState("");
  const [formVideoUrl, setFormVideoUrl] = useState("");
  const [formPublished, setFormPublished] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [quizStats, setQuizStats] = useState<QuizStats | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [quizSaving, setQuizSaving] = useState(false);
  const [guestbookEntries, setGuestbookEntries] = useState<GuestbookEntry[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResultRow[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem("adminToken");
    if (stored) {
      setToken(stored);
      setAuthenticated(true);
      fetchPosts();
      fetchQuizStats();
      fetchQuizQuestions(stored);
      fetchRealtimeData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPosts = () => {
    fetch("/api/blog")
      .then((r) => r.json())
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  const fetchQuizStats = () => {
    fetch("/api/quiz?type=stats")
      .then((r) => r.json())
      .then(setQuizStats)
      .catch(() => {});
  };

  const fetchQuizQuestions = (t: string) => {
    fetch("/api/admin/quiz", {
      headers: { Authorization: `Bearer ${t}` },
    })
      .then((r) => r.json())
      .then((data) => (Array.isArray(data) ? setQuizQuestions(data) : null))
      .catch(() => {});
  };

  const fetchRealtimeData = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: gb } = await supabase
        .from("guestbook")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      setGuestbookEntries((gb as GuestbookEntry[]) || []);

      const { data: qr } = await supabase
        .from("quiz_results")
        .select("id, score, total, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      setQuizResults((qr as QuizResultRow[]) || []);

      const channel = supabase
        .channel("admin-realtime")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "guestbook" },
          (payload) => {
            const row = payload.new as GuestbookEntry;
            setGuestbookEntries((prev) => [row, ...prev].slice(0, 200));
          }
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "quiz_results" },
          (payload) => {
            const row = payload.new as QuizResultRow;
            setQuizResults((prev) => [row, ...prev].slice(0, 200));
            fetchQuizStats();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      // ignore
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        setAuthenticated(true);
        sessionStorage.setItem("adminToken", data.token);
        fetchQuizQuestions(data.token);
        fetchQuizStats();
        fetchRealtimeData();
      } else {
        setError(data.error || "Неверный пароль");
      }
    } catch {
      setError("Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminToken");
    setAuthenticated(false);
    setToken("");
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const images = formImages
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formTitle.trim(),
          content: formContent.trim(),
          images,
          videoUrl: formVideoUrl.trim() || undefined,
          published: formPublished,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPosts((prev) => [data, ...prev]);
        setFormTitle("");
        setFormContent("");
        setFormImages("");
        setFormVideoUrl("");
      } else {
        setError(data.error || "Ошибка");
      }
    } catch {
      setError("Ошибка сохранения");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Удалить запись?")) return;
    try {
      const res = await fetch(`/api/blog/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch {}
  };

  const handleSaveQuizQuestion = (q: QuizQuestion) => {
    setQuizQuestions((prev) => {
      const idx = prev.findIndex((x) => x.id === q.id);
      const next = [...prev];
      if (idx >= 0) next[idx] = q;
      else next.push(q);
      return next;
    });
    setEditingQuestion(null);
  };

  const handleSaveQuiz = async () => {
    setQuizSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/quiz", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(quizQuestions),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Ошибка сохранения");
      }
    } catch {
      setError("Ошибка сохранения");
    } finally {
      setQuizSaving(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 to-white p-4">
        <form
          onSubmit={handleLogin}
          className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm border border-indigo-100"
        >
          <h1 className="text-2xl font-serif text-indigo-900 mb-6">
            Вход для админа
          </h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            className="w-full px-4 py-3 rounded-xl border border-indigo-200 focus:border-indigo-500 outline-none mb-4"
          />
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-serif text-indigo-900">
            Панель администратора
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 rounded-xl border border-indigo-300 text-indigo-700 hover:bg-indigo-50"
            >
              На сайт
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
            >
              Выйти
            </button>
          </div>
        </div>

        {/* Статистика викторины */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-indigo-100">
          <h2 className="text-lg font-semibold text-indigo-900 mb-4">
            Статистика викторины
          </h2>
          {quizStats ? (
            <div className="space-y-2">
              <p className="text-indigo-800">
                Участников: <strong>{quizStats.totalParticipants}</strong>
              </p>
              <p className="text-indigo-800">
                Средний балл: <strong>{quizStats.avgScore}</strong> из {quizStats.totalQuestions}
              </p>
              <div className="mt-4 space-y-2">
                {quizStats.questionStats.map((q) => (
                  <div key={q.questionId} className="text-sm p-3 rounded-lg bg-indigo-50">
                    <p className="font-medium text-indigo-900">{q.question}</p>
                    <p className="text-indigo-600">
                      Правильно: {q.percentage}% ({q.correctCount}/{q.totalParticipants})
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-indigo-600">Загрузка...</p>
          )}
        </div>

        {/* Пожелания (гостевой альбом) */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-indigo-100">
          <div className="flex items-baseline justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-indigo-900">
              Пожелания (гостевой альбом)
            </h2>
            <span className="text-sm text-indigo-600">
              Всего: {guestbookEntries.length}
            </span>
          </div>
          <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
            {guestbookEntries.map((e) => (
              <div key={e.id} className="p-4 rounded-xl bg-indigo-50">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="font-semibold text-indigo-900">
                    {e.emoji || "💕"} {e.author}
                  </span>
                  <span className="text-xs text-indigo-500">
                    {new Date(e.created_at).toLocaleString("ru-RU")}
                  </span>
                </div>
                <p className="mt-2 text-indigo-800 whitespace-pre-wrap">
                  {e.message}
                </p>
                {(e.image_url || e.video_url) && (
                  <div className="mt-3 flex flex-wrap gap-2 text-sm">
                    {e.image_url && (
                      <a
                        className="text-indigo-700 underline"
                        href={e.image_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Фото
                      </a>
                    )}
                    {e.video_url && (
                      <a
                        className="text-indigo-700 underline"
                        href={e.video_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Видео
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
            {guestbookEntries.length === 0 && (
              <p className="text-indigo-600">Пока нет пожеланий</p>
            )}
          </div>
        </div>

        {/* Результаты викторины */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-indigo-100">
          <div className="flex items-baseline justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-indigo-900">
              Результаты викторины
            </h2>
            <span className="text-sm text-indigo-600">
              Всего: {quizResults.length}
            </span>
          </div>
          <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
            {quizResults.map((r) => (
              <div key={r.id} className="p-3 rounded-xl bg-indigo-50 flex justify-between gap-3">
                <div>
                  <p className="font-medium text-indigo-900">
                    {r.score} / {r.total}
                  </p>
                  <p className="text-xs text-indigo-500">
                    {new Date(r.created_at).toLocaleString("ru-RU")}
                  </p>
                </div>
                <span className="text-xs text-indigo-400 self-center">
                  {r.id.slice(0, 8)}
                </span>
              </div>
            ))}
            {quizResults.length === 0 && (
              <p className="text-indigo-600">Пока нет результатов</p>
            )}
          </div>
        </div>

        {/* Вопросы викторины */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-indigo-100">
          <h2 className="text-lg font-semibold text-indigo-900 mb-4">
            Вопросы викторины
          </h2>
          {editingQuestion ? (
            <QuizQuestionForm
              question={editingQuestion}
              onSave={handleSaveQuizQuestion}
              onCancel={() => setEditingQuestion(null)}
            />
          ) : (
            <>
              <div className="space-y-3 mb-4">
                {quizQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="flex justify-between items-start p-3 rounded-xl bg-indigo-50"
                  >
                    <div>
                      <p className="font-medium text-indigo-900">{q.question}</p>
                      <p className="text-sm text-indigo-600 mt-1">
                        Варианты: {q.options.join(" · ")} → правильный: {q.options[q.correctIndex]}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingQuestion({ ...q })}
                      className="px-3 py-1 rounded-lg bg-indigo-200 text-indigo-800 text-sm hover:bg-indigo-300"
                    >
                      Изменить
                    </button>
                  </div>
                ))}
              </div>
              {quizQuestions.length > 0 && (
                <button
                  type="button"
                  onClick={handleSaveQuiz}
                  disabled={quizSaving}
                  className="w-full py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {quizSaving ? "Сохранение..." : "Сохранить вопросы"}
                </button>
              )}
            </>
          )}
        </div>

        <form
          onSubmit={handleSubmitPost}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-indigo-100"
        >
          <h2 className="text-lg font-semibold text-indigo-900 mb-4">
            Новая запись в блог
          </h2>
          <div className="space-y-4">
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Заголовок"
              className="w-full px-4 py-2 rounded-xl border border-indigo-200 focus:border-indigo-500 outline-none"
              required
            />
            <textarea
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="Текст записи"
              rows={6}
              className="w-full px-4 py-2 rounded-xl border border-indigo-200 focus:border-indigo-500 outline-none resize-none"
              required
            />
            <input
              type="url"
              value={formVideoUrl}
              onChange={(e) => setFormVideoUrl(e.target.value)}
              placeholder="URL видео (YouTube и т.д.)"
              className="w-full px-4 py-2 rounded-xl border border-indigo-200 focus:border-indigo-500 outline-none"
            />
            <textarea
              value={formImages}
              onChange={(e) => setFormImages(e.target.value)}
              placeholder="Ссылки на изображения (каждая с новой строки)"
              rows={3}
              className="w-full px-4 py-2 rounded-xl border border-indigo-200 focus:border-indigo-500 outline-none resize-none"
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formPublished}
                onChange={(e) => setFormPublished(e.target.checked)}
              />
              <span className="text-indigo-700">Опубликовать сразу</span>
            </label>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "Сохранение..." : "Опубликовать"}
            </button>
          </div>
        </form>

        <div>
          <h2 className="text-lg font-semibold text-indigo-900 mb-4">
            Существующие записи
          </h2>
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-xl p-4 border border-indigo-100 flex justify-between items-start"
              >
                <div>
                  <h3 className="font-medium text-indigo-900">{post.title}</h3>
                  <p className="text-sm text-indigo-600 mt-1">
                    {new Date(post.createdAt).toLocaleDateString("ru-RU")}
                  </p>
                </div>
                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="px-3 py-1 rounded-lg text-red-600 hover:bg-red-50 text-sm"
                >
                  Удалить
                </button>
              </div>
            ))}
            {posts.length === 0 && (
              <p className="text-indigo-600">Записей пока нет</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
