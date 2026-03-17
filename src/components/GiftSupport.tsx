"use client";

import { useMemo, useState } from "react";

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 active:bg-indigo-700 transition touch-manipulation"
    >
      {copied ? "Скопировано" : "Скопировать"}
    </button>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 justify-between rounded-xl bg-indigo-50 p-4 border border-indigo-100">
      <div className="min-w-0">
        <p className="text-sm font-medium text-indigo-700">{label}</p>
        <p className="text-indigo-900 font-semibold break-all">{value}</p>
      </div>
      <div className="self-start sm:self-center">
        <CopyButton value={value} />
      </div>
    </div>
  );
}

export function GiftSupport() {
  const items = useMemo(
    () => [
      { label: "Номер карты", value: "2200011703548538" },
      { label: "Получатель", value: "Головина Вероника Вахидовна" },
      { label: "Банк", value: "Газпромбанк" },
    ],
    []
  );

  return (
    <section id="gift" className="py-20 scroll-mt-20">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-serif text-indigo-900 text-center mb-4">
          Помочь молодожёнам
        </h2>
        <p className="text-indigo-600 text-center mb-10">
          Если вы хотите поддержать нашу семью — будем благодарны за вклад в
          мечту.
        </p>

        <div className="bg-white/95 backdrop-blur rounded-2xl p-6 md:p-8 shadow-xl border border-indigo-100 space-y-4">
          {items.map((it) => (
            <Field key={it.label} label={it.label} value={it.value} />
          ))}
          <p className="text-xs text-indigo-500 pt-2">
            Нажмите «Скопировать», чтобы быстро вставить реквизиты в банковское
            приложение.
          </p>
        </div>
      </div>
    </section>
  );
}

