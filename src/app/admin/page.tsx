"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/utils/supabase";
import { RichTextEditor } from "@/components/RichTextEditor";

interface BlogPost {
  id: string;
  title: string;
  contentHtml: string;
  media: { url: string; type: "image" | "video" }[];
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

type DailyCount = { day: string; count: number };

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
  const [formContentHtml, setFormContentHtml] = useState("<p></p>");
  const [formMedia, setFormMedia] = useState<{ url: string; type: "image" | "video" }[]>([]);
  const [formPublished, setFormPublished] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [quizStats, setQuizStats] = useState<QuizStats | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [quizSaving, setQuizSaving] = useState(false);
  const [guestbookEntries, setGuestbookEntries] = useState<GuestbookEntry[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResultRow[]>([]);
  const [dailyGuestbook, setDailyGuestbook] = useState<DailyCount[]>([]);
  const [dailyQuiz, setDailyQuiz] = useState<DailyCount[]>([]);

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

      // simple per-day stats (last 30 days), computed client-side
      const toDay = (iso: string) => new Date(iso).toISOString().slice(0, 10);
      const agg = (items: { created_at: string }[]) => {
        const map = new Map<string, number>();
        for (const it of items) {
          const d = toDay(it.created_at);
          map.set(d, (map.get(d) || 0) + 1);
        }
        return Array.from(map.entries())
          .sort((a, b) => (a[0] < b[0] ? 1 : -1))
          .slice(0, 30)
          .map(([day, count]) => ({ day, count }));
      };
      setDailyGuestbook(agg((gb as GuestbookEntry[]) || []));
      setDailyQuiz(agg((qr as QuizResultRow[]) || []));

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
    if (!formTitle.trim() || !formContentHtml.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formTitle.trim(),
          contentHtml: formContentHtml,
          media: formMedia,
          published: formPublished,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPosts((prev) => [data, ...prev]);
        setFormTitle("");
        setFormContentHtml("<p></p>");
        setFormMedia([]);
      } else {
        setError(data.error || "Ошибка");
      }
    } catch {
      setError("Ошибка сохранения");
    } finally {
      setSubmitting(false);
    }
  };

  const uploadBlogMedia = async (file: File) => {
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", "blog");
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Ошибка загрузки");
      return;
    }
    setFormMedia((prev) => [...prev, { url: data.url, type: data.type }]);
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

  const handleDeleteGuestbook = async (id: string) => {
    if (!confirm("Удалить комментарий?")) return;
    setError("");
    try {
      const res = await fetch(`/api/admin/guestbook/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка удаления");
        return;
      }
      setGuestbookEntries((prev) => prev.filter((x) => x.id !== id));
    } catch {
      setError("Ошибка удаления");
    }
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
          {(dailyGuestbook.length > 0 || dailyQuiz.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
              <div className="p-4 rounded-xl bg-indigo-50">
                <p className="font-medium text-indigo-900 mb-2">
                  Пожелания по дням (последние)
                </p>
                <div className="space-y-1 text-sm text-indigo-700">
                  {dailyGuestbook.slice(0, 7).map((d) => (
                    <div key={d.day} className="flex justify-between">
                      <span>{d.day}</span>
                      <span className="font-semibold">{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-indigo-50">
                <p className="font-medium text-indigo-900 mb-2">
                  Викторина по дням (последние)
                </p>
                <div className="space-y-1 text-sm text-indigo-700">
                  {dailyQuiz.slice(0, 7).map((d) => (
                    <div key={d.day} className="flex justify-between">
                      <span>{d.day}</span>
                      <span className="font-semibold">{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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
                  <button
                    type="button"
                    onClick={() => handleDeleteGuestbook(e.id)}
                    className="ml-auto px-3 py-1 rounded-lg text-red-600 hover:bg-red-50 text-xs"
                  >
                    Удалить
                  </button>
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
            <RichTextEditor
              value={formContentHtml}
              onChange={setFormContentHtml}
            />
            <div className="flex flex-wrap gap-3 items-center">
              <label className="px-4 py-2 rounded-xl bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition cursor-pointer text-sm font-medium">
                📷 Загрузить фото
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadBlogMedia(f);
                    e.target.value = "";
                  }}
                />
              </label>
              <label className="px-4 py-2 rounded-xl bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition cursor-pointer text-sm font-medium">
                🎬 Загрузить видео
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadBlogMedia(f);
                    e.target.value = "";
                  }}
                />
              </label>
              {formMedia.length > 0 && (
                <span className="text-sm text-indigo-600">
                  Вложений: {formMedia.length}
                </span>
              )}
            </div>
            {formMedia.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {formMedia.map((m, i) => (
                  <div key={i} className="rounded-lg overflow-hidden border border-indigo-100 bg-white">
                    {m.type === "image" ? (
                      <img src={m.url} alt="" className="w-full h-28 object-cover" />
                    ) : (
                      <video src={m.url} className="w-full h-28 object-cover" muted />
                    )}
                    <button
                      type="button"
                      onClick={() => setFormMedia((prev) => prev.filter((_, idx) => idx !== i))}
                      className="w-full text-xs py-1 text-red-600 hover:bg-red-50"
                    >
                      Удалить вложение
                    </button>
                  </div>
                ))}
              </div>
            )}
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
