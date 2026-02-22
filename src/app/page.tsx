import Link from "next/link";
import { PhotoStrip } from "@/components/PhotoStrip";
import { Countdown } from "@/components/Countdown";
import { Guestbook } from "@/components/Guestbook";
import { Quiz } from "@/components/Quiz";
import { Blog } from "@/components/Blog";

export default function Home() {
  return (
    <div className="min-h-screen">
      <PhotoStrip />

      <header className="pt-16 pb-8 text-center">
        <h1 className="text-4xl md:text-6xl font-serif text-indigo-900 mb-2">
          Вероника & Денис
        </h1>
        <p className="text-xl md:text-2xl text-indigo-600 font-light">
          Приглашаем на нашу свадьбу
        </p>
      </header>

      <main className="px-4 pb-24 max-w-4xl mx-auto">
        <Countdown />

        <nav className="flex flex-wrap justify-center gap-4 py-8">
          <a
            href="#guestbook"
            className="px-6 py-2 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition"
          >
            Гостевой альбом
          </a>
          <a
            href="#quiz"
            className="px-6 py-2 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition"
          >
            Викторина
          </a>
          <a
            href="#blog"
            className="px-6 py-2 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition"
          >
            Блог
          </a>
          <Link
            href="/admin"
            className="px-6 py-2 rounded-full border border-indigo-300 text-indigo-600 hover:bg-indigo-50 transition text-sm"
          >
            Админ
          </Link>
        </nav>

        <Guestbook />
        <Quiz />
        <Blog />
      </main>

      <footer className="py-8 text-center text-indigo-500 text-sm">
        С любовью · 21 марта 2026
      </footer>
    </div>
  );
}
