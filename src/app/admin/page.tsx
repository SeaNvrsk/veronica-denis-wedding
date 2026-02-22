"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  images: string[];
  videoUrl?: string;
  published: boolean;
  createdAt: string;
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

  useEffect(() => {
    const stored = sessionStorage.getItem("adminToken");
    if (stored) {
      setToken(stored);
      setAuthenticated(true);
      fetchPosts(stored);
    }
  }, []);

  const fetchPosts = (t: string) => {
    fetch("/api/blog")
      .then((r) => r.json())
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch(() => {});
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
