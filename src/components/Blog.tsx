"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface BlogPost {
  id: string;
  title: string;
  contentHtml: string;
  media: { url: string; type: "image" | "video" }[];
  createdAt: string;
}

export function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/blog")
      .then((r) => r.json())
      .then(setPosts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <section id="blog" className="py-20 scroll-mt-20">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-serif text-indigo-900 text-center mb-4">
          Наш блог
        </h2>
        <p className="text-indigo-600 text-center mb-12">
          Фото, мысли и новости на пути к свадьбе
        </p>

        {loading ? (
          <div className="text-center py-12 text-indigo-600">
            Загрузка...
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-white/80 rounded-2xl border border-indigo-100 text-indigo-600">
            Пока записей нет. Скоро появится что-то интересное!
          </div>
        ) : (
          <div className="space-y-12">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-white/95 backdrop-blur rounded-2xl overflow-hidden shadow-xl border border-indigo-100 animate-fade-in"
              >
                {post.media?.find((m) => m.type === "image") && (
                  <div className="relative h-64 md:h-80">
                    <Image
                      src={post.media.find((m) => m.type === "image")!.url}
                      alt={post.title}
                      fill
                      className="object-cover"
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 672px"
                    />
                  </div>
                )}
                <div className="p-6 md:p-8">
                  <time className="text-sm text-indigo-500">
                    {formatDate(post.createdAt)}
                  </time>
                  <h3 className="text-2xl font-serif text-indigo-900 mt-2 mb-4">
                    {post.title}
                  </h3>
                  <div
                    className="prose prose-indigo max-w-none"
                    dangerouslySetInnerHTML={{ __html: post.contentHtml }}
                  />

                  {Array.isArray(post.media) && post.media.length > 1 && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {post.media.slice(1).map((m, i) => (
                        <div
                          key={i}
                          className="rounded-lg overflow-hidden border border-indigo-100 bg-white"
                        >
                          {m.type === "image" ? (
                            <div className="relative aspect-video">
                              <Image
                                src={m.url}
                                alt=""
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <video
                              src={m.url}
                              controls
                              className="w-full"
                              playsInline
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
