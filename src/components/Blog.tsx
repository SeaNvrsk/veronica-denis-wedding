"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  images: string[];
  videoUrl?: string;
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
                {post.images.length > 0 && (
                  <div className="relative h-64 md:h-80">
                    <Image
                      src={post.images[0]}
                      alt={post.title}
                      fill
                      className="object-cover"
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 672px"
                    />
                  </div>
                )}
                {post.videoUrl && !post.images.length && (
                  <div className="aspect-video">
                    <iframe
                      src={post.videoUrl}
                      title={post.title}
                      className="w-full h-full"
                      allowFullScreen
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
                  <div className="text-indigo-800 whitespace-pre-wrap leading-relaxed">
                    {post.content}
                  </div>
                  {post.images.length > 1 && (
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
                      {post.images.slice(1).map((img, i) => (
                        <div
                          key={i}
                          className="relative aspect-square rounded-lg overflow-hidden"
                        >
                          <Image
                            src={img}
                            alt=""
                            fill
                            className="object-cover"
                            unoptimized
                          />
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
