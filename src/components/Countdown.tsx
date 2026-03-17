"use client";

import { useEffect, useState } from "react";

/** 21 марта 2026, 9:30 по Москве */
const WEDDING_DATE = new Date("2026-03-21T09:30:00+03:00");

function getTimeLeft() {
  const now = new Date(); // сравнение в UTC — логика корректна для любого часового пояса
  if (now >= WEDDING_DATE) {
    return null;
  }
  return WEDDING_DATE.getTime() - now.getTime();
}

function formatTimeLeft(ms: number) {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
}

export function Countdown() {
  const [timeLeft, setTimeLeft] = useState<number | null>(getTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      const left = getTimeLeft();
      setTimeLeft(left);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (timeLeft === null) {
    return (
      <div className="text-center py-16">
        <p className="text-2xl md:text-4xl font-serif text-indigo-800">
          Свадьба состоялась!
        </p>
        <p className="text-lg text-indigo-600 mt-2">21 марта 2026, 9:30</p>
      </div>
    );
  }

  const { days, hours, minutes, seconds } = formatTimeLeft(timeLeft);

  const units = [
    { value: days, label: "дней" },
    { value: hours, label: "часов" },
    { value: minutes, label: "минут" },
    { value: seconds, label: "секунд" },
  ];

  return (
    <section className="py-20 md:py-32">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-5xl font-serif text-indigo-900 mb-2">
          До свадьбы осталось
        </h2>
        <p className="text-lg text-indigo-600">
          21 марта 2026 · 9:30 · Сочи
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-4 md:gap-8">
        {units.map(({ value, label }) => (
          <div
            key={label}
            className="flex flex-col items-center bg-white/90 backdrop-blur rounded-2xl px-8 py-6 shadow-xl border border-indigo-100 min-w-[100px] animate-fade-in"
          >
            <span className="text-4xl md:text-6xl font-bold text-indigo-700 tabular-nums">
              {String(value).padStart(2, "0")}
            </span>
            <span className="text-sm md:text-base text-indigo-600 mt-1">
              {label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
