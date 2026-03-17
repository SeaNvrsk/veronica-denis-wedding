import { PhotoStrip } from "@/components/PhotoStrip";
import { Countdown } from "@/components/Countdown";
import { GiftSupport } from "@/components/GiftSupport";
import { Guestbook } from "@/components/Guestbook";
import { Quiz } from "@/components/Quiz";
import { Blog } from "@/components/Blog";

export default function Home() {
  return (
    <div className="min-h-screen">
      <PhotoStrip />

      <header className="pt-36 md:pt-44 pb-8 text-center">
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-indigo-900 mb-2 drop-shadow-sm">
          Вероника & Денис
        </h1>
        <p className="text-xl md:text-2xl text-indigo-700 font-medium">
          Приглашаем разделить нашу радость
        </p>
      </header>

      <main className="px-4 pb-24 max-w-4xl mx-auto">
        <Countdown />

        <nav className="flex flex-wrap justify-center gap-3 sm:gap-4 py-8">
          <a
            href="#guestbook"
            className="px-5 py-3 sm:px-6 sm:py-2 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 active:bg-indigo-200 transition touch-manipulation"
          >
            Гостевой альбом
          </a>
          <a
            href="#quiz"
            className="px-5 py-3 sm:px-6 sm:py-2 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 active:bg-indigo-200 transition touch-manipulation"
          >
            Викторина
          </a>
          <a
            href="#blog"
            className="px-5 py-3 sm:px-6 sm:py-2 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 active:bg-indigo-200 transition touch-manipulation"
          >
            Блог
          </a>
          <a
            href="#gift"
            className="px-5 py-3 sm:px-6 sm:py-2 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 active:bg-indigo-200 transition touch-manipulation"
          >
            Помочь
          </a>
        </nav>

        <GiftSupport />
        <Guestbook />
        <Quiz />
        <Blog />
      </main>

      <footer className="py-8 pb-[max(2rem,env(safe-area-inset-bottom))] text-center text-indigo-500 text-sm">
        С любовью · 21 марта 2026 · Сочи
      </footer>
    </div>
  );
}
