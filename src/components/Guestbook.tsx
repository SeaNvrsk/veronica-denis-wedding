"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  createGuestbookEntryAction,
  uploadGuestbookMediaAction,
} from "@/app/actions";

const EmojiPicker = dynamic(
  () => import("emoji-picker-react").then((mod) => mod.default),
  { ssr: false, loading: () => <span className="text-indigo-500">...</span> }
);

interface GuestbookEntry {
  id: string;
  author: string;
  message: string;
  emoji?: string;
  image?: string;
  video?: string;
  createdAt: string;
}

export function Guestbook() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [author, setAuthor] = useState("");
  const [message, setMessage] = useState("");
  const [emoji, setEmoji] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [error, setError] = useState("");

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/guestbook");
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch {
      setError("Не удалось загрузить сообщения");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!author.trim() || !message.trim()) {
      setError("Заполните имя и сообщение");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createGuestbookEntryAction({
        author,
        message,
        emoji: emoji || undefined,
        imageUrl: uploadedImageUrl || imageUrl.trim() || undefined,
        videoUrl: uploadedVideoUrl || undefined,
      });

      if (!res.ok) {
        setError(res.error || "Ошибка отправки");
        return;
      }

      setEntries((prev) => [res.entry, ...prev]);
      setAuthor("");
      setMessage("");
      setEmoji("");
      setImageUrl("");
      setUploadedImageUrl(null);
      setUploadedVideoUrl(null);
    } catch {
      setError("Не удалось отправить сообщение");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmojiClick = (data: { emoji: string }) => {
    setEmoji(data.emoji);
    setShowEmojiPicker(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const data = await uploadGuestbookMediaAction(formData);
      if (!data.ok) {
        setError(data.error || "Ошибка загрузки файла");
        return;
      }
      if (type === "image") setUploadedImageUrl(data.url);
      else setUploadedVideoUrl(data.url);
    } catch {
      setError("Не удалось загрузить файл");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <section id="guestbook" className="py-20 scroll-mt-20">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-serif text-indigo-900 text-center mb-4">
          Гостевой альбом
        </h2>
        <p className="text-indigo-600 text-center mb-12">
          Оставьте поздравления и пожелания на память
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-white/95 backdrop-blur rounded-2xl p-6 shadow-xl border border-indigo-100 mb-12"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-indigo-700 mb-1">
                Ваше имя
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Как к вам обращаться?"
                className="w-full px-4 py-3 rounded-xl border border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                maxLength={50}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-indigo-700 mb-1">
                Сообщение
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ваши поздравления и пожелания..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition resize-none"
                maxLength={1000}
              />
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="px-4 py-2 rounded-xl bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition text-2xl"
                  title="Добавить смайлик"
                >
                  {emoji || "😊"}
                </button>
                {showEmojiPicker && (
                  <div className="absolute z-50 top-full left-0 mt-2">
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      width={320}
                      height={400}
                      previewConfig={{ showPreview: false }}
                    />
                  </div>
                )}
              </div>
              <label className="px-4 py-2 rounded-xl bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition cursor-pointer text-sm font-medium">
                {uploading ? "Загрузка…" : "📷 Фото"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => handleFileUpload(e, "image")}
                />
              </label>
              <label className="px-4 py-2 rounded-xl bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition cursor-pointer text-sm font-medium">
                {uploading ? "Загрузка…" : "🎬 Видео"}
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => handleFileUpload(e, "video")}
                />
              </label>
              {(uploadedImageUrl || uploadedVideoUrl) && (
                <span className="text-sm text-indigo-600">
                  {uploadedImageUrl && "Фото загружено ✓"}
                  {uploadedImageUrl && uploadedVideoUrl && " · "}
                  {uploadedVideoUrl && "Видео загружено ✓"}
                </span>
              )}
              <div className="flex-1 min-w-[200px]">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Или ссылка на картинку"
                  className="w-full px-4 py-2 rounded-xl border border-indigo-200 focus:border-indigo-500 outline-none text-sm"
                />
              </div>
            </div>
            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {submitting ? "Отправка..." : "Оставить сообщение"}
            </button>
          </div>
        </form>

        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12 text-indigo-600">
              Загрузка сообщений...
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 bg-white/80 rounded-2xl border border-indigo-100 text-indigo-600">
              Пока никто не оставил сообщений. Будьте первым!
            </div>
          ) : (
            entries.map((entry) => (
              <article
                key={entry.id}
                className="bg-white/95 backdrop-blur rounded-2xl p-6 shadow-lg border border-indigo-100 animate-fade-in"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl flex-shrink-0">
                    {entry.emoji || "💕"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-indigo-900">
                        {entry.author}
                      </span>
                      <span className="text-sm text-indigo-500">
                        {formatDate(entry.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-indigo-800 whitespace-pre-wrap">
                      {entry.message}
                    </p>
                    {entry.image && (
                      <a
                        href={entry.image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 block"
                      >
                        <img
                          src={entry.image}
                          alt="Вложение"
                          className="max-w-full max-h-64 rounded-lg object-cover border border-indigo-100"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      </a>
                    )}
                    {entry.video && (
                      <div className="mt-3 rounded-lg overflow-hidden border border-indigo-100">
                        <video
                          src={entry.video}
                          controls
                          className="max-w-full max-h-80"
                          playsInline
                        >
                          Ваш браузер не поддерживает видео.
                        </video>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
